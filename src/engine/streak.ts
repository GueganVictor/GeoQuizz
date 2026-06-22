// Daily-habit streak (Slice 4): consecutive calendar days with activity, derived
// from the append-only review log (DESIGN §8 — "daily streak"). Pure, no IndexedDB.

/** Epoch ms of local midnight starting the day that contains `ts`. */
function startOfLocalDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Local midnight of the day before `dayStart` (DST-safe via calendar arithmetic). */
function prevDay(dayStart: number): number {
  const d = new Date(dayStart)
  d.setDate(d.getDate() - 1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/**
 * Length of the current daily streak: the run of consecutive local days, ending
 * today (or yesterday — a streak stays alive until a full day is missed), on which
 * at least one event was logged. Any event counts as activity, so the onboarding
 * triage seeds day one.
 */
export function dailyStreak(events: { ts: number }[], now: number = Date.now()): number {
  if (events.length === 0) return 0

  const activeDays = new Set<number>()
  for (const e of events) activeDays.add(startOfLocalDay(e.ts))

  let cursor = startOfLocalDay(now)
  if (!activeDays.has(cursor)) {
    // Not played yet today — the streak survives only if yesterday was active.
    cursor = prevDay(cursor)
    if (!activeDays.has(cursor)) return 0
  }

  let count = 0
  while (activeDays.has(cursor)) {
    count += 1
    cursor = prevDay(cursor)
  }
  return count
}
