<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { EUROPE, EUROPE_SHAPES, REGION_FRAMES } from '@/data'
import {
  activityByDay,
  avgRetention,
  countryMastery,
  dayKey,
  masterySummary,
  MASTERY_MAX,
  regionAccuracy,
} from '@/engine/progress'
import { useSessionStore } from '@/stores/session'

// The progress surface (Slice 7, DESIGN §8): a world/region mastery map shaded
// along the continent hue, per-region accuracy + retention, and an Anki-style
// activity heatmap — all driven by the real review log.

const session = useSessionStore()
const ready = ref(false)

const frame = REGION_FRAMES.europe!
const shapes = EUROPE_SHAPES

// --- Mastery map: per-country level 0..MASTERY_MAX, painted as a saturation ramp.
const mastery = computed(() => countryMastery(session.states))

/** Continent hue at a ramp opacity for the level; level 0 = unlearned grey. */
function fillFor(countryId: number): string {
  const level = mastery.value.get(countryId) ?? 0
  if (level <= 0) return '#e7e9f0'
  // 1..MASTERY_MAX → pale → full saturation of the Europe hue.
  const opacity = 0.25 + (0.75 * level) / MASTERY_MAX
  return `color-mix(in srgb, var(--region, var(--color-europe)) ${Math.round(opacity * 100)}%, #fff)`
}

const summary = computed(() => masterySummary(mastery.value, EUROPE.length))

// --- Per-region stats (Europe is the only v1 region).
const accuracy = computed(() => regionAccuracy(session.events))
const retention = computed(() => avgRetention(session.states))

function pct(x: number): string {
  return `${Math.round(x * 100)}%`
}

// --- Activity heatmap: the last 18 weeks, Anki-style (weekday rows × week columns).
const WEEKS = 18
const DAY_MS = 86_400_000

const activity = computed(() => activityByDay(session.events))

interface Cell {
  key: string
  count: number
  level: number
  future: boolean
}

/** Count → intensity bucket (0..4) for the heatmap ramp. */
function heatLevel(count: number): number {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 10) return 3
  return 4
}

const weeks = computed<Cell[][]>(() => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const today = now.getTime()
  const mondayIdx = (now.getDay() + 6) % 7 // 0 = Monday
  const thisMonday = today - mondayIdx * DAY_MS

  const cols: Cell[][] = []
  for (let w = WEEKS - 1; w >= 0; w--) {
    const colMonday = thisMonday - w * 7 * DAY_MS
    const col: Cell[] = []
    for (let d = 0; d < 7; d++) {
      const ts = colMonday + d * DAY_MS
      const key = dayKey(ts)
      const count = activity.value.get(key) ?? 0
      col.push({ key, count, level: heatLevel(count), future: ts > today })
    }
    cols.push(col)
  }
  return cols
})

const heatStyle = (level: number) =>
  level <= 0
    ? '#eef0f5'
    : `color-mix(in srgb, var(--region, var(--color-europe)) ${15 + level * 21}%, #fff)`

onMounted(async () => {
  await session.init()
  ready.value = true
})
</script>

