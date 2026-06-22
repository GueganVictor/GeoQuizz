# GeoQuizz — Build Roadmap

Ordered vertical slices. Each slice leaves the app working and demoable. Strategy:
get a **playable offline daily loop on the Europe slice first**, then add auth/sync,
then progress polish + PWA, then scale to the whole world.

> **▶ Current slice: ✅ all slices complete.**
> The roadmap is done — the full daily-habit loop ships worldwide (all six continents). Update
> this line whenever a slice is completed — set it to the next slice number/name, or to
> "✅ all slices complete" when the roadmap is done.

See [DESIGN.md](DESIGN.md) for the agreed architecture (§1–10) and visual design (§11).

Current state: the daily-habit loop is live with first-run calibration — a new user is routed to
`/onboarding` (`src/views/OnboardingView.vue`) to triage the Europe deck (seeding FSRS state),
then `/` (`src/views/HomeView.vue`) shows today's load + streak and launches `/session`
(`src/views/SessionView.vue`), which pulls cards from the engine and renders
`FlagCard`/`LocationCard`. The throwaway prototypes (`FlagQuiz.vue`/`LocationQuiz.vue`) were folded
in and removed in Slice 3.

---

## Slice 0 — Foundation & design system ✅
**Goal:** a navigable shell and reusable UI, so every later screen is cheap to build.
- ✅ Rename project off the "sonique" scaffold (package.json, README, logo/title).
- ✅ Wire Vue Router + Pinia; bottom-tab app shell (Home / Map / Profile).
- ✅ Lock the visual tokens in `style.css` (continent + reserved feedback colors, fonts).
- ✅ Extract shared components from the prototypes: `AppButton` (video-game pill), `ResultSheet`,
  `QuizChrome` (progress bar + streak), `BottomNav`.
- **Done when:** you can navigate the tab shell and the button/sheet components render from a
  tiny demo page. ✅ — `/demo` (`src/views/DemoView.vue`) showcases all four components; the
  prototypes (`FlagQuiz`/`LocationQuiz`) are left untouched, folded in at Slice 3.

## Slice 1 — Content & domain data (Europe) ✅
**Goal:** a typed country catalog the quizzes draw from.
- ✅ Country model: ISO numeric id, ISO2 (flags), name, continent, population (for triage sort),
  map framing info. Seed the Europe set.
- ✅ Flag URL helper (flagcdn by ISO2). Map geometry from world-atlas TopoJSON (as in the
  LocationQuiz prototype), with a per-region projection frame.
- **Done when:** a `countries` module exposes the Europe deck and both a flag URL and a map
  path for each. ✅ — `src/data/` exposes `EUROPE` (37-country typed deck), `flagUrl(iso2)`,
  per-continent `REGION_FRAMES` + `regionShapes()`/`shapesFor()`, and precomputed
  `EUROPE_SHAPES` (map path per country). `/demo` renders the deck as a region map + flag grid.

## Slice 2 — Card engine & FSRS (local, headless) ✅
**Goal:** scheduling logic with no UI.
- ✅ Card = (country × skill). Integrate `ts-fsrs`.
- ✅ Append-only **review log** in IndexedDB; card state derived by replay (per DESIGN §7).
- ✅ Scheduler: due-card selection + daily new-card queue (15 countries/day, random) + hooks for
  calibration seeding.
- **Done when:** a store can return "next due/new card" and record a grade, surviving reload. ✅ —
  `src/engine/` (types, `db` IndexedDB append-only log, `replay` FSRS state derivation, `scheduler`
  due+new selection with 15-country/day cap) + `src/stores/session.ts` Pinia store exposing
  `init`/`nextCard`/`recordGrade`/`seedCountry`(triage hook)/`reset`. Verified in-browser: grade →
  FSRS step, 15-country daily cap, triage seed, and full state restored by replay after reload.
  A DEV-only `window.__session` handle (main.ts) drives it headlessly until Slice 3 adds UI.

