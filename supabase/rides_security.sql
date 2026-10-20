-- Run this once in Supabase → SQL Editor.
-- It links each ride to a user and locks the table so the browser can't read or write it directly.
-- The app now reads/writes rides only through /api/rides (server, service role key).

-- 1. New columns
alter table public.rides add column if not exists user_id text;            -- Clerk user id
alter table public.rides add column if not exists payment_intent_id text;  -- Stripe PaymentIntent id
alter table public.rides add column if not exists status text default 'paid';

-- 2. One ride per payment (prevents duplicates if the save runs twice)
create unique index if not exists rides_payment_intent_id_key
  on public.rides (payment_intent_id);

create index if not exists rides_user_id_created_at_idx
  on public.rides (user_id, created_at desc);

-- 3. Turn on Row Level Security.
--    With RLS on and NO policies, the public anon key can't read or write rides at all.
--    The service role key used by the server bypasses RLS.
alter table public.rides enable row level security;

-- 4. If you earlier added policies that let "anon" or "public" read/insert rides,
--    list them with the query below and drop them (replace <policy name>):
--    select policyname, roles, cmd from pg_policies where tablename = 'rides';
--    drop policy "<policy name>" on public.rides;

-- Note: old test rides have no user_id, so they won't show in anyone's history.
-- To clear them:  delete from public.rides where user_id is null;
