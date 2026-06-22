// Replay: derive current card state from the append-only review log (DESIGN §7).
// Pure (no IndexedDB) so it is trivially testable and runs anywhere.

import { createEmptyCard, fsrs, type FSRS, type Grade } from 'ts-fsrs'

import { type CardRef, type CardState, type ReviewEvent, type Skill } from './types'

/** Single shared scheduler instance (default FSRS-6 parameters). */
const scheduler: FSRS = fsrs()

function refFromId(cardId: string): CardRef {
  const [countryStr, skill] = cardId.split(':')
  return { id: cardId, countryId: Number(countryStr), skill: skill as Skill }
}

/**
 * Fold a card's events (in chronological order) into its current FSRS state.
 * Events are sorted by timestamp, then by `uid` as a stable tiebreak. The tiebreak
 * is the device-independent `uid` (not the local `seq`) so two devices that pulled
 * the same log replay it in identical order (DESIGN §7, Slice 6).
 */
export function replayCard(cardId: string, events: ReviewEvent[]): CardState {
  const ordered = [...events].sort(
    (a, b) => a.ts - b.ts || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0),
  )
  const first = ordered[0]
  let card = createEmptyCard(first ? new Date(first.ts) : new Date())
  let lastReviewedAt: number | undefined
  for (const e of ordered) {
    // Logged ratings are always real grades (Again/Hard/Good/Easy), never Manual.
    card = scheduler.next(card, new Date(e.ts), e.rating as Grade).card
    lastReviewedAt = e.ts
  }
  return { ref: refFromId(cardId), card, lastReviewedAt }
}

/**
 * Replay the whole log into a map of cardId → derived state. Only cards that have
 * at least one event appear (i.e. cards that have been "introduced").
 */
export function replayLog(events: ReviewEvent[]): Map<string, CardState> {
  const byCard = new Map<string, ReviewEvent[]>()
  for (const e of events) {
    const list = byCard.get(e.cardId)
    if (list) list.push(e)
    else byCard.set(e.cardId, [e])
  }
  const states = new Map<string, CardState>()
  for (const [id, list] of byCard) states.set(id, replayCard(id, list))
  return states
}
