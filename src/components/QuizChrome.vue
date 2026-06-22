<script setup lang="ts">
import { ref, watch } from 'vue'

// Top chrome for a quiz session: close button, progress track, streak counter.
const props = withDefaults(
  defineProps<{
    progress: number // 0–100
    streak: number
  }>(),
  { progress: 0, streak: 0 },
)

defineEmits<{ close: [] }>()

// Juice (DESIGN §11): bump the flame each time the streak climbs.
const bump = ref(false)
watch(
  () => props.streak,
  (next, prev) => {
    if (next > prev) {
      bump.value = false
      requestAnimationFrame(() => (bump.value = true))
    }
  },
)
</script>

<template>
  <header class="bar">
    <button class="iconbtn" aria-label="Close" @click="$emit('close')">✕</button>
    <div class="track">
      <div class="track__fill" :style="{ width: progress + '%' }" />
    </div>
    <div class="streak" :class="{ 'streak--bump': bump }">🔥 {{ streak }}</div>
  </header>
</template>

<style scoped>
.bar {
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
  background: var(--region, var(--color-europe));
  border-radius: 999px;
  transition: width 0.3s ease;
}
.streak {
  font-weight: 800;
  font-size: 15px;
  color: #ff9f1c;
  transform-origin: center;
}
.streak--bump {
  animation: streak-bump 0.4s cubic-bezier(0.22, 1.4, 0.4, 1);
}
@keyframes streak-bump {
  0% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.45);
  }
  100% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .streak--bump {
    animation: none;
  }
}
</style>
