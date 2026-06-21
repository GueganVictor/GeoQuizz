<script setup lang="ts">
import { Icon } from '@iconify/vue'

// Bottom tab bar: the three top-level destinations. The active tab adopts the
// current screen's continent hue via the inherited --region var.
const tabs = [
  { to: '/', label: 'Home', icon: 'material-symbols:home-rounded' },
  { to: '/map', label: 'Map', icon: 'material-symbols:public' },
  { to: '/profile', label: 'Profile', icon: 'material-symbols:person-rounded' },
] as const
</script>

<template>
  <nav class="nav">
    <RouterLink
      v-for="t in tabs"
      :key="t.to"
      :to="t.to"
      class="tab"
      active-class="tab--active"
    >
      <Icon :icon="t.icon" class="tab__icon" />
      <span class="tab__label">{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.nav {
  display: flex;
  border-top: 2px solid #ededf3;
  background: #fff;
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 0;
  text-decoration: none;
  color: #b8b8c8;
  transition: color 0.15s ease;
}
.tab__icon {
  font-size: 28px;
}
.tab__label {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 12px;
}
.tab--active {
  color: var(--region, var(--color-europe));
}
</style>
