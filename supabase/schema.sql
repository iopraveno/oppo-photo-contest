-- OPPO Photo Contest: Lovci světla
-- Run once in Supabase → SQL Editor.

create extension if not exists pgcrypto;

-- One row per approved Instagram post.
create table if not exists public.entries (
  id            uuid primary key default gen_random_uuid(),
  shortcode     text not null unique,          -- Instagram post code, e.g. C9xYz12AbCd
  permalink     text not null,                 -- https://www.instagram.com/p/<shortcode>/
  author_handle text not null,                 -- Instagram username without @
  shot_on_oppo  boolean not null default false,
  hidden        boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists entries_author_idx on public.entries (lower(author_handle));

-- One vote per user per entry.
create table if not exists public.votes (
  id          bigint generated always as identity primary key,
  entry_id    uuid not null references public.entries (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  voter_email text,
  ip_hash     text,
  created_at  timestamptz not null default now(),
  unique (entry_id, user_id)
);

create index if not exists votes_entry_idx on public.votes (entry_id);
create index if not exists votes_ip_idx on public.votes (ip_hash, created_at);
create index if not exists votes_user_idx on public.votes (user_id);

-- Entries with their vote counts.
create or replace view public.entry_scores as
select e.*, count(v.id)::int as votes
from public.entries e
left join public.votes v on v.entry_id = e.id
group by e.id;

-- The website talks to the database only from the server with the service role key.
-- Row level security with no policies keeps the tables closed to the public API.
alter table public.entries enable row level security;
alter table public.votes enable row level security;

revoke all on public.entries from anon, authenticated;
revoke all on public.votes from anon, authenticated;
revoke all on public.entry_scores from anon, authenticated;


-- Photo walk sign-ups (page /photowalk, admin /admin/photowalk).
create table if not exists public.photowalk_signups (
  id                    uuid primary key default gen_random_uuid(),
  event                 text not null,                 -- PHOTOWALK.slug in lib/config.ts
  name                  text not null,
  email                 text not null,                 -- stored lower-case
  phone                 text not null,
  brand                 text not null check (brand in ('OPPO', 'OnePlus')),
  model                 text not null,
  status                text not null default 'pending' check (status in ('pending', 'confirmed', 'declined')),
  ip_hash               text,
  created_at            timestamptz not null default now(),
  confirmed_at          timestamptz,
  confirm_email_sent_at timestamptz,
  unique (event, email)
);

create index if not exists photowalk_signups_event_idx on public.photowalk_signups (event, status, created_at);
create index if not exists photowalk_signups_ip_idx on public.photowalk_signups (ip_hash, created_at);

-- Server only (service role key), closed to the public API like the other tables.
alter table public.photowalk_signups enable row level security;
revoke all on public.photowalk_signups from anon, authenticated;
