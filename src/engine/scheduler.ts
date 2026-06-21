// Scheduler: choose the next card to show — due reviews first, then a capped daily
// stream of brand-new countries drawn at random (DESIGN §4). Pure (no IndexedDB).

import { cardsForDeck, type CardRef, type CardState, type ScheduledCard } from './types'

/** New countries introduced per day (= up to 30 new cards, flag + location). DESIGN §4. */
export const NEW_COUNTRIES_PER_DAY = 15

export interface ScheduleConfig {
  /** "Now" in epoch ms (injectable for testing). */
  now: number
  /** Daily new-country cap. */
  newPerDay?: number
  /** Random source in [0,1) (injectable for deterministic testing). */
  rand?: () => number
}

/** Epoch ms of local midnight starting the day that contains `ts`. */
function startOfLocalDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Distinct countries whose *first ever* event landed today — the new-card spend. */
export function newCountriesToday(states: Map<string, CardState>, now: number): Set<number> {
  const dayStart = startOfLocalDay(now)
  // First-introduction time per country = the earliest lastReviewedAt across its skills
  // is not enough; use each card's first event. We only have derived state here, so we
  // approximate "introduced today" with the card whose first review is today. Callers
  // that need exactness pass the raw log via firstSeenByCountry().
  const firstByCountry = new Map<number, number>()
  for (const s of states.values()) {
    const t = s.lastReviewedAt
    if (t === undefined) continue
    const prev = firstByCountry.get(s.ref.countryId)
    if (prev === undefined || t < prev) firstByCountry.set(s.ref.countryId, t)
  }
  const today = new Set<number>()
  for (const [countryId, t] of firstByCountry) {
    if (t >= dayStart) today.add(countryId)
  }
  return today
}

/**
 * Exact "first seen" time per country from the raw log. Preferred over the derived
 * approximation in newCountriesToday when the full log is available.
 */
export function firstSeenByCountry(
  events: { countryId: number; ts: number }[],
): Map<number, number> {
  const first = new Map<number, number>()
  for (const e of events) {
    const prev = first.get(e.countryId)
    if (prev === undefined || e.ts < prev) first.set(e.countryId, e.ts)
  }
  return first
}

/** Due cards (state.due <= now), earliest-due first. */
export function dueCards(states: Map<string, CardState>, now: number): CardState[] {
  const due: CardState[] = []
  for (const s of states.values()) {
    if (s.card.due.getTime() <= now) due.push(s)
  }
  due.sort((a, b) => a.card.due.getTime() - b.card.due.getTime())
  return due
}

/**
 * Pick the next card for the whole deck.
 *
 * Priority:
 *  1. The earliest due review among already-introduced cards.
 *  2. Otherwise a new card: finish the second skill of a country already started today
 *     for free, else introduce a brand-new country at random while the daily cap allows.
 *
 * `introducedToday` (distinct countries first-seen today) should come from the raw log
 * via firstSeenByCountry() for accuracy; falls back to the derived approximation.
 */
export function nextCard(
  deckCountryIds: number[],
  states: Map<string, CardState>,
  config: ScheduleConfig,
  introducedToday?: Set<number>,
): ScheduledCard | null {
  const { now, newPerDay = NEW_COUNTRIES_PER_DAY, rand = Math.random } = config

  const due = dueCards(states, now)
  if (due[0]) return { ref: due[0].ref, kind: 'due' }

  const startedToday = introducedToday ?? newCountriesToday(states, now)
  const allCards = cardsForDeck(deckCountryIds)

  // Cards with no state yet, split by whether their country is already in play today.
  const newOfStartedCountry: CardRef[] = []
  const newCountryCards = new Map<number, CardRef[]>()
  for (const ref of allCards) {
    if (states.has(ref.id)) continue
    if (startedToday.has(ref.countryId)) {
      newOfStartedCountry.push(ref)
    } else {
      const list = newCountryCards.get(ref.countryId)
      if (list) list.push(ref)
      else newCountryCards.set(ref.countryId, [ref])
    }
  }

  // Finishing an already-started country is free (doesn't consume the daily budget),
  // but only if that country isn't already fully introduced via existing states.
  for (const ref of newOfStartedCountry) {
    return { ref, kind: 'new' }
  }

  // Introduce a brand-new country if the daily budget remains.
  if (startedToday.size >= newPerDay) return null
  const candidates = [...newCountryCards.keys()]
  if (candidates.length === 0) return null
  const pick = candidates[Math.floor(rand() * candidates.length)]!
  const cards = newCountryCards.get(pick)!
  return { ref: cards[0]!, kind: 'new' }
}
