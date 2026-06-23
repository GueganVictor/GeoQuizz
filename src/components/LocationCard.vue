<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from '@/components/AppButton.vue'
import {
  contextForContinent,
  REGION_FRAMES,
  shapesForContinent,
  WORLD_FRAME,
  worldContext,
  worldShapes,
} from '@/data'
import type { Country } from '@/data'
import { randomTints } from '@/lib/tint'
import { useSettingsStore } from '@/stores/settings'

// One "tap the country" question over the region map (DESIGN §5). Grading is an
// exact-shape hit-test by ISO numeric id. Self-contained like FlagCard: owns the
// tap, the Check step and the reveal; emits the objective result for the runner.
//
// Slice 9: the map is scoped to the *target country's continent* (frame, shapes and
// hue all follow `country.continent`) and is pinch/scroll-zoomable + pannable, so
// even microstates are tappable.
const props = defineProps<{
  /** The target country to locate. Must be one of the rendered region shapes. */
  country: Country
}>()

const emit = defineEmits<{ answered: [correct: boolean] }>()

// Region zoom (DESIGN §5, settings-toggleable): on → the map is framed to the target's
// continent; off → the whole world is shown and the player zooms/pans in by hand.
const settings = useSettingsStore()
const regionZoom = computed(() => settings.regionZoom)

// The tappable field + its projection. Precomputed in the catalog (region or world).
const frame = computed(() =>
  regionZoom.value ? REGION_FRAMES[props.country.continent] : WORLD_FRAME,
)
const shapes = computed(() =>
  regionZoom.value ? shapesForContinent(props.country.continent) : worldShapes(),
)
// The surrounding world (territories etc.), drawn non-interactive behind the deck.
const context = computed(() =>
  regionZoom.value ? contextForContinent(props.country.continent) : worldContext(),
)
// Subtle random per-country tint so neighbours read apart — applied to the deck *and*
// the surrounding context (re-rolled per card, carries no meaning).
const tints = computed(() =>
  randomTints([...shapes.value, ...context.value].map((s) => s.id)),
)

/** Inline style for a deck path: its random tint, plus tap-lock once revealed. */
function pathStyle(id: number) {
  const bg = `--bg:${tints.value.get(id)}`
  return revealed.value ? `${bg};pointer-events:none` : bg
}

const tapped = ref<number | null>(null)
const revealed = ref(false)

function tap(id: number) {
  if (revealed.value || panned.value) return
  tapped.value = id
}

function check() {
  if (tapped.value === null || revealed.value) return
  revealed.value = true
  emit('answered', tapped.value === props.country.id)
}

function countryClass(id: number) {
  if (!revealed.value) {
    return tapped.value === id ? 'country country--sel' : 'country'
  }
  if (id === props.country.id) return 'country country--correct'
  if (id === tapped.value) return 'country country--wrong'
  return 'country'
}

const canCheck = computed(() => tapped.value !== null && !revealed.value)

// --- Zoom + pan (DESIGN §5: pinch-zoom for small countries) ---------------------
const MIN_SCALE = 1
// High ceiling so even microstates (Monaco, Vatican, Nauru) can be panned in close
// enough for a fair exact-shape tap on a continent-wide frame (DESIGN §5).
const MAX_SCALE = 40
const svgEl = ref<SVGSVGElement | null>(null)
const scale = ref(1)
const tx = ref(0)
const ty = ref(0)
const transform = computed(() => `translate(${tx.value} ${ty.value}) scale(${scale.value})`)

const pointers = new Map<number, { x: number; y: number }>()
const panned = ref(false) // true once a gesture moves enough to count as pan/zoom (suppresses tap)
let lastPinchDist = 0

/** Clamp pan so the (scaled) map always covers the viewBox — no empty gutters. */
function clampPan() {
  const w = frame.value.width
  const h = frame.value.height
  tx.value = Math.min(0, Math.max(w * (1 - scale.value), tx.value))
  ty.value = Math.min(0, Math.max(h * (1 - scale.value), ty.value))
}

/** Convert a client point to viewBox coordinates. */
function toViewBox(clientX: number, clientY: number) {
  const el = svgEl.value
  if (!el) return { x: 0, y: 0 }
  const r = el.getBoundingClientRect()
  return {
    x: ((clientX - r.left) / r.width) * frame.value.width,
    y: ((clientY - r.top) / r.height) * frame.value.height,
  }
}

/** Zoom to `next` scale keeping the viewBox focal point (vx, vy) fixed on screen. */
function zoomTo(next: number, vx: number, vy: number) {
  const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next))
  // p = content-space point under the focus before the change.
  const px = (vx - tx.value) / scale.value
  const py = (vy - ty.value) / scale.value
  scale.value = s
  tx.value = vx - s * px
  ty.value = vy - s * py
  clampPan()
}

