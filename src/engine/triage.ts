// Onboarding calibration triage (DESIGN §3). A first-run, combined per-country
// self-assessment that seeds *both* skill cards with initial FSRS state. The only
// lever into the FSRS replay model is the rating we log, so each triage verdict
// maps to the grade that produces the intended starting interval:
//
//   know → mastered / long interval  → Easy   (won't clog daily reviews)
//   sort → enters active review soon  → Hard   (knows it, but needs practice)
//   none → enters learning right away → Again  (full learn-from-scratch)
//
// "Sort of" and "No idea" both become due quickly (DESIGN §3); "Know it" graduates
// to a multi-day interval so the big, well-known countries clear out of the way.

import { Rating } from './types'

/** The three triage taps shown per country. */
export type TriageVerdict = 'know' | 'sort' | 'none'

/** Display metadata for the triage choices, in confidence order (most → least). */
export const TRIAGE_CHOICES: readonly { verdict: TriageVerdict; label: string; emoji: string }[] = [
  { verdict: 'know', label: 'Know it', emoji: '😎' },
  { verdict: 'sort', label: 'Sort of', emoji: '🤔' },
  { verdict: 'none', label: 'No idea', emoji: '🤷' },
] as const

/** Map a triage verdict to the FSRS grade that seeds the intended starting state. */
export function triageRating(verdict: TriageVerdict): Rating {
  switch (verdict) {
    case 'know':
      return Rating.Easy
    case 'sort':
      return Rating.Hard
    case 'none':
      return Rating.Again
  }
}
