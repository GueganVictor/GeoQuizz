<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from '@/components/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useSyncStore } from '@/stores/sync'

// Account surface (Slice 6): email magic-link sign-in and cloud-sync status.
// Signing in on another device pulls + replays the same log → identical state.

const auth = useAuthStore()
const sync = useSyncStore()

const emailInput = ref('')
const sending = ref(false)
const error = ref<string | null>(null)

const validEmail = computed(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput.value.trim()))

const statusLabel = computed(() => {
  switch (sync.status) {
    case 'syncing':
      return 'Syncing…'
    case 'synced':
      return 'Synced'
    case 'offline':
      return 'Offline'
    case 'error':
      return 'Sync error'
    default:
      return 'Ready'
  }
})

async function sendLink() {
  if (!validEmail.value || sending.value) return
  sending.value = true
  error.value = null
  error.value = await auth.signIn(emailInput.value.trim())
  sending.value = false
}

async function signOut() {
  await auth.signOut()
  emailInput.value = ''
}
</script>

<template>
  <section class="page">
    <h1 class="title">Profile</h1>

    <!-- Supabase not configured: app still works fully offline. -->
    <div v-if="!auth.enabled" class="card">
      <div class="globe">🌍</div>
      <h2 class="card__title">Playing offline</h2>
      <p class="sub">Your progress is saved on this device. Cloud sync isn’t set up yet.</p>
    </div>

    <!-- Signed in -->
    <div v-else-if="auth.email" class="card">
      <div class="globe">🌍</div>
      <h2 class="card__title">Synced</h2>
      <p class="email">{{ auth.email }}</p>
      <div class="status" :class="`status--${sync.status}`">
        <span class="dot" />{{ statusLabel }}
      </div>
      <p v-if="sync.status === 'error'" class="err">{{ sync.lastError }}</p>
      <div class="actions">
        <AppButton block tone="region" :disabled="sync.status === 'syncing'" @click="sync.fullSync()">
          Sync now
        </AppButton>
        <AppButton block tone="plain" @click="signOut">Sign out</AppButton>
      </div>
    </div>

    <!-- Magic link sent -->
    <div v-else-if="auth.magicLinkSentTo" class="card">
      <div class="globe">📬</div>
      <h2 class="card__title">Check your inbox</h2>
      <p class="sub">We sent a sign-in link to <b>{{ auth.magicLinkSentTo }}</b>.</p>
    </div>

    <!-- Signed out -->
    <div v-else class="card">
      <div class="globe">🌍</div>
      <h2 class="card__title">Sync your progress</h2>
      <p class="sub">Sign in to keep your deck across devices.</p>
      <input
        v-model="emailInput"
        class="input"
        type="email"
        inputmode="email"
        autocomplete="email"
        placeholder="you@email.com"
        @keyup.enter="sendLink"
      />
      <p v-if="error" class="err">{{ error }}</p>
      <AppButton block tone="region" :disabled="!validEmail || sending" @click="sendLink">
        {{ sending ? 'Sending…' : 'Send magic link' }}
      </AppButton>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 38px;
  margin: 8px 0 0;
  color: #2b2b3a;
}

.card {
  background: #fff;
  border: 3px solid #222a33;
  border-radius: 28px;
  padding: 26px 22px 24px;
  text-align: center;
  box-shadow:
    0 6px 0 rgba(34, 42, 51, 0.16),
    0 12px 18px rgba(0, 0, 0, 0.08);
}
.globe {
  font-size: 64px;
  line-height: 1;
}
.card__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 26px;
  margin: 8px 0 4px;
  color: #2b2b3a;
}
.sub {
  margin: 0 0 16px;
  font-weight: 700;
  color: #6b6b7a;
}
.email {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-weight: 800;
  color: #2b2b3a;
}

.input {
  width: 100%;
  box-sizing: border-box;
  padding: 15px 18px;
  margin-bottom: 14px;
  border: 3px solid #222a33;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 17px;
  color: #2b2b3a;
  background: #f7f7fb;
}
.input::placeholder {
  color: #b3b3c2;
}
.input:focus {
  outline: none;
  background: #fff;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  margin-bottom: 16px;
  border-radius: 999px;
  border: 2px solid #e3e3ec;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14px;
  color: #6b6b7a;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #b3b3c2;
}
.status--synced .dot {
  background: var(--color-correct);
}
.status--syncing .dot {
  background: var(--region, var(--color-europe));
}
.status--error .dot {
  background: var(--color-wrong);
}

.err {
  margin: 0 0 14px;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-wrong);
}
</style>