## Slice 3 — Quiz session runner (both skills) ✅
**Goal:** the playable loop, offline, end-to-end.
- ✅ Session runner pulls cards from the engine and renders the right view per card type
  (flag MC or map tap), folding in the two prototypes.
- ✅ Apply grading rules: correct → self-rate; **wrong map tap / wrong MC → forced Again**.
  Write each answer to the review log.
- **Done when:** you can play a full Europe session offline and progress persists. ✅ —
  `/session` (`src/views/SessionView.vue`) orchestrates: `init`s the store, snapshots a session
  plan (`scheduler.sessionPlanCount` → progress denominator), then loops `store.nextCard()`.
  `FlagCard.vue` (flag hero + 2×2 name cards) and `LocationCard.vue` (region map, exact-shape
  hit-test) are controlled single-question components that emit the objective result; the runner
  drives the `ResultSheet` — self-rate (Again/Hard/Good/Easy) on a hit, forced `Again` + Continue
  on a miss — and writes every answer via `recordGrade`. Bottom nav hides on `/session`; a 🌍
  mascot "Done for today!" screen shows when the queue empties. Verified in-browser: flag/map
  questions render, correct→self-rate, wrong map tap→forced Again (rating 1, green/red shapes),
  30-card daily cap, full state restored by replay after reload. Prototypes removed.

## Slice 4 — Daily home + streak ✅
**Goal:** the daily-habit entry point.
- ✅ Home: big "Start today" card, today's due count, streak counter; routes into the session.
- **Done when:** opening the app shows today's load and launches the session. ✅ —
  `/` (`src/views/HomeView.vue`) `init`s the store, shows the day's load via
  `store.plannedCount()` (hero count + `due`/`new` breakdown pills) on a chunky video-game
  card whose "Start today" button (region hue) routes to `/session`; a 🔥 streak chip reads a
  new `store.streak` getter backed by `src/engine/streak.ts` (`dailyStreak` = consecutive
  active local days from the log, alive through yesterday). An "All caught up!" 🌍 rest state
  shows when the load is 0. Verified in preview (type-check clean): 30-card fresh load, seeded
  3-day streak + 4 due / 28 new survive reload, Start launches the session.

## Slice 5 — Onboarding calibration ✅
**Goal:** a smart first track.
- ✅ First-run triage over the Europe deck (all 37 countries; "top-100 subset" = the whole
  Europe set in v1): combined per-country "Know it / Sort of / No idea" seeding FSRS state
  (per DESIGN §3).
