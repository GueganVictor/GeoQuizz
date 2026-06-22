// Settings store (Slice 8): playful SFX + haptics, on by default with a toggle
// (DESIGN §11). Persisted to localStorage so the choice survives reloads — these
// are device preferences, deliberately NOT part of the synced review log.

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const KEY = 'geoquizz:settings'

type Persisted = { sound: boolean; haptics: boolean }

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>
      return { sound: p.sound ?? true, haptics: p.haptics ?? true }
    }
  } catch {
    // ignore malformed / unavailable storage — fall back to defaults
  }
  return { sound: true, haptics: true }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = load()
  const sound = ref(initial.sound)
  const haptics = ref(initial.haptics)

  watch([sound, haptics], () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ sound: sound.value, haptics: haptics.value }))
    } catch {
      // storage unavailable (private mode) — preference just won't persist
    }
  })

  function toggleSound() {
    sound.value = !sound.value
  }
  function toggleHaptics() {
    haptics.value = !haptics.value
  }

  return { sound, haptics, toggleSound, toggleHaptics }
})
