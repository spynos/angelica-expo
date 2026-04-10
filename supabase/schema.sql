-- Angelica MVP schema — single-file version to paste into Supabase Dashboard SQL Editor.
-- Run once on a fresh project. Safe to re-run: drops are guarded, policies use CREATE OR REPLACE where possible.

-- =============================================================================
-- Extensions
-- =============================================================================
create extension if not exists "pgcrypto";

-- =============================================================================
-- Tables
-- =============================================================================

-- users: profile extension of auth.users
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null unique,
  bio        text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- poems
create table if not exists public.poems (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  title      text,
  body       text not null check (length(body) <= 1000),
  font       text not null default 'serif'
             check (font in ('serif', 'sans', 'cursive')),
  bg_color   text not null default '#FFFFFF'
             check (bg_color in ('#FFFFFF', '#FAF7F2', '#F5E6D8', '#EDE8F5')),
  visibility text not null default 'public'
             check (visibility in ('public', 'private')),
  tags       text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_poems_user_id     on public.poems(user_id);
create index if not exists idx_poems_created_at  on public.poems(created_at desc);
create index if not exists idx_poems_visibility  on public.poems(visibility);
create index if not exists idx_poems_tags        on public.poems using gin(tags);

-- likes
create table if not exists public.likes (
  user_id    uuid not null references public.users(id) on delete cascade,
  poem_id    uuid not null references public.poems(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, poem_id)
);

create index if not exists idx_likes_poem_id on public.likes(poem_id);

-- bookmarks
create table if not exists public.bookmarks (
  user_id    uuid not null references public.users(id) on delete cascade,
  poem_id    uuid not null references public.poems(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, poem_id)
);

create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);

-- puzzles (daily sudoku set)
create table if not exists public.puzzles (
  id          uuid primary key default gen_random_uuid(),
  difficulty  text not null check (difficulty in ('easy', 'medium', 'hard')),
  grid        smallint[] not null check (array_length(grid, 1) = 81),
  solution    smallint[] not null check (array_length(solution, 1) = 81),
  puzzle_date date not null,
  created_at  timestamptz not null default now(),
  unique (difficulty, puzzle_date)
);

create index if not exists idx_puzzles_puzzle_date on public.puzzles(puzzle_date desc);

-- puzzle_records (user progress per puzzle)
create table if not exists public.puzzle_records (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  puzzle_id       uuid not null references public.puzzles(id),
  state           smallint[] not null,
  memo            jsonb,
  elapsed_seconds int  not null default 0,
  error_count     int  not null default 0,
  hint_count      int  not null default 0,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, puzzle_id)
);

create index if not exists idx_puzzle_records_user_id on public.puzzle_records(user_id);

-- push_tokens
create table if not exists public.push_tokens (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.users(id) on delete cascade,
  token                 text not null unique,
  platform              text not null check (platform in ('ios', 'android')),
  notifications_enabled boolean not null default false,
  preferred_hour        int check (preferred_hour between 0 and 23),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_push_tokens_user_id on public.push_tokens(user_id);

-- =============================================================================
-- Triggers: auto-update updated_at
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists poems_set_updated_at on public.poems;
create trigger poems_set_updated_at
  before update on public.poems
  for each row execute function public.set_updated_at();

drop trigger if exists puzzle_records_set_updated_at on public.puzzle_records;
create trigger puzzle_records_set_updated_at
  before update on public.puzzle_records
  for each row execute function public.set_updated_at();

drop trigger if exists push_tokens_set_updated_at on public.push_tokens;
create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Auto-create public.users row on auth signup
-- =============================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_nickname text;
  final_nickname   text;
  suffix           int := 0;
begin
  desired_nickname := coalesce(
    new.raw_user_meta_data->>'nickname',
    split_part(new.email, '@', 1),
    'user_' || substr(new.id::text, 1, 8)
  );
  final_nickname := desired_nickname;
  while exists (select 1 from public.users where nickname = final_nickname) loop
    suffix := suffix + 1;
    final_nickname := desired_nickname || '_' || suffix;
  end loop;

  insert into public.users (id, nickname)
  values (new.id, final_nickname)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.users          enable row level security;
alter table public.poems          enable row level security;
alter table public.likes          enable row level security;
alter table public.bookmarks      enable row level security;
alter table public.puzzles        enable row level security;
alter table public.puzzle_records enable row level security;
alter table public.push_tokens    enable row level security;

-- users
drop policy if exists "users_select_all"   on public.users;
create policy "users_select_all" on public.users
  for select using (true);

drop policy if exists "users_update_self"  on public.users;
create policy "users_update_self" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- poems
drop policy if exists "poems_select_public_or_own" on public.poems;
create policy "poems_select_public_or_own" on public.poems
  for select using (
    visibility = 'public' or user_id = auth.uid()
  );

drop policy if exists "poems_insert_own" on public.poems;
create policy "poems_insert_own" on public.poems
  for insert with check (user_id = auth.uid());

drop policy if exists "poems_update_own" on public.poems;
create policy "poems_update_own" on public.poems
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "poems_delete_own" on public.poems;
create policy "poems_delete_own" on public.poems
  for delete using (user_id = auth.uid());

-- likes
drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all" on public.likes
  for select using (true);

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes
  for insert with check (user_id = auth.uid());

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes
  for delete using (user_id = auth.uid());

-- bookmarks (private to owner)
drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own" on public.bookmarks
  for select using (user_id = auth.uid());

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own" on public.bookmarks
  for insert with check (user_id = auth.uid());

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own" on public.bookmarks
  for delete using (user_id = auth.uid());

-- puzzles (read-only for all authenticated users)
drop policy if exists "puzzles_select_all" on public.puzzles;
create policy "puzzles_select_all" on public.puzzles
  for select using (true);

-- puzzle_records
drop policy if exists "puzzle_records_select_own" on public.puzzle_records;
create policy "puzzle_records_select_own" on public.puzzle_records
  for select using (user_id = auth.uid());

drop policy if exists "puzzle_records_insert_own" on public.puzzle_records;
create policy "puzzle_records_insert_own" on public.puzzle_records
  for insert with check (user_id = auth.uid());

drop policy if exists "puzzle_records_update_own" on public.puzzle_records;
create policy "puzzle_records_update_own" on public.puzzle_records
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "puzzle_records_delete_own" on public.puzzle_records;
create policy "puzzle_records_delete_own" on public.puzzle_records
  for delete using (user_id = auth.uid());

-- push_tokens
drop policy if exists "push_tokens_select_own" on public.push_tokens;
create policy "push_tokens_select_own" on public.push_tokens
  for select using (user_id = auth.uid());

drop policy if exists "push_tokens_insert_own" on public.push_tokens;
create policy "push_tokens_insert_own" on public.push_tokens
  for insert with check (user_id = auth.uid());

drop policy if exists "push_tokens_update_own" on public.push_tokens;
create policy "push_tokens_update_own" on public.push_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "push_tokens_delete_own" on public.push_tokens;
create policy "push_tokens_delete_own" on public.push_tokens
  for delete using (user_id = auth.uid());
