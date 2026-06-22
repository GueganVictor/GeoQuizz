// Auth store (Slice 6): email magic-link sign-in via Supabase. Holds the current
// session/user and exposes sign-in / sign-out. When Supabase isn't configured the
// store stays inert (`enabled` false) and the app runs purely local-first.

import type { Session, User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { supabase, supabaseEnabled } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const ready = ref(false)
  /** Set briefly after a magic link is sent, to show the "check your inbox" state. */
  const magicLinkSentTo = ref<string | null>(null)

  const enabled = computed(() => supabaseEnabled)
  const user = computed<User | null>(() => session.value?.user ?? null)
  const userId = computed<string | null>(() => session.value?.user.id ?? null)
  const email = computed<string | null>(() => session.value?.user.email ?? null)

  /** Load any persisted session and subscribe to auth changes. Call once at startup. */
  async function init(): Promise<void> {
    if (ready.value || !supabase) {
      ready.value = true
      return
    }
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    supabase.auth.onAuthStateChange((_event, next) => {
      session.value = next
      if (next) magicLinkSentTo.value = null
    })
    ready.value = true
  }

  /** Send a passwordless magic link to `addr`; returns an error message or null. */
  async function signIn(addr: string): Promise<string | null> {
    if (!supabase) return 'Cloud sync is not configured.'
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) return error.message
    magicLinkSentTo.value = addr
    return null
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
    session.value = null
  }

  return {
    session,
    ready,
    magicLinkSentTo,
    enabled,
    user,
    userId,
    email,
    init,
    signIn,
    signOut,
  } as const
})
