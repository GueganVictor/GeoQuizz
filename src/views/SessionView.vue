<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/AppButton.vue'
import FlagCard from '@/components/FlagCard.vue'
import LocationCard from '@/components/LocationCard.vue'
import QuizChrome from '@/components/QuizChrome.vue'
import ResultSheet from '@/components/ResultSheet.vue'
import { COUNTRY_BY_ID, DECKS, WORLD } from '@/data'
import type { Country } from '@/data'
import { playCorrect, playFanfare, playWrong } from '@/lib/feedback'
import { Rating } from '@/engine/types'
import { useSessionStore } from '@/stores/session'
import type { ScheduledCard } from '@/stores/session'

// The playable daily loop (Slice 3): pull cards from the engine, render the right
// view per skill (flag MC / map tap), apply the grading rules, and write every
// answer to the review log. Grading rule (DESIGN §2): a correct answer is
// self-rated Again/Hard/Good/Easy; a wrong answer is a forced `Again`.

const router = useRouter()
const session = useSessionStore()

const countryById = COUNTRY_BY_ID

// Self-rate buttons shown after a correct answer, mapped to FSRS grades.
const RATE_OPTIONS = [
  { label: 'Again', rating: Rating.Again },
  { label: 'Hard', rating: Rating.Hard },
  { label: 'Good', rating: Rating.Good },
  { label: 'Easy', rating: Rating.Easy },
] as const

const ready = ref(false)
const current = ref<ScheduledCard | null>(null)
const options = ref<Country[]>([])
const attempt = ref(0) // bumped per question to remount the card fresh

const revealed = ref(false)
const lastCorrect = ref(false)

const streak = ref(0) // consecutive correct this session
const answered = ref(0)
const planned = ref(0)

const country = computed(() =>
  current.value ? countryById.get(current.value.ref.countryId) ?? null : null,
)
// The session screen adopts the current card's continent hue (DESIGN §11).
const regionStyle = computed(() =>
  country.value ? `--region: var(--color-${country.value.continent})` : '',
)
const finished = computed(() => ready.value && current.value === null)
const progress = computed(() => {
  if (finished.value) return 100
  if (planned.value === 0) return 0
  return Math.min(100, (answered.value / planned.value) * 100)
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
 * Four flag options: the answer plus three distractors. Distractors are drawn from
 * the same continent (a fairer, more focused quiz); we top up from the whole world
 * if a continent is too small to supply three.
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

/** Advance to the next scheduled card (or the finished state when none remain). */
function loadNext() {
  revealed.value = false
  current.value = session.nextCard()
  attempt.value += 1
  const c = country.value
  if (current.value?.ref.skill === 'flag' && c) options.value = buildOptions(c)
}

function onAnswered(correct: boolean) {
  lastCorrect.value = correct
  revealed.value = true
  streak.value = correct ? streak.value + 1 : 0
  // Juice (DESIGN §11): SFX + haptics on every objective result.
  if (correct) playCorrect()
  else playWrong()
}

// Mascot celebration moment: a fanfare when the day's queue empties.
watch(finished, (done) => {
  if (done) playFanfare()
})

/** Record the grade for the current card, then move on. */
async function grade(rating: Rating) {
  if (!current.value) return
  await session.recordGrade(current.value.ref, rating)
  answered.value += 1
  loadNext()
}

function exit() {
  router.push('/')
}

onMounted(async () => {
  await session.init()
  planned.value = session.plannedCount()
  loadNext()
  ready.value = true
})
</script>

<template>
  <div class="session" :style="regionStyle">
    <QuizChrome :progress="progress" :streak="streak" @close="exit" />

    <!-- Active question -->
    <template v-if="country && current">
      <FlagCard
        v-if="current.ref.skill === 'flag'"
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

    <!-- Session complete (mascot celebration — DESIGN §11) -->
    <main v-else-if="finished" class="done">
      <div class="globe">🌍</div>
      <h1 class="done__title">Done for today!</h1>
      <p class="done__sub">You reviewed {{ answered }} {{ answered === 1 ? 'card' : 'cards' }}.</p>
      <AppButton block @click="exit">Back home</AppButton>
    </main>

    <!-- Per-answer feedback: self-rate on a hit, forced Again on a miss -->
    <ResultSheet
      :show="revealed"
      :correct="lastCorrect"
      :title="lastCorrect ? 'Nice!' : 'Answer'"
      :subtitle="country?.name"
    >
      <div v-if="lastCorrect" class="rate">
        <AppButton
          v-for="o in RATE_OPTIONS"
          :key="o.label"
          tone="plain"
          @click="grade(o.rating)"
        >
          {{ o.label }}
        </AppButton>
      </div>
      <AppButton v-else block tone="wrong" @click="grade(Rating.Again)">Continue</AppButton>
    </ResultSheet>
  </div>
</template>

<style scoped>
.session {
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
  gap: 6px;
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
  font-size: 32px;
  margin: 0;
  color: #2b2b3a;
}
.done__sub {
  margin: 0 0 22px;
  font-weight: 700;
  color: #6b6b7a;
}

.rate {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.rate :deep(.appbtn) {
  padding: 14px 4px;
  font-size: 14px;
}
</style>
