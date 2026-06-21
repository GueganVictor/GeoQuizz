# GeoQuizz — Build Roadmap

Ordered vertical slices. Each slice leaves the app working and demoable. Strategy:
get a **playable offline daily loop on the Europe slice first**, then add auth/sync,
then progress polish + PWA, then scale to the whole world.

> **▶ Current slice: 2 — Card engine & FSRS (local, headless).**
> This is the next slice to build. Update this line whenever a slice is completed — set it to
> the next slice number/name, or to "✅ all slices complete" when the roadmap is done.

See [DESIGN.md](DESIGN.md) for the agreed architecture (§1–10) and visual design (§11).

Current state: two throwaway-ish prototypes exist — `src/components/FlagQuiz.vue` and
`src/components/LocationQuiz.vue` — proving the look + the map pipeline. They get folded
into the real session runner in Slice 3.

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

## Slice 2 — Card engine & FSRS (local, headless)
**Goal:** scheduling logic with no UI.
- Card = (country × skill). Integrate `ts-fsrs`.
- Append-only **review log** in IndexedDB; card state derived by replay (per DESIGN §7).
- Scheduler: due-card selection + daily new-card queue (15 countries/day, random) + hooks for
  calibration seeding.
- **Done when:** a store can return "next due/new card" and record a grade, surviving reload.

## Slice 3 — Quiz session runner (both skills)
**Goal:** the playable loop, offline, end-to-end.
- Session runner pulls cards from the engine and renders the right view per card type
  (flag MC or map tap), folding in the two prototypes.
- Apply grading rules: correct → self-rate; **wrong map tap / wrong MC → forced Again**.
  Write each answer to the review log.
- **Done when:** you can play a full Europe session offline and progress persists.

## Slice 4 — Daily home + streak
**Goal:** the daily-habit entry point.
- Home: big "Start today" card, today's due count, streak counter; routes into the session.
- **Done when:** opening the app shows today's load and launches the session.

## Slice 5 — Onboarding calibration
**Goal:** a smart first track.
- First-run triage over the top-100-by-population (Europe subset for now): combined per-country
  "Know it / Sort of / No idea" seeding FSRS state (per DESIGN §3).
- **Done when:** a new user runs the triage once, then the daily loop schedules accordingly.

## Slice 6 — Auth + cloud sync (Supabase)
**Goal:** progress that follows the user across devices.
- Email magic-link auth; Supabase schema (review-log table) + row-level security.
- Local-first sync: push the IndexedDB log on reconnect, pull + replay on another device.
- **Done when:** logging in on a second device reconstructs identical card state.

## Slice 7 — Progress views
**Goal:** the "track my progress" surface (DESIGN §8).
- World/region mastery map (continent-hue saturation ramp), per-region accuracy/retention,
  activity heatmap.
- **Done when:** the Map/Progress tab shows mastery + stats driven by real review data.

## Slice 8 — PWA + juice
**Goal:** installable, offline, polished daily-habit app.
- Manifest + service worker; cache flag images on first view for offline play.
- Sound + haptics (on by default + toggle); motion polish on answers/streaks; mascot moments.
- **Done when:** installs to home screen and a full session works with no network.

## Slice 9 — Scale beyond Europe
**Goal:** whole-world content.
- Per-continent map frames/projections + full country dataset; continent color system applied
  across decks, mastery map, and stats.
- **Done when:** all six continents are playable and color-coded.

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
