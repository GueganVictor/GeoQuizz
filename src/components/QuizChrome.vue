<script setup lang="ts">
// Top chrome for a quiz session: close button, progress track, streak counter.
withDefaults(
  defineProps<{
    progress: number // 0–100
    streak: number
  }>(),
  { progress: 0, streak: 0 },
)

defineEmits<{ close: [] }>()
</script>

<template>
  <header class="bar">
    <button class="iconbtn" aria-label="Close" @click="$emit('close')">✕</button>
    <div class="track">
      <div class="track__fill" :style="{ width: progress + '%' }" />
    </div>
    <div class="streak">🔥 {{ streak }}</div>
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
}
</style>