- **Done when:** a new user runs the triage once, then the daily loop schedules accordingly. ✅ —
  `/onboarding` (`src/views/OnboardingView.vue`): a mascot intro → a per-country card (flag +
  name + region map with the target country lit in the Europe hue) + three plain video-game
  choice buttons → a 🎉 "You're all set!" hand-off to `/`. Each verdict seeds *both* skill cards
  via `store.seedCountry` using `src/engine/triage.ts` `triageRating()`: **Know it → Easy**
  (~8-day interval, won't clog), **Sort of → Hard** (~6 min), **No idea → Again** (~1 min) —
  "sort of"/"no idea" enter active review immediately (DESIGN §3). First-run is gated by a new
  `store.needsOnboarding` getter (empty review log); `HomeView` `router.replace`s to it, and the
  triage is resume-safe (skips countries already seeded via `store.introducedCountryIds`). Bottom
  nav hides on `/onboarding` (focused mode, like `/session`). Verified in preview (type-check
  clean): fresh log → redirect → 37 countries seeded (74 triage events) → home shows the
  calibrated due load (Know-it cards excluded, Again/Hard cards due), survived reload via replay.

## Slice 6 — Auth + cloud sync (Supabase) ✅
**Goal:** progress that follows the user across devices.
- ✅ Email magic-link auth; Supabase schema (review-log table) + row-level security.
- ✅ Local-first sync: push the IndexedDB log on reconnect, pull + replay on another device.
- **Done when:** logging in on a second device reconstructs identical card state. ✅ —
  `@supabase/supabase-js` client (`src/lib/supabase.ts`, env-gated: app stays fully local-first
  when unconfigured). SQL migration `supabase/migrations/0001_review_log.sql` = `review_log`
  table keyed by a client UUID, with **append-only RLS** (select + insert own rows only; no
  update/delete). Each `ReviewEvent` now carries a globally-unique `uid` (`crypto.randomUUID`),
  the cross-device dedup key; replay tiebreaks on `uid` not the device-local `seq`, so two
  devices replay in identical order. IndexedDB bumped to v2 (uid unique index + backfill);
  `db.mergeEvents` inserts pulled events skipping held uids. `src/engine/sync.ts` push (idempotent
  upsert on uid) / pull (ordered by ts). `src/stores/auth.ts` (magic-link sign-in/out) +
  `src/stores/sync.ts` (full sync on sign-in/reconnect, debounced push on new events); both wired
  at startup in `App.vue`. `ProfileView.vue` = sign-in / magic-link-sent / synced / offline states.
  Verified: client picks up creds, table+RLS live (anon read = []), `signInWithOtp` dispatches
  email; and the merge/replay core simulated two-device against real IndexedDB — fresh device pulls
  6-event log → **identical** FSRS state, re-pull adds 0 (uid dedup), shuffled merge order →
  identical state. Live authenticated upsert/select taken on trust (magic-link click not automatable).

## Slice 7 — Progress views ✅
**Goal:** the "track my progress" surface (DESIGN §8).
- ✅ World/region mastery map (continent-hue saturation ramp), per-region accuracy/retention,
  activity heatmap.
- **Done when:** the Map/Progress tab shows mastery + stats driven by real review data. ✅ —
  `/map` (`src/views/MapView.vue`) rebuilt from the placeholder, all three driven by the replayed
  log. New pure engine module `src/engine/progress.ts`: `countryMastery` (per-country level 0–4 =
  **min** of its two skills' `cardLevel(stability)`, so a country is only as mastered as its weaker
  skill), `regionAccuracy` (overall + per-skill pass-rate over `via:'review'` events; triage seeds
  excluded), `avgRetention` (mean FSRS `get_retrievability` across introduced cards), and
  `activityByDay`/`dayKey` for the heatmap. The view renders: a **mastery map** reusing
  `EUROPE_SHAPES`, each country shaded along the Europe hue via a `color-mix` saturation ramp
  (unlearned = grey) + a Less→More legend; a **Europe stats card** (mastered N/37, accuracy %,
  retention %, per-skill Flags/Map accuracy bars); and an **18-week Anki-style activity heatmap**
  (weekday rows × week columns, hue-ramp intensity buckets, future cells blank). Verified in
  preview (type-check clean): seeded a 59-event multi-day log → map painted the expected ramp
  (4 mastered, learning/strong tiers distinct), stats read 88% accuracy / 95% retention /
  Flags 90% / Map 86%, heatmap lit the seeded recent days; then reset local log to empty.

## Slice 8 — PWA + juice ✅
**Goal:** installable, offline, polished daily-habit app.
- ✅ Manifest + service worker; cache flag images on first view for offline play.
- ✅ Sound + haptics (on by default + toggle); motion polish on answers/streaks; mascot moments.
- **Done when:** installs to home screen and a full session works with no network. ✅ —
  `vite-plugin-pwa` (Workbox `generateSW`, `registerType:'autoUpdate'`): `manifest.webmanifest`
  (standalone, Europe-blue theme, 192/512 + maskable icons), app shell **precached** (30 entries) +
  runtime caching — **flagcdn images CacheFirst on first view** (DESIGN §6) and Google Fonts. Icons
  are a smiling-globe mascot on Europe blue, authored as `scripts/icon.svg` and rasterized to
  `public/pwa-*.png` + `apple-touch-icon.png`. Juice: synthesized **Web Audio** SFX (no assets —
  rising ding / low buzz / fanfare arpeggio) + `navigator.vibrate` haptics in `src/lib/feedback.ts`,
  gated by a new `src/stores/settings.ts` (`sound`/`haptics`, **on by default**, localStorage-persisted,
  NOT synced) with video-game pill toggles in `ProfileView`; SFX wired into `SessionView`
  (correct/wrong/finish). Motion polish (all `prefers-reduced-motion`-guarded): done-screen mascot
  pop, `ResultSheet` badge pop, `QuizChrome` streak-flame bump, toggle-knob slide. Verified in
  preview + prod build: SW registered & controlling, manifest/icons served, flag image cached on
  view, both grading paths fire SFX with no console errors, toggle flips + persists.

## Slice 9 — Scale beyond Europe ✅
**Goal:** whole-world content.
- ✅ Per-continent map frames/projections + full country dataset; continent color system applied
  across decks, mastery map, and stats.
- **Done when:** all six continents are playable and color-coded. ✅ —
  `src/data/countries.ts` now holds the **worldwide deck** (195 sovereign states incl.
  microstates, split into per-continent arrays `EUROPE`/`ASIA`/`AFRICA`/`NAMERICA`/`SAMERICA`/
  `OCEANIA` + `WORLD`); every id verified to resolve to non-empty world-atlas geometry. Roster
  was user-chosen "all-inclusive ~197 states"; transcontinental countries bucketed for
  map-framing sanity (**Russia/Turkey/Caucasus/Kazakhstan → Asia**, Cyprus → Europe, Egypt →
  Africa). `regions.ts` `REGION_FRAMES` is now a full `Record<Continent, RegionFrame>` (six
  lon/lat boxes; big countries clip at the edges and stay tappable). `data/index.ts` exposes
  `DECKS`, `COUNTRY_BY_ID`, `continentOf`, precomputed `SHAPES_BY_CONTINENT` +
  `shapesForContinent`. `geometry.ts` `featureById` switched to **first-wins** (handles the
  id-36 Australia/Ashmore collision). Session store deck = `WORLD`; onboarding triage = **top
  100 by population worldwide** (was the 37 Europe); flag-MC distractors are now **same-continent**
  (top up from world if a continent is small). Each in-session screen + onboarding card adopts
  its country's continent hue (`--region`) and the **right continent map frame** per card.
  `LocationCard` gained **pinch / scroll / button zoom + drag-pan** (`MAX_SCALE` 40, focal-point
  zoom, pan-clamped to the frame), so even Monaco/Vatican are tappable via exact-shape hit-test.
  `MapView` rebuilt into **six per-continent sections** (each its frame + hue-ramped mastery map +
  its own mastered/accuracy/retention + Flags/Map bars) above one global activity heatmap.
  Verified in preview + prod build (type-check + build clean, 0 console errors): onboarding
  China→Asia-purple map, Egypt session card on the Africa frame (orange Check), zoom→2.56×
  clamped + reset, exact-shape taps correct for Egypt **and microstate Monaco**, same-continent
  distractors, MapView six color-coded sections with Egypt shaded orange; fresh log still gates
  to onboarding. Roster ≈ Europe 44 / Asia 49 / Africa 54 / N.America 23 / S.America 12 /
  Oceania 13.

---

### Dependency order at a glance
0 → 1 → 2 → 3 unlock the offline loop (the core milestone).
4–5 complete the daily-habit UX. 6 adds backend. 7–8 add progress + PWA polish. 9 scales content.

### Completing a slice
When a slice meets its "Done when" criterion: check it off, then **advance the "▶ Current slice"
pointer at the top of this file** to the next slice (this is how the next session knows where to
start). Update DESIGN.md / memory if any decision changed.

### Notes
- Auth/sync is deliberately **after** the playable loop — local-first means we validate
  everything without a backend, then layer Supabase on.
- Slices 1–5, 7 are built **Europe-only**; Slice 9 generalizes the same machinery worldwide.
