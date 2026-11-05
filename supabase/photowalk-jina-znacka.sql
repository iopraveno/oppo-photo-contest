-- Photo walk: allow "Jiná značka" (another phone brand) in the sign-up form.
-- Run once in Supabase → SQL Editor.
alter table public.photowalk_signups drop constraint if exists photowalk_signups_brand_check;
alter table public.photowalk_signups add constraint photowalk_signups_brand_check check (brand in ('OPPO', 'OnePlus', 'Jiná značka'));
