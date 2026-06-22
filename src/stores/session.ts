// Session store (Slice 2): the headless card engine the future session runner and
// home screen draw on. Loads the append-only review log from IndexedDB on init,
// derives card state by replay, and exposes "next due/new card" + "record a grade".

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { EUROPE } from '@/data'

import { allEvents, appendEvent, clearLog } from '@/engine/db'
import { replayCard, replayLog } from '@/engine/replay'
import { dailyStreak } from '@/engine/streak'
import {
  dueCards,
  firstSeenByCountry,
  nextCard as pickNextCard,
  sessionPlanCount,
} from '@/engine/scheduler'
import {
  cardId,
  SKILLS,
  type CardRef,
  type CardState,
  type Rating,
  type ReviewEvent,
  type ScheduledCard,
  type Skill,
} from '@/engine/types'

/** Europe is the only deck in v1 (DESIGN §9). */
const DECK_COUNTRY_IDS = EUROPE.map((c) => c.id)

export const useSessionStore = defineStore('session', () => {
  /** Append-only log, in write order. The single source of truth. */
  const events = ref<ReviewEvent[]>([])
  /** Derived card state, rebuilt by replay. Keyed by cardId. */
  const states = ref<Map<string, CardState>>(new Map())
  const loaded = ref(false)

  /** Load the persisted log and replay it. Idempotent; survives reload. */
  async function init(): Promise<void> {
    if (loaded.value) return
    events.value = await allEvents()
    states.value = replayLog(events.value)
    loaded.value = true
  }

  /** Distinct countries first introduced today — the new-card budget spend. */
  function introducedToday(now: number): Set<number> {
    const first = firstSeenByCountry(events.value)
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    const today = new Set<number>()
    for (const [countryId, ts] of first) {
      if (ts >= dayStart.getTime()) today.add(countryId)
    }
    return today
  }

  /** The next card to show: earliest due review, else a capped new card (or null). */
  function nextCard(now: number = Date.now()): ScheduledCard | null {
    return pickNextCard(DECK_COUNTRY_IDS, states.value, { now }, introducedToday(now))
  }

  /** Cards a session starting `now` can serve — the progress denominator (Slice 3). */
  function plannedCount(now: number = Date.now()): number {
    return sessionPlanCount(DECK_COUNTRY_IDS, states.value, { now }, introducedToday(now))
  }

  /** Re-derive and store a single card's state from its events in the in-memory log. */
  function refreshCard(id: string): void {
    const own = events.value.filter((e) => e.cardId === id)
    const next = new Map(states.value)
    next.set(id, replayCard(id, own))
    states.value = next
  }

  /**
   * Record a grade for one card: append to the log (persisted), then update state.
   * `via` distinguishes a real quiz answer from an onboarding triage seed (DESIGN §3).
   */
  async function recordGrade(
    ref: CardRef,
    rating: Rating,
    opts: { now?: number; via?: ReviewEvent['via'] } = {},
  ): Promise<void> {
    const event: ReviewEvent = {
      cardId: ref.id,
      countryId: ref.countryId,
      skill: ref.skill,
      rating,
      ts: opts.now ?? Date.now(),
      via: opts.via ?? 'review',
    }
    const seq = await appendEvent(event)
    events.value.push({ ...event, seq })
    refreshCard(ref.id)
  }

  /**
   * Calibration-seeding hook (DESIGN §3): seed both skill cards of a country with one
   * triage rating. The triage→FSRS rating mapping is decided in Slice 5; this just
   * records the seed events as the first entries in the log.
   */
  async function seedCountry(
    countryId: number,
    rating: Rating,
    now: number = Date.now(),
  ): Promise<void> {
    for (const skill of SKILLS) {
      const ref: CardRef = { id: cardId(countryId, skill), countryId, skill }
      await recordGrade(ref, rating, { now, via: 'triage' })
    }
  }

  /** Reset everything (dev/test only). */
  async function reset(): Promise<void> {
    await clearLog()
    events.value = []
    states.value = new Map()
  }

  const dueCount = computed(() => dueCards(states.value, Date.now()).length)
  const introducedCount = computed(() => states.value.size)
  const newCountTodayUsed = computed(() => introducedToday(Date.now()).size)
  /** Consecutive-day habit streak for the daily home (Slice 4). */
  const streak = computed(() => dailyStreak(events.value, Date.now()))

  return {
    // state
    events,
    states,
    loaded,
    // getters
    dueCount,
    introducedCount,
    newCountTodayUsed,
    streak,
    // actions
    init,
    nextCard,
    plannedCount,
    recordGrade,
    seedCountry,
    reset,
    // re-exports for convenience
    cardId,
  } as const
})

export type { CardRef, ScheduledCard, Skill }