<template>
  <section class="page">
    <h1 class="title">Progress</h1>

    <!-- Mastery map -->
    <div class="block">
      <div class="mapcard">
        <svg class="map" :viewBox="`0 0 ${frame.width} ${frame.height}`" role="img" aria-label="Mastery map">
          <path
            v-for="s in shapes"
            :key="s.id"
            :d="s.d"
            :style="{ fill: fillFor(s.id) }"
            class="country"
          />
        </svg>
      </div>
      <div class="legend">
        <span class="legend__label">Unlearned</span>
        <span class="legend__swatch" :style="{ background: '#e7e9f0' }" />
        <span
          v-for="l in MASTERY_MAX"
          :key="l"
          class="legend__swatch"
          :style="{ background: `color-mix(in srgb, var(--region) ${Math.round((0.25 + (0.75 * l) / MASTERY_MAX) * 100)}%, #fff)` }"
        />
        <span class="legend__label">Mastered</span>
      </div>
    </div>

    <!-- Region stats -->
    <div class="block stats">
      <p class="block__kicker">Europe</p>
      <div class="stat-row">
        <div class="stat">
          <span class="stat__value">{{ summary.mastered }}<span class="stat__of">/{{ summary.total }}</span></span>
          <span class="stat__label">mastered</span>
        </div>
        <div class="stat">
          <span class="stat__value">{{ pct(accuracy.overall.rate) }}</span>
          <span class="stat__label">accuracy</span>
        </div>
        <div class="stat">
          <span class="stat__value">{{ pct(retention) }}</span>
          <span class="stat__label">retention</span>
        </div>
      </div>

      <div class="skills">
        <div class="skill">
          <span class="skill__name">🚩 Flags</span>
          <span class="skill__bar">
            <span class="skill__fill" :style="{ width: pct(accuracy.flag.rate) }" />
          </span>
          <span class="skill__pct">{{ pct(accuracy.flag.rate) }}</span>
        </div>
        <div class="skill">
          <span class="skill__name">📍 Map</span>
          <span class="skill__bar">
            <span class="skill__fill" :style="{ width: pct(accuracy.location.rate) }" />
          </span>
          <span class="skill__pct">{{ pct(accuracy.location.rate) }}</span>
        </div>
      </div>
    </div>

    <!-- Activity heatmap -->
    <div class="block">
      <p class="block__kicker">Activity</p>
      <div class="heat">
        <div v-for="(col, ci) in weeks" :key="ci" class="heat__col">
          <span
            v-for="cell in col"
            :key="cell.key"
            class="heat__cell"
            :class="{ 'heat__cell--future': cell.future }"
            :style="{ background: cell.future ? 'transparent' : heatStyle(cell.level) }"
            :title="`${cell.key}: ${cell.count} review${cell.count === 1 ? '' : 's'}`"
          />
        </div>
      </div>
      <div class="legend legend--right">
        <span class="legend__label">Less</span>
        <span v-for="l in 5" :key="l" class="legend__swatch" :style="{ background: heatStyle(l - 1) }" />
        <span class="legend__label">More</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding: 24px 22px 32px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 38px;
  margin: 0;
  color: #2b2b3a;
}

.block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.block__kicker {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--region, var(--color-europe));
}

/* Mastery map */
.mapcard {
  border: 3px solid #222a33;
  border-radius: 22px;
  background: #fff;
  padding: 12px;
  overflow: hidden;
  box-shadow: 0 6px 0 rgba(34, 42, 51, 0.16), 0 12px 18px rgba(0, 0, 0, 0.08);
}
.map {
  width: 100%;
  display: block;
}
.country {
  stroke: #222a33;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  transition: fill 0.2s ease;
}

.legend {
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: center;
}
.legend--right {
  justify-content: flex-end;
}
.legend__label {
  font-weight: 700;
  font-size: 12px;
  color: #8a8a9a;
}
.legend__swatch {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1.5px solid rgba(34, 42, 51, 0.18);
}

/* Region stats */
.stats {
  background: #fff;
  border: 3px solid #222a33;
  border-radius: 24px;
  padding: 18px 18px 20px;
  box-shadow: 0 6px 0 rgba(34, 42, 51, 0.16), 0 12px 18px rgba(0, 0, 0, 0.08);
}
.stat-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}
.stat__value {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 30px;
  line-height: 1;
  color: #2b2b3a;
}
.stat__of {
  font-size: 18px;
  color: #b0b0bf;
}
.stat__label {
  margin-top: 4px;
  font-weight: 700;
  font-size: 12px;
  color: #8a8a9a;
}

.skills {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}
.skill {
  display: flex;
  align-items: center;
  gap: 10px;
}
.skill__name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 13px;
  color: #2b2b3a;
  width: 74px;
}
.skill__bar {
  flex: 1;
  height: 12px;
  border-radius: 999px;
  background: #eef0f5;
  overflow: hidden;
}
.skill__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--region, var(--color-europe));
  transition: width 0.3s ease;
}
.skill__pct {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 13px;
  color: #6b6b7a;
  width: 38px;
  text-align: right;
}

/* Activity heatmap */
.heat {
  display: flex;
  gap: 4px;
  justify-content: space-between;
}
.heat__col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.heat__cell {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  border: 1.5px solid rgba(34, 42, 51, 0.08);
}
.heat__cell--future {
  border-color: transparent;
}
</style>
