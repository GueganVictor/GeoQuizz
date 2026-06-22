<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from '@/components/AppButton.vue'
import { EUROPE_SHAPES, REGION_FRAMES } from '@/data'
import type { Country } from '@/data'

// One "tap the country" question over the region map (DESIGN §5). Grading is an
// exact-shape hit-test by ISO numeric id. Self-contained like FlagCard: owns the
// tap, the Check step and the reveal; emits the objective result for the runner.
const props = defineProps<{
  /** The target country to locate. Must be one of the rendered region shapes. */
  country: Country
}>()

const emit = defineEmits<{ answered: [correct: boolean] }>()

// The whole Europe deck is the tappable field; the projection is precomputed in
// the catalog (same pipeline as the LocationQuiz prototype).
const frame = REGION_FRAMES.europe!
const shapes = EUROPE_SHAPES

const tapped = ref<number | null>(null)
const revealed = ref(false)

function tap(id: number) {
  if (!revealed.value) tapped.value = id
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
</script>

<template>
  <div class="card">
    <main class="body">
      <h1 class="title">Where is {{ country.name }}?</h1>

      <div class="mapcard">
        <svg class="map" :viewBox="`0 0 ${frame.width} ${frame.height}`" role="img">
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
  fill: var(--region, var(--color-europe));
}
.country--correct {
  fill: var(--color-correct);
}
.country--wrong {
  fill: var(--color-wrong);
}

.foot {
  padding: 16px 22px;
}
</style>
