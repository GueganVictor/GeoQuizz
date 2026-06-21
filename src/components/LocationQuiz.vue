<script setup lang="ts">
import { computed, ref } from 'vue'
import { geoMercator, geoPath } from 'd3-geo'
import type { Feature, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-50m.json'

const topo = world as unknown as Topology

type CountryFeature = Feature<Geometry, { name: string }>

// European countries shown as the tappable field (ISO numeric).
const EURO_IDS = new Set([
  250, 276, 724, 380, 620, 528, 56, 756, 40, 300, 616, 752, 578, 372, 208, 203,
  826, 246, 352, 233, 428, 440, 112, 804, 703, 348, 642, 498, 705, 191, 70, 688,
  499, 8, 807, 100, 442,
])

// The subset we actually quiz on (the v1 deck).
const ASK_IDS = new Set([
  250, 276, 724, 380, 620, 528, 56, 756, 40, 300, 616, 752, 578, 372, 208, 203,
])

const W = 360
const H = 470

const fc = feature(
  topo,
  topo.objects.countries as GeometryCollection,
) as unknown as { features: CountryFeature[] }

const euro = fc.features.filter((f) => EURO_IDS.has(Number(f.id)))
const askable = euro.filter((f) => ASK_IDS.has(Number(f.id)))

// Frame to mainland Europe so outliers (Svalbard, Canaries) clip away.
const FRAME: Feature<Geometry> = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [[[-11, 34], [-11, 71.5], [32, 71.5], [32, 34], [-11, 34]]],
  },
}
const projection = geoMercator().fitExtent(
  [
    [10, 10],
    [W - 10, H - 10],
  ],
  FRAME,
)
const pathGen = geoPath(projection)

const shapes = euro.map((f) => ({
  id: Number(f.id),
  name: f.properties.name,
  d: pathGen(f) ?? '',
}))

const GRADES = ['Again', 'Hard', 'Good', 'Easy'] as const
const TOTAL = 8

const target = ref(askable[0]!.properties.name)
const targetId = ref(Number(askable[0]!.id))
const tapped = ref<number | null>(null)
const revealed = ref(false)
const done = ref(0)
const streak = ref(4)

const isCorrect = computed(() => revealed.value && tapped.value === targetId.value)
const progress = computed(() => (done.value / TOTAL) * 100)

function nextQuestion() {
  const f = askable[Math.floor(Math.random() * askable.length)]!
  targetId.value = Number(f.id)
  target.value = f.properties.name
  tapped.value = null
  revealed.value = false
}

function tap(id: number) {
  if (!revealed.value) tapped.value = id
}

function check() {
  if (tapped.value !== null) revealed.value = true
}

function advance() {
  done.value = (done.value + 1) % (TOTAL + 1)
  if (isCorrect.value) streak.value++
  nextQuestion()
}

function countryClass(id: number) {
  if (!revealed.value) {
    return tapped.value === id ? 'country country--sel' : 'country'
  }
  if (id === targetId.value) return 'country country--correct'
  if (id === tapped.value) return 'country country--wrong'
  return 'country'
}

nextQuestion()
</script>

<template>
  <!-- Europe theme -->
  <div class="quiz" style="--region: var(--color-europe); --region-dark: #1b82cc">
    <header class="quiz__bar">
      <button class="iconbtn" aria-label="Close">✕</button>
      <div class="track"><div class="track__fill" :style="{ width: progress + '%' }" /></div>
      <div class="streak">🔥 {{ streak }}</div>
    </header>

    <main class="quiz__body">
      <h1 class="title">Where is {{ target }}?</h1>

      <div class="mapcard">
        <svg class="map" :viewBox="`0 0 ${W} ${H}`" role="img">
          <path
            v-for="s in shapes"
            :key="s.id"
            :d="s.d"
            :data-id="s.id"
            :class="countryClass(s.id)"
            :style="revealed ? 'pointer-events:none' : ''"
            @click="tap(s.id)"
          />
        </svg>
      </div>
    </main>

    <footer class="quiz__foot">
      <button class="gloss push push--go" :disabled="tapped === null || revealed" @click="check">
        <span class="lbl">Check</span>
      </button>
    </footer>

    <transition name="slide">
      <div v-if="revealed" class="sheet">
        <div class="sheet__head">
          <span class="sheet__icon" :class="isCorrect ? 'sheet__icon--ok' : 'sheet__icon--no'">
            {{ isCorrect ? '✓' : '✕' }}
          </span>
          <div>
            <p class="sheet__title">{{ isCorrect ? 'Nice!' : 'Answer' }}</p>
            <p class="sheet__sub">{{ target }}</p>
          </div>
        </div>

        <div v-if="isCorrect" class="rate">
          <button v-for="g in GRADES" :key="g" class="gloss rate__btn" @click="advance">
            <span class="lbl">{{ g }}</span>
          </button>
        </div>
        <button v-else class="gloss push push--again" @click="advance">
          <span class="lbl">Continue</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.quiz {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  background: #fff;
  overflow: hidden;
}

.quiz__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 8px;
}
.iconbtn {
  border: none;
  background: none;
  font-size: 20px;
  color: #b8b8c8;
  cursor: pointer;
  line-height: 1;
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
  background: var(--region);
  border-radius: 999px;
  transition: width 0.3s ease;
}
.streak {
  font-weight: 800;
  font-size: 15px;
  color: #ff9f1c;
}

.quiz__body {
  flex: 1;
  padding: 12px 22px;
}
.title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 30px;
  margin: 8px 0 18px;
  color: #2b2b3a;
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
}
.country {
  fill: #e7e9f0;
  stroke: #222a33;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  cursor: pointer;
  transition: fill 0.12s ease;
}
.country--sel {
  fill: var(--region);
}
.country--correct {
  fill: var(--color-correct);
}
.country--wrong {
  fill: var(--color-wrong);
}

/* ── Glossy-removed video-game button base ── */
.gloss {
  position: relative;
  border: 3px solid #222a33;
  border-radius: 999px;
  cursor: pointer;
  overflow: hidden;
  font-family: var(--font-display);
  font-weight: 800;
  color: #fff;
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
.push:disabled {
  filter: saturate(0.7) opacity(0.5);
}

.quiz__foot {
  padding: 16px 22px calc(20px + env(safe-area-inset-bottom));
}
.push {
  width: 100%;
  padding: 17px;
  font-size: 19px;
}
.push--go {
  background: var(--region);
}
.push--again {
  background: var(--color-wrong);
}

.sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 22px 22px calc(24px + env(safe-area-inset-bottom));
  background: #fff;
  border-radius: 26px 26px 0 0;
  box-shadow: 0 -8px 22px rgba(0, 0, 0, 0.12);
}
.sheet__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.sheet__icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 3px solid #222a33;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 3px 0 rgba(34, 42, 51, 0.2);
}
.sheet__icon--ok {
  background: var(--color-correct);
}
.sheet__icon--no {
  background: var(--color-wrong);
}
.sheet__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 20px;
  margin: 0;
  color: #2b2b3a;
}
.sheet__sub {
  margin: 0;
  font-weight: 700;
  font-size: 15px;
  color: #6b6b7a;
}

.rate {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.rate__btn {
  padding: 14px 4px;
  font-size: 14px;
  background: #fff;
  color: #2b2b3a;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}
</style>
