// Sync orchestration (Slice 6). Ties auth + the local log to the cloud:
//  • on sign-in (or reconnect) run a full sync — push the whole local log, pull the
//    user's remote log, merge new events, and replay. This is what lets a second
//    device reconstruct identical card state (the slice's done-when).
//  • on every new local event, push it (debounced; upsert is idempotent).
// All of this is a no-op when Supabase isn't configured or no one is signed in.

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { pullEvents, pushEvents } from '@/engine/sync'

import { useAuthStore } from './auth'
import { useSessionStore } from './session'

type Status = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

export const useSyncStore = defineStore('sync', () => {
  const auth = useAuthStore()
  const session = useSessionStore()

  const status = ref<Status>('idle')
  const lastSyncedAt = ref<number | null>(null)
  const lastError = ref<string | null>(null)

  const active = computed(() => auth.enabled && Boolean(auth.userId))

  let pushTimer: ReturnType<typeof setTimeout> | null = null

  /** Push the whole local log, pull the remote log, merge + replay. */
  async function fullSync(): Promise<void> {
    const userId = auth.userId
    if (!userId) return
    if (!navigator.onLine) {
      status.value = 'offline'
      return
    }
    status.value = 'syncing'
    lastError.value = null
    try {
      await pushEvents(session.events, userId)
      const remote = await pullEvents(userId)
      await session.mergeRemote(remote)
      lastSyncedAt.value = Date.now()
      status.value = 'synced'
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : String(e)
      status.value = 'error'
    }
  }

  /** Push local events (idempotent). Used after a review is recorded. */
  async function pushLocal(): Promise<void> {
    const userId = auth.userId
    if (!userId || !navigator.onLine) return
    try {
      await pushEvents(session.events, userId)
      lastSyncedAt.value = Date.now()
      if (status.value !== 'syncing') status.value = 'synced'
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : String(e)
      status.value = 'error'
    }
  }

  /** Wire reactive triggers. Call once at app startup (after auth.init). */
  function start(): void {
    if (!auth.enabled) return

    // Sign-in / sign-out: full sync when a user becomes active.
    watch(
      () => auth.userId,
      (id) => {
        if (id) void fullSync()
        else status.value = 'idle'
      },
      { immediate: true },
    )

    // New local events: debounce a push (covers reviews + triage seeds).
    watch(
      () => session.events.length,
      () => {
        if (!active.value) return
        if (pushTimer) clearTimeout(pushTimer)
        pushTimer = setTimeout(() => void pushLocal(), 800)
      },
    )

    // Reconnect: re-run a full sync.
    window.addEventListener('online', () => {
      if (active.value) void fullSync()
    })
  }

  return {
    status,
    lastSyncedAt,
    lastError,
    active,
    fullSync,
    pushLocal,
    start,
  } as const
})
