import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/map', name: 'map', component: () => import('@/views/MapView.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
    // The playable daily loop (Slice 3). Focused mode — bottom nav hidden.
    { path: '/session', name: 'session', component: () => import('@/views/SessionView.vue') },
    // First-run calibration triage (Slice 5). Focused mode — bottom nav hidden.
    { path: '/onboarding', name: 'onboarding', component: () => import('@/views/OnboardingView.vue') },
    // Free play: practice a whole deck (a region or the world) outside the SRS loop.
    { path: '/free/:scope', name: 'free', component: () => import('@/views/FreeView.vue') },
    // Slice 0 component showcase — proves the shared UI renders.
    { path: '/demo', name: 'demo', component: () => import('@/views/DemoView.vue') },
  ],
})

export default router
