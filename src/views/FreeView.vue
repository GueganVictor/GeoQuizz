<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/AppButton.vue'
import FlagCard from '@/components/FlagCard.vue'
import LocationCard from '@/components/LocationCard.vue'
import QuizChrome from '@/components/QuizChrome.vue'
import ResultSheet from '@/components/ResultSheet.vue'
import { COUNTRY_BY_ID, CONTINENTS, DECKS, WORLD } from '@/data'
import type { Continent, Country } from '@/data'
import { playCorrect, playFanfare, playWrong } from '@/lib/feedback'
import { cardsForDeck, type CardRef } from '@/engine/types'

// Free play (practice mode): test yourself on a whole deck — one region or the full
// world — outside the spaced-repetition loop. Unlike /session, this NEVER touches the
// review log: no FSRS grading, no scheduling, no streak. Just the whole card set
// (every country × both skills) shuffled, scored, and replayable.

const route = useRoute()
const router = useRouter()

const countryById = COUNTRY_BY_ID

/** Human label for the scope shown in the done screen. */
const SCOPE_LABELS: Record<string, string> = {
  world: 'Full World',
  europe: 'Europe',
  asia: 'Asia',
  africa: 'Africa',
  namerica: 'North America',
  samerica: 'South America',
  oceania: 'Oceania',
}

const scope = route.params.scope as string
const isWorld = scope === 'world'
const deck: Country[] = isWorld ? WORLD : DECKS[scope as Continent]
const scopeLabel = SCOPE_LABELS[scope] ?? 'Free play'

const ready = ref(false)
const queue = ref<CardRef[]>([])
const index = ref(0)
const attempt = ref(0) // bumped per question to remount the card fresh
const options = ref<Country[]>([])

const revealed = ref(false)
const lastCorrect = ref(false)

const streak = ref(0) // consecutive correct this run
const correct = ref(0)
const answered = ref(0)

const current = computed<CardRef | null>(() => queue.value[index.value] ?? null)
const country = computed(() =>
  current.value ? countryById.get(current.value.countryId) ?? null : null,
)
// Adopt the current card's continent hue (DESIGN §11) — varies per card on a world run.
const regionStyle = computed(() =>
  country.value ? `--region: var(--color-${country.value.continent})` : '',
)
const finished = computed(() => ready.value && current.value === null)
const total = computed(() => queue.value.length)
const progress = computed(() => {
  if (finished.value) return 100
  if (total.value === 0) return 0
  return Math.min(100, (answered.value / total.value) * 100)
})

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * Four flag options: the answer plus three distractors drawn from the same continent
 * (a fairer, more focused quiz), topped up from the whole world if a continent is too
 * small. Mirrors the daily session runner.
 */
function buildOptions(answer: Country): Country[] {
  const sameContinent = DECKS[answer.continent].filter((c) => c.id !== answer.id)
  let distractors = shuffle(sameContinent).slice(0, 3)
  if (distractors.length < 3) {
    const taken = new Set([answer.id, ...distractors.map((c) => c.id)])
    const extra = shuffle(WORLD.filter((c) => !taken.has(c.id))).slice(0, 3 - distractors.length)
    distractors = [...distractors, ...extra]
  }
  return shuffle([answer, ...distractors])
}

/** The whole card set for the deck (both skills per country), freshly shuffled. */
function buildQueue() {
  queue.value = shuffle(cardsForDeck(deck.map((c) => c.id)))
}

/** Prep the card at the current index (reset reveal, remount, build flag options). */
function prepare() {
  revealed.value = false
  attempt.value += 1
  const c = country.value
  if (current.value?.skill === 'flag' && c) options.value = buildOptions(c)
}

function onAnswered(ok: boolean) {
  lastCorrect.value = ok
  revealed.value = true
  if (ok) {
    correct.value += 1
    streak.value += 1
    playCorrect()
  } else {
    streak.value = 0
    playWrong()
  }
}

/** Advance to the next card (no grading — free mode never writes the review log). */
function next() {
  answered.value += 1
  index.value += 1
  prepare()
}

/** Reshuffle and play the same deck again from scratch. */
function playAgain() {
  index.value = 0
  answered.value = 0
  correct.value = 0
  streak.value = 0
  buildQueue()
  prepare()
}

// Celebration when the deck is exhausted.
watch(finished, (done) => {
  if (done) playFanfare()
})

function exit() {
  router.push('/')
}

onMounted(() => {
  // Guard against an unknown scope in the URL.
  if (!isWorld && !CONTINENTS.includes(scope as Continent)) {
    router.replace('/')
    return
  }
  buildQueue()
  prepare()
  ready.value = true
})
</script>

<template>
  <div class="free" :style="regionStyle">
    <QuizChrome :progress="progress" :streak="streak" @close="exit" />

    <!-- Active question -->
    <template v-if="country && current">
      <FlagCard
        v-if="current.skill === 'flag'"
        :key="attempt"
        :country="country"
        :options="options"
        @answered="onAnswered"
      />
      <LocationCard
        v-else
        :key="attempt"
        :country="country"
        @answered="onAnswered"
      />
    </template>

    <!-- Run complete — show the score (DESIGN §11 celebration) -->
    <main v-else-if="finished" class="done">
      <div class="globe">🌍</div>
      <h1 class="done__title">{{ scopeLabel }} done!</h1>
      <p class="done__score">{{ correct }} / {{ answered }}</p>
      <p class="done__sub">correct answers</p>
      <div class="done__actions">
        <AppButton block @click="playAgain">Play again</AppButton>
        <AppButton block tone="plain" @click="exit">Back home</AppButton>
      </div>
    </main>

    <!-- Per-answer feedback. Free mode has no self-rate — just Next. -->
    <ResultSheet
      :show="revealed"
      :correct="lastCorrect"
      :title="lastCorrect ? 'Nice!' : 'Answer'"
      :subtitle="country?.name"
    >
      <AppButton block :tone="lastCorrect ? 'region' : 'wrong'" @click="next">Next</AppButton>
    </ResultSheet>
  </div>
</template>

<style scoped>
.free {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.done {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 22px;
  gap: 4px;
}
.globe {
  font-size: 96px;
  line-height: 1;
  margin-bottom: 8px;
  animation: globe-pop 0.6s cubic-bezier(0.22, 1.4, 0.4, 1) both;
}
@keyframes globe-pop {
  0% {
    transform: scale(0) rotate(-25deg);
  }
  60% {
    transform: scale(1.15) rotate(8deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .globe {
    animation: none;
  }
}
.done__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 30px;
  margin: 0;
  color: #2b2b3a;
}
.done__score {
  margin: 8px 0 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 64px;
  line-height: 1;
  color: var(--region, var(--color-europe));
}
.done__sub {
  margin: 2px 0 24px;
  font-weight: 700;
  color: #6b6b7a;
}
.done__actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
