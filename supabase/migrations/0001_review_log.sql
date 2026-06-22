-- Slice 6 — Auth + cloud sync.
-- The append-only review log (DESIGN §7), mirrored per-user in Postgres. Card state
-- is never stored here either: every device pulls these events and replays them
-- locally. Rows are immutable — RLS grants select + insert only (no update/delete),
-- which enforces the append-only model at the database layer.
--
-- Apply in the Supabase dashboard → SQL Editor (or `supabase db push`).

create table if not exists public.review_log (
  -- Client-generated UUID, the cross-device dedup key (matches IndexedDB `uid`).
  uid        uuid        primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  card_id    text        not null,           -- `${countryId}:${skill}`
  country_id integer     not null,
  skill      text        not null,           -- 'flag' | 'location'
  rating     integer     not null,           -- FSRS Rating (1=Again … 4=Easy)
  ts         bigint      not null,           -- epoch ms the review/seed happened
  via        text        not null,           -- 'review' | 'triage'
  created_at timestamptz not null default now()
);

-- Replay pulls a user's whole log ordered by ts; index that access path.
create index if not exists review_log_user_ts_idx
  on public.review_log (user_id, ts);

alter table public.review_log enable row level security;

-- Owners can read and append their own rows. No update/delete policy exists, so
-- the log stays append-only even through the API.
create policy "review_log: select own"
  on public.review_log for select
  using (auth.uid() = user_id);

create policy "review_log: insert own"
  on public.review_log for insert
  with check (auth.uid() = user_id);
