// Progress analytics (Slice 7): pure functions that turn the append-only review log
// and the replayed card state into the numbers behind the Map/Progress tab — the
// mastery map, per-region accuracy/retention, and the activity heatmap (DESIGN §8).
// No IndexedDB, no Vue: trivially testable and runs anywhere.

import { fsrs, type FSRS } from 'ts-fsrs'

import { cardId, isPass, SKILLS, type CardState, type ReviewEvent } from './types'

/** Shared FSRS instance (default FSRS-6 params) for retrievability estimates. */
const scheduler: FSRS = fsrs()

/**
 * Mastery level for a single card's stability, in days. 0 = no state yet; 1..4 ramp
 * from just-learning to long-term mastered. Thresholds track FSRS interval growth:
 * a fresh card sits at 1, an Easy-seeded / well-reviewed card climbs toward 4.
 */
export function cardLevel(stability: number | undefined): number {
  if (stability === undefined || stability <= 0) return 0
  if (stability < 2) return 1
  if (stability < 10) return 2
  if (stability < 30) return 3
  return 4
}

/** Highest mastery level the ramp reaches (full continent-hue saturation). */
export const MASTERY_MAX = 4

/**
 * Per-country mastery level (0..4). A country is only as mastered as its *weaker*
 * skill, so we take the min of its flag and location cards — a country with one
 * unlearned skill stays low. Countries with no events at all are absent from the map.
 */
export function countryMastery(states: Map<string, CardState>): Map<number, number> {
  const byCountry = new Map<number, number>()
  // Gather the country ids that have at least one card state.
  const countryIds = new Set<number>()
  for (const s of states.values()) countryIds.add(s.ref.countryId)

  for (const countryId of countryIds) {
    let level = MASTERY_MAX
    for (const skill of SKILLS) {
      const state = states.get(cardId(countryId, skill))
      level = Math.min(level, cardLevel(state?.card.stability))
    }
    byCountry.set(countryId, level)
  }
  return byCountry
}

/** Accuracy over real quiz answers (triage seeds excluded — they aren't answers). */
export interface Accuracy {
  answered: number
  correct: number
  /** Fraction in 0..1; 0 when nothing has been answered. */
  rate: number
}

function accuracyOf(events: ReviewEvent[]): Accuracy {
  let answered = 0
  let correct = 0
  for (const e of events) {
    if (e.via !== 'review') continue
    answered++
    if (isPass(e.rating)) correct++
  }
  return { answered, correct, rate: answered ? correct / answered : 0 }
}

/** Region accuracy split out per skill, plus the combined figure. */
export interface RegionAccuracy {
  overall: Accuracy
  flag: Accuracy
  location: Accuracy
}

export function regionAccuracy(events: ReviewEvent[]): RegionAccuracy {
  return {
    overall: accuracyOf(events),
    flag: accuracyOf(events.filter((e) => e.skill === 'flag')),
    location: accuracyOf(events.filter((e) => e.skill === 'location')),
  }
}

/**
 * Average predicted retention across introduced cards: the mean FSRS retrievability
 * (probability you'd recall the card right now). 0 when nothing is introduced.
 */
export function avgRetention(states: Map<string, CardState>, now: number = Date.now()): number {
  const date = new Date(now)
  let sum = 0
  let n = 0
  for (const s of states.values()) {
    if (s.lastReviewedAt === undefined) continue
    sum += scheduler.get_retrievability(s.card, date, false) as number
    n++
  }
  return n ? sum / n : 0
}

/** Count of countries at each mastery level, plus how many are fully mastered. */
export interface MasterySummary {
  /** Countries with mastery level === MASTERY_MAX. */
  mastered: number
  /** Countries with at least one card introduced. */
  introduced: number
  /** Total countries in the deck. */
  total: number
}

export function masterySummary(
  mastery: Map<number, number>,
  deckSize: number,
): MasterySummary {
  let mastered = 0
  for (const level of mastery.values()) if (level >= MASTERY_MAX) mastered++
  return { mastered, introduced: mastery.size, total: deckSize }
}

/** Local-day key `YYYY-MM-DD` for an epoch-ms timestamp. */
export function dayKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Reviews logged per local day, keyed by `dayKey`. Drives the activity heatmap. */
export function activityByDay(events: ReviewEvent[]): Map<string, number> {
  const byDay = new Map<string, number>()
  for (const e of events) {
    const key = dayKey(e.ts)
    byDay.set(key, (byDay.get(key) ?? 0) + 1)
  }
  return byDay
}
