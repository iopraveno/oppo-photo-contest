-- Photo walk sign-ups (page /photowalk, admin /admin/photowalk).
-- Run once in Supabase → SQL Editor. The same block is at the end of schema.sql.

create extension if not exists pgcrypto;

create table if not exists public.photowalk_signups (
  id                    uuid primary key default gen_random_uuid(),
  event                 text not null,                 -- PHOTOWALK.slug in lib/config.ts
  name                  text not null,
  email                 text not null,                 -- stored lower-case
  phone                 text not null,
  brand                 text not null check (brand in ('OPPO', 'OnePlus', 'Jiná značka')),
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
