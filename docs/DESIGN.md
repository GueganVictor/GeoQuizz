# GeoQuizz — Design Spec

A mobile-first geography quiz PWA inspired by world-geography-games.com. Two skills —
**placing countries on a map** and **naming flags** — delivered as a daily, flashcard-style
spaced-repetition habit with per-user progress tracking.

Status: design agreed, pre-implementation. v1 target = full loop, Europe slice first.

---

## 1. Stack & delivery

- **Frontend:** Vue 3 + Vite 8 + Pinia + Vue Router + Tailwind 4 + TypeScript (from scaffold).
- **Delivery:** Installable **PWA** — web app manifest + service worker, offline-capable,
  add-to-home-screen.
- **Hosting:** **Vercel**.
- **Backend:** **Supabase** (Postgres + Auth + Row-Level Security). No custom server code.
- **Auth:** **Email magic link only** (passwordless).

## 2. Learning model

- **Card = one per (country × skill).** Two skills:
  - **location** — tap the correct country on the map.
  - **flag** — flag → country (multiple choice).
  - ~195 countries × 2 ≈ **390 cards**.
- **Scheduler: FSRS** (`ts-fsrs`), run **client-side**.
- **Grading → FSRS:** **self-rate** Again / Hard / Good / Easy *after* the objective result
  is revealed, with one override:
  - **Wrong map tap → forced `Again`** (objective lapse; no self-rate on a miss).
  - Correct tap / correct flag MC → user self-rates.

## 3. Onboarding — calibration triage (top 100)

- On first landing, run a **combined per-country self-assessment triage** over the
  **top 100 countries by population** (largest first). Purpose: quickly clear out the
  big, well-known countries so daily effort focuses on smaller/more obscure ones.
- For each country, show flag + name + location and ask **"Know it / Sort of / No idea"**
  (3-tap).
- One pass **seeds both cards (flag + location) per country** with initial FSRS state:
  - **Know it** → seeded as effectively mastered (long interval; won't clog reviews).
  - **Sort of / No idea** → enter active review/learning immediately.
- Countries **beyond the top 100 are not shown at onboarding**; they enter via the daily
  new-card queue (see §4).
- Population comes straight from Natural Earth (`pop_est`) — no extra data source needed.
  **Only this first triage is population-sorted;** daily new cards are random (see §4).

## 4. Daily loop

- Open app → **due reviews for today** + a steady stream of **15 new countries/day**
  (= up to **30 new cards/day**, flag + location) + **streak** + **today's due count**.
- **New-card queue:** drawn **at random** from countries not yet introduced (the ~95 beyond
  the onboarding top-100, plus any onboarding countries still unlearned). No ordering.
- Finishable daily goal (Anki-style), combining FSRS due reviews with the daily new-card cap.

## 5. Map game

- **Rendering:** inline **SVG** generated at build time from **Natural Earth / world-atlas
  TopoJSON** (public domain). One `<path>` per country, keyed by ISO code.
- **Interaction:** a location card **auto-zooms to the country's region**; user can
  **pinch-zoom** closer. Grading is **exact-shape hit-test** (the tapped path must be the
  target country).
- **Region-scoped maps:** each region gets its own projected SVG — a single world projection
  makes small countries untappable even when zoomed. (Build-time pipeline; proven on Europe.)

## 6. Flags

- Source: **flagcdn.com** by ISO code (public-domain flags, multiple sizes).
- Service worker **caches flag images on first view** for offline play.

## 7. Data & sync

- **Local-first.** FSRS runs client-side; each review is written to **IndexedDB immediately**
  and **pushed to Supabase on reconnect**. Full offline play.
- **Conflict model: append-only review log.** Store every review event; **card state is
  derived by replaying events in timestamp order** — conflict-free across devices and doubles
  as full history for stats.
- Triage ratings are the **first log events**.
- **Cross-device dedup key (Slice 6):** every event carries a client-generated `uid`
  (`crypto.randomUUID`), stable across IndexedDB and Supabase. Push is an idempotent upsert on
  `uid`; pull skips uids already held locally. Replay tiebreaks equal-`ts` events on `uid` (not
  the device-local autoincrement `seq`) so every device replays in identical order. The Supabase
  `review_log` table is keyed by `uid` with **append-only RLS** — select + insert of own rows
  only, no update/delete — enforcing immutability at the database layer.

## 8. Progress tracking (v1 — all of the following)

- **Daily streak + today's due/done count.**
- **World mastery map** — countries colored by recall strength (reuses the SVG map).
- **Per-region accuracy / retention** stats.
- **Activity heatmap** (Anki-style calendar).

## 9. v1 milestone

Full loop, end-to-end, **scoped to Europe first**:

auth → calibration → flag MC + tap-map → FSRS daily review → streak + mastery map.

Content data covers the whole world; **Europe is the validation slice** that proves the
region-map pipeline and the full loop before expanding to other regions.

## 10. Open consequences to watch

1. **Onboarding load.** Triage is capped at the top 100 (3-tap each), so first session is
   bounded. "Sort of"/"No idea" cards still become due soon after — FSRS fans them out, but
   consider a soft daily review cap so early days aren't overwhelming.
2. **Region maps are build-time work.** Each region needs its own projected SVG; the Europe
   slice proves this pipeline before scaling.

## 11. Visual design

Direction: **playful, colorful, Duolingo-like — not generic SaaS.** Pure-white base with bold
color. Minimal copy: **titles do ~99% of the talking**; meaning is carried by color, icons,
and the mascot rather than descriptions.

### Identity

- **Color system: per-continent.** No single hero color — each of the **6 continents** owns a
  signature bright hue that themes its decks, screens, and its slice of the mastery map.
- **Primary action buttons adopt the active screen's continent hue** (the "go" button changes
  color by region). Buttons are **video-game pills** — a solid color fill, a thick dark outline
  (`#222a33`), full (pill) radius, and a soft 3D drop-shadow "lip" that depresses on tap. **No
  glossy highlight** (deliberately removed during prototyping). Implemented as `AppButton`
  (shared `.gloss` base); tones: `region` / `correct` / `wrong` / `plain`.