function onWheel(e: WheelEvent) {
  e.preventDefault()
  const { x, y } = toViewBox(e.clientX, e.clientY)
  zoomTo(scale.value * (e.deltaY < 0 ? 1.25 : 0.8), x, y)
}

function onPointerDown(e: PointerEvent) {
  ;(e.target as Element).setPointerCapture?.(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    lastPinchDist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
  }
}

function onPointerMove(e: PointerEvent) {
  const prev = pointers.get(e.pointerId)
  if (!prev) return

  if (pointers.size === 2) {
    // Pinch zoom around the midpoint of the two pointers.
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const [a, b] = [...pointers.values()]
    const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y)
    if (lastPinchDist > 0) {
      const mid = toViewBox((a!.x + b!.x) / 2, (a!.y + b!.y) / 2)
      zoomTo(scale.value * (dist / lastPinchDist), mid.x, mid.y)
    }
    lastPinchDist = dist
    panned.value = true
    return
  }

  if (scale.value <= 1) return // nothing to pan when not zoomed
  const dxPx = e.clientX - prev.x
  const dyPx = e.clientY - prev.y
  if (Math.abs(dxPx) + Math.abs(dyPx) > 2) panned.value = true
  const el = svgEl.value
  if (el) {
    const r = el.getBoundingClientRect()
    tx.value += (dxPx / r.width) * frame.value.width
    ty.value += (dyPx / r.height) * frame.value.height
    clampPan()
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
}

function onPointerUp(e: PointerEvent) {
  pointers.delete(e.pointerId)
  if (pointers.size < 2) lastPinchDist = 0
  // Clear the pan flag after the click that follows pointerup has been swallowed.
  if (pointers.size === 0) requestAnimationFrame(() => (panned.value = false))
}

function zoomBtn(factor: number) {
  zoomTo(scale.value * factor, frame.value.width / 2, frame.value.height / 2)
}
function resetZoom() {
  scale.value = 1
  tx.value = 0
  ty.value = 0
}
</script>

<template>
  <div class="card" :style="`--region: var(--color-${country.continent})`">
    <main class="body">
      <h1 class="title">Where is {{ country.name }}?</h1>

      <div class="mapcard">
        <svg
          ref="svgEl"
          class="map"
          :viewBox="`0 0 ${frame.width} ${frame.height}`"
          role="img"
          @wheel="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <g :transform="transform">
            <!-- Surrounding world (context only — not part of the answer set) -->
            <path
              v-for="s in context"
              :key="`ctx-${s.id}`"
              :d="s.d"
              class="context"
              :style="{ '--bg': tints.get(s.id) }"
            />
            <!-- The region's countries: the tappable answer field -->
            <path
              v-for="s in shapes"
              :key="s.id"
              :d="s.d"
              :data-id="s.id"
              :class="countryClass(s.id)"
              :style="pathStyle(s.id)"
              @click="tap(s.id)"
            />
          </g>
        </svg>

        <!-- Zoom controls (pinch/scroll also work; these help on desktop + precision) -->
        <div class="zoom">
          <button class="zoom__btn" aria-label="Zoom in" @click="zoomBtn(1.6)">+</button>
          <button class="zoom__btn" aria-label="Zoom out" @click="zoomBtn(0.625)">−</button>
          <button v-if="scale > 1" class="zoom__btn" aria-label="Reset zoom" @click="resetZoom">⤢</button>
        </div>
      </div>
      <p class="hint">Pinch or scroll to zoom · drag to pan</p>
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
  margin: 8px 0 18px;
  color: #2b2b3a;
}

.mapcard {
  position: relative;
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
  touch-action: none;
}
/* Surrounding world: tinted like the deck (same random palette) but non-interactive,
   with a lighter outline so the playable region still reads as the foreground. */
.context {
  fill: var(--bg, #eef0f5);
  stroke: #b9bdc9;
  stroke-width: 0.6;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}
.country {
  /* Subtle random per-country tint (var set inline) so neighbours read apart; the
     thin outline can then stay slim without tiny islands collapsing to pure border. */
  fill: var(--bg, #dbdee8);
  stroke: #222a33;
  stroke-width: 0.6;
  vector-effect: non-scaling-stroke;
  cursor: pointer;
  transition: fill 0.12s ease;
}
.country--sel {
  fill: var(--region, var(--color-europe));
}
.country--correct {
  fill: var(--color-correct);
}
.country--wrong {
  fill: var(--color-wrong);
}

.zoom {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.zoom__btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 2.5px solid #222a33;
  background: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  line-height: 1;
  color: #2b2b3a;
  cursor: pointer;
  box-shadow: 0 3px 0 rgba(34, 42, 51, 0.18);
}
.zoom__btn:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 rgba(34, 42, 51, 0.18);
}

.hint {
  margin: 10px 0 0;
  text-align: center;
  font-weight: 700;
  font-size: 12px;
  color: #a0a0b0;
}

.foot {
  padding: 16px 22px;
}
</style>
