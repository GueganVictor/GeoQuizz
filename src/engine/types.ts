// Card engine types (Slice 2). Headless scheduling layer that sits between the
// country catalog (src/data) and the future session runner (Slice 3).

import type { Card as FsrsCard } from 'ts-fsrs'
import { Rating } from 'ts-fsrs'

export { Rating } from 'ts-fsrs'
export type { Card as FsrsCard } from 'ts-fsrs'

/** The two quizzed skills (DESIGN §2). A card is one (country × skill) pair. */
export type Skill = 'flag' | 'location'

export const SKILLS: readonly Skill[] = ['flag', 'location'] as const

/** Identifies a single card. `id` is the stable string key `${countryId}:${skill}`. */
export interface CardRef {
  id: string
  countryId: number
  skill: Skill
}

/**
 * One immutable entry in the append-only review log (DESIGN §7). Card state is
 * never stored — it is recomputed by replaying these events in order, which keeps
 * sync conflict-free and doubles as full history for stats.
 */
export interface ReviewEvent {
  /** IndexedDB autoincrement key; assigned on write, defines append order. */
  seq?: number
  cardId: string
  countryId: number
  skill: Skill
  /** FSRS grade (Again/Hard/Good/Easy). */
  rating: Rating
  /** Epoch milliseconds the review/seed happened. */
  ts: number
  /** `review` = a real quiz answer; `triage` = an onboarding calibration seed (DESIGN §3). */
  via: 'review' | 'triage'
}

/** Derived (never persisted) FSRS state for one card, rebuilt by replay. */
export interface CardState {
  ref: CardRef
  card: FsrsCard
  /** Epoch ms of the last event applied, or undefined for a brand-new card. */
  lastReviewedAt?: number
}

/** A card the scheduler has selected to show next, tagged with why. */
export interface ScheduledCard {
  ref: CardRef
  /** `due` = an FSRS review that came due; `new` = a not-yet-introduced card. */
  kind: 'due' | 'new'
}

/** Build the stable card id for a (country, skill) pair. */
export function cardId(countryId: number, skill: Skill): string {
  return `${countryId}:${skill}`
}

/** All cards for a deck of countries — both skills per country. */
export function cardsForDeck(countryIds: number[]): CardRef[] {
  const refs: CardRef[] = []
  for (const countryId of countryIds) {
    for (const skill of SKILLS) {
      refs.push({ id: cardId(countryId, skill), countryId, skill })
    }
  }
  return refs
}

/** True for grades that count as a successful recall (everything but Again). */
export function isPass(rating: Rating): boolean {
  return rating !== Rating.Again
}
