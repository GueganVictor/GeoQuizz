<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/AppButton.vue'
import { contextForContinent, REGION_FRAMES, WORLD, flagUrl, shapesForContinent } from '@/data'
import type { Country } from '@/data'
import { TRIAGE_CHOICES, triageRating, type TriageVerdict } from '@/engine/triage'
import { useSessionStore } from '@/stores/session'

// First-run calibration triage (Slice 5, DESIGN §3). A single combined pass over
// the deck: for each country we show flag + name + location and ask "Know it /
// Sort of / No idea". Each verdict seeds *both* skill cards (flag + location) with
// initial FSRS state, so the daily loop afterwards schedules accordingly. It runs
// once — the home screen routes here only while the review log is empty.

const router = useRouter()
const session = useSessionStore()

/** Calibration triage covers the top 100 countries by population (DESIGN §3). */
const TRIAGE_TOP = 100

// Phases of the flow: a mascot intro, the per-country taps, then a celebration.
type Phase = 'intro' | 'triage' | 'done'
const phase = ref<Phase>('intro')

// The countries still to triage (population-descending, DESIGN §3). On a fresh log
// this is the whole deck; if a half-finished pass was interrupted we resume on the
// untouched countries only.
const queue = ref<Country[]>([])
const index = ref(0)
const busy = ref(false)

const total = ref(0)
const current = computed<Country | null>(() => queue.value[index.value] ?? null)
// Each card adopts its country's continent frame, shapes and hue (DESIGN §11).
const frame = computed(() => (current.value ? REGION_FRAMES[current.value.continent] : null))
const shapes = computed(() => (current.value ? shapesForContinent(current.value.continent) : []))
const context = computed(() => (current.value ? contextForContinent(current.value.continent) : []))
const regionStyle = computed(() =>
  current.value ? `--region: var(--color-${current.value.continent})` : '',
)
const progress = computed(() =>
  total.value === 0 ? 0 : Math.min(100, (index.value / total.value) * 100),
)

function begin() {
  phase.value = 'triage'
}

/** Record one verdict, seed both cards, advance (or finish). */
async function choose(verdict: TriageVerdict) {
  const country = current.value
  if (!country || busy.value) return
  busy.value = true
  await session.seedCountry(country.id, triageRating(verdict))
  index.value += 1
  busy.value = false
  if (index.value >= queue.value.length) phase.value = 'done'
}

function finish() {
  router.replace('/')
}

onMounted(async () => {
  await session.init()
  // The top 100 countries by population (largest first, DESIGN §3) …
  const top = [...WORLD].sort((a, b) => b.population - a.population).slice(0, TRIAGE_TOP)
  // … resume-safe: triage only those with no events yet.
  const introduced = session.introducedCountryIds
  queue.value = top.filter((c) => !introduced.has(c.id))
  total.value = queue.value.length
  if (total.value === 0) phase.value = 'done'
})
</script>

<template>
  <div class="onboard" :style="regionStyle">
    <!-- Intro: mascot sets up the one-time calibration (DESIGN §11 onboarding) -->
    <main v-if="phase === 'intro'" class="intro">
      <div class="globe">🌍</div>
      <h1 class="intro__title">Let's tune your deck</h1>
      <p class="intro__sub">
        Quick pass through the best-known countries — tell us what you already know so we
        focus on the rest.
      </p>
      <AppButton block @click="begin">Let's go</AppButton>
    </main>

    <!-- Per-country triage card -->
    <template v-else-if="phase === 'triage' && current">
      <header class="bar">
        <div class="track"><div class="track__fill" :style="{ width: progress + '%' }" /></div>
        <div class="count">{{ index + 1 }}/{{ total }}</div>
      </header>

      <main class="body">
        <h1 class="title">{{ current.name }}</h1>

        <div class="flagwrap">
          <img :key="current.id" :src="flagUrl(current.iso2)" alt="" class="flag" />
        </div>

        <div class="mapcard">
          <svg class="map" :viewBox="`0 0 ${frame?.width ?? 0} ${frame?.height ?? 0}`" role="img">
            <path v-for="s in context" :key="`ctx-${s.id}`" :d="s.d" class="context" />
            <path
              v-for="s in shapes"
              :key="s.id"
              :d="s.d"
              :class="['country', { 'country--here': s.id === current.id }]"
            />
          </svg>
        </div>
      </main>

      <footer class="foot">
        <AppButton
          v-for="c in TRIAGE_CHOICES"
          :key="c.verdict"
          tone="plain"
          block
          :disabled="busy"
          @click="choose(c.verdict)"
        >
          <span class="choice__emoji">{{ c.emoji }}</span>
          {{ c.label }}
        </AppButton>
      </footer>
    </template>

    <!-- Celebration: deck is calibrated, hand off to the daily loop -->
    <main v-else class="intro">
      <div class="globe">🎉</div>
      <h1 class="intro__title">You're all set!</h1>
      <p class="intro__sub">Your deck is tuned. Here's what's waiting for you today.</p>
      <AppButton block @click="finish">See today</AppButton>
    </main>
  </div>
</template>

<style scoped>
.onboard {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* Intro + done share the centered mascot layout */
.intro {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 22px;
  gap: 8px;
}
.globe {
  font-size: 96px;
  line-height: 1;
  margin-bottom: 8px;
}
.intro__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 32px;
  margin: 0;
  color: #2b2b3a;
}
.intro__sub {
  margin: 0 0 22px;
  font-weight: 700;
  color: #6b6b7a;
  max-width: 280px;
}

/* Progress bar (mirrors QuizChrome, without close/streak) */
.bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 8px;
}
.track {
  flex: 1;
  height: 14px;
  background: #ededf3;
  border-radius: 999px;
  overflow: hidden;
}
.track__fill {
  height: 100%;
  background: var(--region, var(--color-europe));
  border-radius: 999px;
  transition: width 0.3s ease;
}
.count {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14px;
  color: #b8b8c8;
}

.body {
  flex: 1;
  padding: 6px 22px;
}
.title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 30px;
  margin: 8px 0 18px;
  color: #2b2b3a;
  text-align: center;
}

.flagwrap {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}
.flag {
  width: 164px;
  height: 110px;
  object-fit: cover;
  border-radius: 20px;
  border: 3px solid #222a33;
  box-shadow: 0 6px 0 rgba(34, 42, 51, 0.18), 0 10px 16px rgba(0, 0, 0, 0.12);
}

.mapcard {
  border: 3px solid #222a33;
  border-radius: 22px;
  background: #fff;
  padding: 10px;
  overflow: hidden;
  box-shadow: 0 6px 0 rgba(34, 42, 51, 0.18), 0 10px 16px rgba(0, 0, 0, 0.12);
}
.map {
  width: 100%;
  display: block;
  max-height: 230px;
}
.context {
  fill: #f1f2f6;
  stroke: #c8ccd6;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.country {
  fill: #dbdee8;
  stroke: #222a33;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
/* The target country glows in the region hue so "location" reads at a glance. */
.country--here {
  fill: var(--region, var(--color-europe));
}

.foot {
  padding: 14px 22px calc(16px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.choice__emoji {
  margin-right: 8px;
}
</style>
