<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppButton from '@/components/AppButton.vue'

// Placeholder home — the real daily-habit home lands in Slice 4.
</script>

<template>
  <section class="page">
    <h1 class="title">GeoQuizz</h1>
    <p class="sub">Learn the world, one country a day.</p>

    <div class="cta">
      <RouterLink to="/demo" class="cta__link">
        <AppButton block>Components demo</AppButton>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding: 28px 22px;
}
.title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 38px;
  margin: 8px 0 4px;
  color: #2b2b3a;
}
.sub {
  margin: 0 0 28px;
  font-weight: 700;
  color: #6b6b7a;
}
.cta__link {
  text-decoration: none;
}
</style>
