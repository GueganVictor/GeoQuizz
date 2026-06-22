<script setup lang="ts">
// Per-answer feedback bottom-sheet: white card, rounded top, soft shadow, with
// a colored circular badge (green = correct, red = wrong). The action area
// (self-rate buttons or a Continue button) is provided by the default slot.
withDefaults(
  defineProps<{
    show: boolean
    correct: boolean
    title: string
    subtitle?: string
  }>(),
  { subtitle: '' },
)
</script>

<template>
  <transition name="slide">
    <div v-if="show" class="sheet">
      <div class="sheet__head">
        <span class="sheet__icon" :class="correct ? 'sheet__icon--ok' : 'sheet__icon--no'">
          {{ correct ? '✓' : '✕' }}
        </span>
        <div>
          <p class="sheet__title">{{ title }}</p>
          <p v-if="subtitle" class="sheet__sub">{{ subtitle }}</p>
        </div>
      </div>

      <slot />
    </div>
  </transition>
</template>

<style scoped>
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
/* Badge pops in when the sheet arrives (juice — DESIGN §11). */
.sheet__icon {
  animation: badge-pop 0.4s cubic-bezier(0.22, 1.4, 0.4, 1) both;
}
@keyframes badge-pop {
  0% {
    transform: scale(0);
  }
  65% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sheet__icon {
    animation: none;
  }
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

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(100%);
}
</style>
