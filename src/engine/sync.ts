// Cloud sync data-access (Slice 6). Pushes the local append-only log to Supabase
// and pulls a user's remote log back. Both directions are conflict-free because
// each event carries a stable `uid` (DESIGN §7): push upserts ignoring duplicates,
// pull hands rows to db.mergeEvents which skips uids already held locally.

import { supabase, type ReviewLogRow } from '@/lib/supabase'

import type { Rating, ReviewEvent, Skill } from './types'

const TABLE = 'review_log'

function toRow(event: ReviewEvent, userId: string): ReviewLogRow {
  return {
    uid: event.uid,
    user_id: userId,
    card_id: event.cardId,
    country_id: event.countryId,
    skill: event.skill,
    rating: event.rating,
    ts: event.ts,
    via: event.via,
  }
}

function fromRow(row: ReviewLogRow): ReviewEvent {
  return {
    uid: row.uid,
    cardId: row.card_id,
    countryId: row.country_id,
    skill: row.skill as Skill,
    rating: row.rating as Rating,
    ts: row.ts,
    via: row.via as ReviewEvent['via'],
  }
}

/**
 * Push local events to the user's remote log. Upsert on `uid` ignoring duplicates,
 * so re-pushing the whole log is idempotent and safe to call on every change.
 */
export async function pushEvents(events: ReviewEvent[], userId: string): Promise<void> {
  if (!supabase || events.length === 0) return
  const rows = events.map((e) => toRow(e, userId))
  const { error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: 'uid', ignoreDuplicates: true })
  if (error) throw error
}

/** Pull the user's entire remote log, ordered by ts (replay order). */
export async function pullEvents(userId: string): Promise<ReviewEvent[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('ts', { ascending: true })
  if (error) throw error
  return (data as ReviewLogRow[]).map(fromRow)
}
