<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/AppButton.vue'
import { useSessionStore } from '@/stores/session'

// The daily-habit home (Slice 4): the entry point into the day. A big "Start today"
// card shows today's load (due reviews + new cards) and launches the session; a
// streak counter rewards consecutive days (DESIGN §4, §8, §11).

const router = useRouter()
const session = useSessionStore()

const ready = ref(false)
const load = ref(0) // total cards a session starting now can serve

const due = computed(() => session.dueCount)
const fresh = computed(() => Math.max(0, load.value - due.value)) // new cards in the load
const streak = computed(() => session.streak)
const allDone = computed(() => ready.value && load.value === 0)

function start() {
  router.push('/session')
}

onMounted(async () => {
  await session.init()
  // First run (empty review log): send the user through calibration first (Slice 5).
  if (session.needsOnboarding) {
    router.replace('/onboarding')
    return
  }
  load.value = session.plannedCount()
  ready.value = true
})
</script>

<template>
  <section class="home">
    <header class="top">
      <h1 class="brand">GeoQuizz</h1>
      <div class="streak" :class="{ 'streak--lit': streak > 0 }">
        <span class="streak__flame">🔥</span>
        <span class="streak__n">{{ streak }}</span>
      </div>
    </header>

    <!-- Today's load + the day's launch button -->
    <div v-if="ready && !allDone" class="card">
      <p class="card__kicker">Today</p>
      <p class="card__count">{{ load }}</p>
      <p class="card__label">{{ load === 1 ? 'card to play' : 'cards to play' }}</p>

      <div class="breakdown">
        <span class="pill pill--due">{{ due }} due</span>
        <span class="pill pill--new">{{ fresh }} new</span>
      </div>

      <AppButton block @click="start">Start today</AppButton>
    </div>

    <!-- Nothing left for today -->
    <div v-else-if="allDone" class="rest">
      <div class="rest__globe">🌍</div>
      <h2 class="rest__title">All caught up!</h2>
      <p class="rest__sub">No cards due. Come back tomorrow to keep your streak.</p>
    </div>

    <!-- Loading the log -->
    <div v-else class="card card--skeleton" aria-hidden="true" />
  </section>
</template>

<style scoped>
.home {
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 34px;
  margin: 0;
  color: #2b2b3a;
}

.streak {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 13px;
  border-radius: 999px;
  border: 3px solid #222a33;
  background: #fff;
  font-family: var(--font-display);
  font-weight: 800;
  box-shadow: 0 3px 0 rgba(34, 42, 51, 0.18);
}
.streak__flame {
  font-size: 18px;
  filter: grayscale(1) opacity(0.45);
}
.streak--lit .streak__flame {
  filter: none;
}
.streak__n {
  font-size: 20px;
  color: #2b2b3a;
}

/* Big "Start today" card */
.card {
  background: #fff;
  border: 3px solid #222a33;
  border-radius: 28px;
  padding: 26px 22px 24px;
  text-align: center;
  box-shadow:
    0 6px 0 rgba(34, 42, 51, 0.16),
    0 12px 18px rgba(0, 0, 0, 0.08);
}
.card__kicker {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--region, var(--color-europe));
}
.card__count {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 76px;
  line-height: 1;
  color: #2b2b3a;
}
.card__label {
  margin: 4px 0 16px;
  font-weight: 700;
  color: #6b6b7a;
}

.breakdown {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}
.pill {
  padding: 6px 14px;
  border-radius: 999px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14px;
  color: #fff;
}
.pill--due {
  background: var(--region, var(--color-europe));
}
.pill--new {
  background: #fff;
  color: #6b6b7a;
  border: 2px solid #e3e3ec;
}

/* Caught-up rest state */
.rest {
  text-align: center;
  padding: 24px 12px;
}
.rest__globe {
  font-size: 84px;
  line-height: 1;
}
.rest__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 28px;
  margin: 10px 0 4px;
  color: #2b2b3a;
}
.rest__sub {
  margin: 0;
  font-weight: 700;
  color: #6b6b7a;
}

/* Skeleton placeholder while the log loads */
.card--skeleton {
  height: 280px;
  background: #f0f0f5;
  border-color: #e3e3ec;
  box-shadow: none;
}
</style>
