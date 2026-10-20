-- Run once in Supabase → SQL Editor (after rides_security.sql).
-- Adds driver assignment, ride status timestamps, and rating columns.

alter table public.rides add column if not exists driver_id text;      -- Clerk user id of the driver
alter table public.rides add column if not exists driver_name text;
alter table public.rides add column if not exists accepted_at timestamptz;
alter table public.rides add column if not exists started_at timestamptz;
alter table public.rides add column if not exists completed_at timestamptz;
alter table public.rides add column if not exists cancelled_at timestamptz;
alter table public.rides add column if not exists refund_amount numeric;
alter table public.rides add column if not exists rating int check (rating between 1 and 5);
alter table public.rides add column if not exists feedback text;

-- Status values used by the app:
--   paid        -> rider paid, waiting for a driver
--   accepted    -> driver accepted, on the way
--   in_progress -> trip started
--   completed   -> trip finished
--   cancelled   -> rider cancelled (refunded)

create index if not exists rides_status_idx on public.rides (status);
create index if not exists rides_driver_id_idx on public.rides (driver_id);
