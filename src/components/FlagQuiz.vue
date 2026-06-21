<script setup lang="ts">
import { computed, ref } from 'vue'

interface Country {
  code: string
  name: string
}

// Europe slice — the v1 validation region
const POOL: Country[] = [
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Germany' },
  { code: 'es', name: 'Spain' },
  { code: 'it', name: 'Italy' },
  { code: 'pt', name: 'Portugal' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'be', name: 'Belgium' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'at', name: 'Austria' },
  { code: 'gr', name: 'Greece' },
  { code: 'pl', name: 'Poland' },
  { code: 'se', name: 'Sweden' },
  { code: 'no', name: 'Norway' },
  { code: 'ie', name: 'Ireland' },
  { code: 'dk', name: 'Denmark' },
  { code: 'cz', name: 'Czechia' },
]

const GRADES = ['Again', 'Hard', 'Good', 'Easy'] as const

const TOTAL = 8

function flagUrl(code: string) {
  return `https://flagcdn.com/w320/${code}.png`
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]!
    a[i] = a[j]!
    a[j] = tmp
  }
  return a
}

const answer = ref<Country>(POOL[0]!)
const options = ref<Country[]>([])
const selected = ref<Country | null>(null)
const revealed = ref(false)
const done = ref(0)
const streak = ref(4)

const isCorrect = computed(
  () => revealed.value && selected.value?.code === answer.value.code,
)
const progress = computed(() => (done.value / TOTAL) * 100)

function nextQuestion() {
  const ans = POOL[Math.floor(Math.random() * POOL.length)]!
  const distractors = shuffle(POOL.filter((c) => c.code !== ans.code)).slice(0, 3)
  answer.value = ans
  options.value = shuffle([ans, ...distractors])
  selected.value = null
  revealed.value = false
}

function select(c: Country) {
  if (!revealed.value) selected.value = c
}

function check() {
  if (selected.value) revealed.value = true
}

function advance() {
  done.value = (done.value + 1) % (TOTAL + 1)
  if (isCorrect.value) streak.value++
  nextQuestion()
}

function optionClass(c: Country) {
  if (!revealed.value) {
    return selected.value?.code === c.code ? 'opt opt--sel' : 'opt'
  }
  if (c.code === answer.value.code) return 'opt opt--correct'
  if (c.code === selected.value?.code) return 'opt opt--wrong'
  return 'opt opt--dim'
}

nextQuestion()
</script>

<template>
  <!-- Europe theme -->
  <div
    class="quiz"
    style="--region: var(--color-europe); --region-dark: #1b82cc"
  >
    <header class="quiz__bar">
      <button class="iconbtn" aria-label="Close">✕</button>
      <div class="track"><div class="track__fill" :style="{ width: progress + '%' }" /></div>
      <div class="streak">🔥 {{ streak }}</div>
    </header>

    <main class="quiz__body">
      <h1 class="title">Which country?</h1>

      <div class="flagwrap">
        <img :src="flagUrl(answer.code)" :alt="''" class="flag" />
      </div>

      <div class="grid">
        <button
          v-for="c in options"
          :key="c.code"
          :class="['gloss', optionClass(c)]"
          :disabled="revealed"
          @click="select(c)"
        >
          <span class="lbl">{{ c.name }}</span>
        </button>
      </div>
    </main>

    <footer class="quiz__foot">
      <button class="gloss push push--go" :disabled="!selected || revealed" @click="check">
        <span class="lbl">Check</span>
      </button>
    </footer>

    <!-- Result bottom-sheet -->
    <transition name="slide">
      <div v-if="revealed" class="sheet">
        <div class="sheet__head">
          <span class="sheet__icon" :class="isCorrect ? 'sheet__icon--ok' : 'sheet__icon--no'">
            {{ isCorrect ? '✓' : '✕' }}
          </span>
          <div>
            <p class="sheet__title">{{ isCorrect ? 'Nice!' : 'Answer' }}</p>
            <p class="sheet__sub">{{ answer.name }}</p>
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

/* ── Glossy video-game button base ── */
.gloss {
  position: relative;
  border: 3px solid #222a33;
  border-radius: 999px;
  cursor: pointer;
  overflow: hidden;
  font-family: var(--font-display);
  font-weight: 800;
  color: #2b2b3a;
  box-shadow:
    0 5px 0 rgba(34, 42, 51, 0.22),
    0 9px 12px rgba(0, 0, 0, 0.14);
  transition: transform 0.08s ease, box-shadow 0.08s ease, filter 0.15s ease;
}
.gloss .lbl {
  position: relative;
  z-index: 1;
}
.gloss:active:not(:disabled) {
  transform: translateY(5px);
  box-shadow:
    0 0 0 rgba(34, 42, 51, 0.22),
    0 3px 5px rgba(0, 0, 0, 0.14);
}
.gloss:disabled {
  cursor: default;
}
.push:disabled {
  filter: saturate(0.7) opacity(0.5);
}

.opt {
  padding: 18px 10px;
  font-size: 16px;
  background: #fff;
}
.opt--sel {
  color: #fff;
  background: var(--region);
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

.quiz__foot {
  padding: 16px 22px calc(20px + env(safe-area-inset-bottom));
}
.push {
  width: 100%;
  padding: 17px;
  font-size: 19px;
  color: #fff;
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
