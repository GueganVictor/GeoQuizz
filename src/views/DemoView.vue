<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from '@/components/AppButton.vue'
import QuizChrome from '@/components/QuizChrome.vue'
import ResultSheet from '@/components/ResultSheet.vue'
import { EUROPE, EUROPE_SHAPES, REGION_FRAMES, flagUrl } from '@/data'

// Slice 0 showcase: proves the shared video-game button, quiz chrome and the
// result bottom-sheet all render from the established visual language.

// Slice 1 showcase: proves the countries module exposes the Europe deck plus a
// flag URL and a map path for each country.
const europeFrame = REGION_FRAMES.europe!
const shapeById = new Map(EUROPE_SHAPES.map((s) => [s.id, s.d]))

const continents = [
  { name: 'Europe', token: 'var(--color-europe)' },
  { name: 'Asia', token: 'var(--color-asia)' },
  { name: 'Africa', token: 'var(--color-africa)' },
  { name: 'N. America', token: 'var(--color-namerica)' },
  { name: 'S. America', token: 'var(--color-samerica)' },
  { name: 'Oceania', token: 'var(--color-oceania)' },
] as const

const region = ref<string>(continents[0].token)
const sheetCorrect = ref(true)
const showSheet = ref(false)

const GRADES = ['Again', 'Hard', 'Good', 'Easy'] as const

const regionStyle = computed(() => ({ '--region': region.value }))

function openSheet(correct: boolean) {
  sheetCorrect.value = correct
  showSheet.value = true
}
</script>

<template>
  <div class="demo" :style="regionStyle">
    <QuizChrome :progress="45" :streak="7" @close="$router.push('/')" />

    <section class="body">
      <h2 class="h">Continent hue</h2>
      <div class="swatches">
        <button
          v-for="c in continents"
          :key="c.name"
          class="swatch"
          :class="{ 'swatch--on': region === c.token }"
          :style="{ background: c.token }"
          @click="region = c.token"
        >
          {{ c.name }}
        </button>
      </div>

      <h2 class="h">Buttons</h2>
      <div class="stack">
        <AppButton block @click="openSheet(true)">Region — tap for correct sheet</AppButton>
        <AppButton tone="wrong" block @click="openSheet(false)">Wrong — tap for wrong sheet</AppButton>
        <AppButton tone="correct" block>Correct</AppButton>
        <AppButton tone="plain" block>Plain</AppButton>
        <AppButton block disabled>Disabled</AppButton>
      </div>

      <h2 class="h">Europe deck ({{ EUROPE.length }} countries)</h2>
      <div class="mapcard">
        <svg
          class="map"
          :viewBox="`0 0 ${europeFrame.width} ${europeFrame.height}`"
          role="img"
          aria-label="Europe deck map"
        >
          <path v-for="c in EUROPE" :key="c.id" :d="shapeById.get(c.id)" class="country" />
        </svg>
      </div>

      <div class="flags">
        <figure v-for="c in EUROPE" :key="c.id" class="flagcell">
          <img :src="flagUrl(c.iso2, 'w160')" :alt="c.name" class="flagimg" />
          <figcaption>{{ c.name }}</figcaption>
        </figure>
      </div>
    </section>

    <ResultSheet
      :show="showSheet"
      :correct="sheetCorrect"
      :title="sheetCorrect ? 'Nice!' : 'Answer'"
      subtitle="France"
    >
      <div v-if="sheetCorrect" class="rate">
        <AppButton v-for="g in GRADES" :key="g" tone="plain" @click="showSheet = false">
          {{ g }}
        </AppButton>
      </div>
      <AppButton v-else tone="wrong" block @click="showSheet = false">Continue</AppButton>
    </ResultSheet>
  </div>
</template>

<style scoped>
.demo {
  position: relative;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.body {
  padding: 8px 22px 28px;
}
.h {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 18px;
  color: #2b2b3a;
  margin: 22px 0 12px;
}
.swatches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.swatch {
  border: 3px solid #222a33;
  border-radius: 16px;
  padding: 12px 6px;
  color: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  opacity: 0.55;
  transition: opacity 0.15s ease;
}
.swatch--on {
  opacity: 1;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
}
.flags {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 16px;
}
.flagcell {
  margin: 0;
  text-align: center;
}
.flagimg {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #222a33;
}
.flagcell figcaption {
  font-size: 10px;
  font-weight: 700;
  color: #6b6b7a;
  margin-top: 3px;
  line-height: 1.1;
}
.rate {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
/* Tighter rate-card labels inside the grid. */
.rate :deep(.appbtn) {
  padding: 14px 4px;
  font-size: 14px;
}
</style>
