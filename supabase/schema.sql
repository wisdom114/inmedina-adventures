-- ═══════════════════════════════════════════════════════════
--  InMedina Discovery Adventures — database setup
--  Run once: Supabase dashboard → SQL Editor → New query →
--  paste this whole file → Run. Safe to run again.
-- ═══════════════════════════════════════════════════════════

-- ── Games: one row per hunt, owned by the signed-in user ──
create table if not exists public.games (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  team_name     text not null,
  members       text[] not null default '{}',
  current_clue  int  not null default 0,
  results       jsonb not null default '{}'::jsonb,  -- per-clue answers, hints, photos
  points        int  not null default 0,
  started_at    timestamptz,                         -- set when Start Hunt is tapped
  finished_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Hunt timer (active play time): { activeMs, runningSince, lastSeenAt }.
-- Added after the first version of this file — safe to run on an existing table.
alter table public.games add column if not exists timer jsonb;

create index if not exists games_user_idx on public.games (user_id, created_at desc);

alter table public.games enable row level security;

drop policy if exists "Players read own games" on public.games;
create policy "Players read own games"
  on public.games for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Players create own games" on public.games;
create policy "Players create own games"
  on public.games for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Players update own games" on public.games;
create policy "Players update own games"
  on public.games for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- "Start a new game instead" deletes the player's unfinished game.
drop policy if exists "Players delete own games" on public.games;
create policy "Players delete own games"
  on public.games for delete to authenticated using (auth.uid() = user_id);

-- Keep updated_at current.
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists games_touch on public.games;
create trigger games_touch before update on public.games
  for each row execute function public.touch_updated_at();

-- ── Leaderboard: one finished result per game ──
create table if not exists public.leaderboard (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null unique references public.games (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  player_name   text not null,
  team_name     text not null,
  score         int  not null check (score between -200 and 145),
  time_seconds  int  not null check (time_seconds >= 0),
  created_at    timestamptz not null default now()
);

-- Ranking: highest score first, fastest time breaks ties.
create index if not exists leaderboard_rank_idx
  on public.leaderboard (score desc, time_seconds asc);

alter table public.leaderboard enable row level security;

drop policy if exists "Anyone can view the leaderboard" on public.leaderboard;
create policy "Anyone can view the leaderboard"
  on public.leaderboard for select to anon, authenticated using (true);

drop policy if exists "Players post their own finished games" on public.leaderboard;
create policy "Players post their own finished games"
  on public.leaderboard for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.games g
      where g.id = game_id and g.user_id = auth.uid() and g.finished_at is not null
    )
  );