- **Reserved colors:** **green = correct**, **red = wrong**, used for feedback only and
  **never assigned to a continent**, so feedback stays unambiguous against region theming.
- **Mascot:** a **smiling globe character**, used for **celebrations + onboarding only** (not
  during normal quizzing). Appears on streaks, milestones, first-run, empty states.
- **Typography:** **Baloo 2** (heavy rounded display) for titles; a clean rounded sans for the
  rare body text. Big short titles, sentence case.
- **Icons/illustration:** chunky rounded **flat** icons + flat colorful spot illustrations
  matching the mascot.
- **Loudness:** **bold & juicy** — big radii, thick 3D buttons, generous color blocks, lively
  motion.
- **Theme:** **light-only** for v1 (pure white). No dark mode.

### Proposed palette (to validate in-app)

Continent hues avoid green and red (reserved). Final values to be tuned against white.

| Token | Role | Hex (proposed) |
| --- | --- | --- |
| Europe | continent hue | Blue `#2EA7FF` |
| Asia | continent hue | Purple `#8B5CF6` |
| Africa | continent hue | Orange `#FF9F1C` |
| North America | continent hue | Teal `#14B8A6` |
| South America | continent hue | Yellow `#FFD23F` (dark text on fill) |
| Oceania | continent hue | Pink `#FF5DA2` |
| Correct | feedback (reserved) | Green `#58CC02` |
| Wrong | feedback (reserved) | Red `#FF4B4B` |
| Ink | primary text | `#2B2B3A` |
| Surface | base | White `#FFFFFF` |
| Page bg | subtle base | `#F7F7FB` |

### Structure & feedback

- **Navigation:** **bottom tab bar** (Home, Map/Progress, Profile) + a **daily-focused home**
  centered on a big "Start today" card + streak.
- **Per-answer feedback:** a **colored result bottom-sheet** slides up (green/red) with the
  result, the **self-rate** (Again/Hard/Good/Easy), and a big **Continue** button.
- **Flag question layout:** large flag hero on top, **four chunky country-name cards in a 2×2
  grid** below (thumb-friendly tap targets).
- **World mastery map:** each country shaded along its **continent hue via a saturation ramp**
  — pale/gray = unlearned, mid = learning, full saturation = mastered. One glance shows both
  region and strength; reuses the SVG map.
- **Sound + haptics:** playful SFX (correct ding, wrong buzz, streak fanfare) **+ haptics**,
  **on by default** with a settings toggle.

### Note on prototyping

The inline visualization tool is locked to claude.ai's flat house style (no shadows/gradients,
muted palette, mandatory dark mode) and **cannot faithfully render** the 3D chunky buttons,
juicy color, or light-only look. Prototype the visual language **directly in Vue + Tailwind**,
not in a style-tile widget.

## Decision log (resolved during grilling)

### Visual design

| Area | Decision |
| --- | --- |
| Overall direction | Playful, colorful, Duolingo-like; pure white + color; titles only |
| Color system | Per-continent signature hue (6 continents), no single hero |
| Action buttons | Video-game pills (solid fill, thick dark outline, 3D lip, no gloss); adopt active continent hue |
| Reserved colors | Green = correct, red = wrong; never continent hues |
| Mascot | Smiling globe; celebrations + onboarding only |
| Typeface | Baloo 2 (rounded display) for titles |
| Icons | Chunky rounded flat icons + flat spot illustrations |
| Loudness | Bold & juicy |
| Theme | Light-only (v1) |
| Navigation | Bottom tabs + daily-focused home |
| Answer feedback | Colored result bottom-sheet + self-rate + Continue |
| Flag MC layout | Big flag hero + 2×2 country-name cards |
| Mastery map | Continent-hue saturation ramp (unlearned→mastered) |
| Sound/haptics | Both, on by default + toggle |
| Region buckets | 6 continents |

### Architecture

| Area | Decision |
| --- | --- |
| Backend | Supabase (BaaS) |
| Auth | Email magic link only |
| Delivery | Installable PWA, hosted on Vercel |
| Card unit | One per (country × skill) |
| Skills | Location (tap map), Flag (flag → country MC) |
| SRS algorithm | FSRS (ts-fsrs), client-side |
| Grade source | Self-rate after answer; wrong map tap → forced Again |
| Onboarding | Combined per-country triage over **top 100 by population** (Know it / Sort of / No idea) |
| Post-onboarding | **15 new countries/day** (~30 cards), drawn **at random** from remaining |
| Daily session | Due reviews + 15 new countries/day + streak + due count |
| Population data | Natural Earth `pop_est`; only the first triage is sorted, daily is random |
| Map tech | Inline SVG from Natural Earth / world-atlas TopoJSON |
| Tap grading | Exact-shape hit-test, region-scoped + pinch-zoom |
| Map view per card | Auto-zoom to the country's region |
| Scope | Whole-world content; ship/validate Europe first |
| Flags | flagcdn.com, SW-cached for offline |
| Sync | Local-first (IndexedDB → Supabase on reconnect) |
| Conflicts | Append-only review log, state recomputed by replay |
| Progress UI | Streak/due, world mastery map, per-region stats, heatmap |
