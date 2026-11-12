-- Photo walk: reminder before the event and attendance confirmation (page /photowalk/potvrzeni).
-- Run once in Supabase → SQL Editor. Safe to run again.

alter table public.photowalk_signups
  add column if not exists rsvp_token       uuid not null default gen_random_uuid(), -- personal link in the reminder e-mail
  add column if not exists attendance       text check (attendance in ('yes', 'no')), -- null = no answer yet
  add column if not exists attendance_at    timestamptz,
  add column if not exists reminder_sent_at timestamptz;

create unique index if not exists photowalk_signups_rsvp_token_idx on public.photowalk_signups (rsvp_token);
