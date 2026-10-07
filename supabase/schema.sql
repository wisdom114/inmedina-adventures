-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  members       text[] not null default '{}',
  current_clue  int  not null default 0,
  points        int  not null default 0,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

alter table public.teams enable row level security;

-- Players are anonymous (no login yet), so the public anon key may
-- create a team and update its progress. Tighten this once you add accounts.
create policy "anyone can create a team"
  on public.teams for insert to anon with check (true);

create policy "anyone can read teams"
  on public.teams for select to anon using (true);

create policy "anyone can update team progress"
  on public.teams for update to anon using (true) with check (true);
