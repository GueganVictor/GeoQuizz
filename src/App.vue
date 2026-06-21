<script setup lang="ts">
import { RouterView } from 'vue-router'

import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <!-- Phone-framed app shell. Default continent hue = Europe (the v1 slice). -->
  <div class="shell" style="--region: var(--color-europe)">
    <main class="shell__view">
      <RouterView />
    </main>
    <BottomNav />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  background: #fff;
}
.shell__view {
  flex: 1;
  min-height: 0;
}
</style>
