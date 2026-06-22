<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from '@/components/AppButton.vue'
import { flagUrl } from '@/data'
import type { Country } from '@/data'

// One flag → country multiple-choice question (DESIGN §11: big flag hero + 2×2
// name cards). Self-contained: owns selection, the Check step, and the objective
// reveal; emits the result so the session runner can drive grading + the sheet.
const props = defineProps<{
  /** The correct country (its flag is shown). */
  country: Country
  /** The four options to render, including `country`, pre-shuffled by the caller. */
  options: Country[]
}>()

const emit = defineEmits<{ answered: [correct: boolean] }>()

const selected = ref<Country | null>(null)
const revealed = ref(false)

function select(c: Country) {
  if (!revealed.value) selected.value = c
}

function check() {
  if (!selected.value || revealed.value) return
  revealed.value = true
  emit('answered', selected.value.id === props.country.id)
}

function optionClass(c: Country) {
  if (!revealed.value) {
    return selected.value?.id === c.id ? 'opt opt--sel' : 'opt'
  }
  if (c.id === props.country.id) return 'opt opt--correct'
  if (c.id === selected.value?.id) return 'opt opt--wrong'
  return 'opt opt--dim'
}

const canCheck = computed(() => selected.value !== null && !revealed.value)
</script>

<template>
  <div class="card">
    <main class="body">
      <h1 class="title">Which country?</h1>

      <div class="flagwrap">
        <img :src="flagUrl(country.iso2)" alt="" class="flag" />
      </div>

      <div class="grid">
        <button
          v-for="c in options"
          :key="c.id"
          :class="['gloss', optionClass(c)]"
          :disabled="revealed"
          @click="select(c)"
        >
          <span class="lbl">{{ c.name }}</span>
        </button>
      </div>
    </main>

    <footer class="foot">
      <AppButton block :disabled="!canCheck" @click="check">Check</AppButton>
    </footer>
  </div>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.body {
  flex: 1;
  padding: 12px 22px;
}
.title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 30px;
  margin: 8px 0 22px;
  color: #2b2b3a;
}

.flagwrap {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}
.flag {
  width: 200px;
  height: 134px;
  object-fit: cover;
  border-radius: 22px;
  border: 3px solid #222a33;
  box-shadow: 0 6px 0 rgba(34, 42, 51, 0.18), 0 10px 16px rgba(0, 0, 0, 0.12);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Option cards reuse the shared video-game button base (.gloss from AppButton's
   visual language); the fill flips on reveal to the reserved feedback colors. */
.gloss {
  position: relative;
  border: 3px solid #222a33;
  border-radius: 999px;
  cursor: pointer;
  overflow: hidden;
  font-family: var(--font-display);
  font-weight: 800;
  color: #2b2b3a;
  box-shadow: 0 5px 0 rgba(34, 42, 51, 0.22), 0 9px 12px rgba(0, 0, 0, 0.14);
  transition: transform 0.08s ease, box-shadow 0.08s ease, filter 0.15s ease;
}
.gloss .lbl {
  position: relative;
  z-index: 1;
}
.gloss:active:not(:disabled) {
  transform: translateY(5px);
  box-shadow: 0 0 0 rgba(34, 42, 51, 0.22), 0 3px 5px rgba(0, 0, 0, 0.14);
}
.gloss:disabled {
  cursor: default;
}

.opt {
  padding: 18px 10px;
  font-size: 16px;
  background: #fff;
}
.opt--sel {
  color: #fff;
  background: var(--region, var(--color-europe));
}
.opt--correct {
  color: #fff;
  background: var(--color-correct);
}
.opt--wrong {
  color: #fff;
  background: var(--color-wrong);
}
.opt--dim {
  filter: saturate(0.6) opacity(0.4);
}

.foot {
  padding: 16px 22px;
}
</style>
