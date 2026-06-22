// Supabase client (Slice 6). Reads credentials from the Vite env. When they are
// absent (e.g. a fresh checkout with no `.env`), the client is null and the app
// stays in its fully-working local-first mode — auth/sync UI just shows as
// unavailable rather than crashing.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when cloud sync is configured; gates all auth/sync features. */
export const supabaseEnabled = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        // Persist the session and recover it from the magic-link redirect hash.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** One row in the `review_log` table — the wire shape of a ReviewEvent. */
export interface ReviewLogRow {
  uid: string
  user_id: string
  card_id: string
  country_id: number
  skill: string
  rating: number
  ts: number
  via: string
}
