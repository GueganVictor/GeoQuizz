<h1 align="center">GeoQuizz</h1>

<h4 align="center">
Learn the world, one country a day — a mobile-first geography quiz PWA.
</h4>

<hr/>

GeoQuizz teaches two skills — **placing countries on a map** and **naming flags** —
as a daily, flashcard-style spaced-repetition habit with per-user progress tracking.
Inspired by world-geography-games.com.

See [docs/DESIGN.md](docs/DESIGN.md) for the architecture and visual design, and
[docs/ROADMAP.md](docs/ROADMAP.md) for the build plan (vertical slices).

## Stack

- ⚡️ [Vue 3](https://github.com/vuejs/core) + [Vite 8](https://github.com/vitejs/vite)
- 🧭 [Vue Router](https://router.vuejs.org/) + [Pinia](https://pinia.vuejs.org/)
- 🎨 [Tailwind CSS 4](https://tailwindcss.com/) + [Baloo 2](https://fonts.google.com/specimen/Baloo+2)
- 🗺️ [d3-geo](https://github.com/d3/d3-geo) + [world-atlas](https://github.com/topojson/world-atlas) TopoJSON maps
- 😃 [Iconify for Vue](https://iconify.design/docs/icon-components/vue/)
- 📋 [TypeScript](https://www.typescriptlang.org/)

## Develop

```bash
npm install
npm run dev          # http://localhost:3456
npm run type-check
npm run build
```
