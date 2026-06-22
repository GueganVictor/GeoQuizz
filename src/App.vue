<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import BottomNav from './components/BottomNav.vue'

// A quiz session and the first-run triage are focused modes: hide the bottom tabs
// so the in-screen controls are the only way out.
const route = useRoute()
const FOCUSED = new Set(['session', 'onboarding'])
const showNav = computed(() => !FOCUSED.has(route.name as string))
</script>

<template>
  <!-- Phone-framed app shell. Default continent hue = Europe (the v1 slice). -->
  <div class="shell" style="--region: var(--color-europe)">
    <main class="shell__view">
      <RouterView />
    </main>
    <BottomNav v-if="showNav" />
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
