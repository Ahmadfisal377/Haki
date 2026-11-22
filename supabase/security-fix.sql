-- ============================================================
-- Security fix: prevent users from upgrading themselves to premium,
-- and let usage events actually be recorded (limit enforcement).
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- 1) Lock down profiles: users may only touch their own display fields.
--    subscription_plan (and id) can no longer be written by anon/authenticated.
drop policy if exists "profiles_owner_all" on public.profiles;
drop policy if exists "profiles_owner_select" on public.profiles;

create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

revoke update on public.profiles from anon, authenticated;
grant update (display_name, preferred_language, timezone)
  on public.profiles to authenticated;

-- 2) usage_events: the server records usage with the user's own JWT,
--    so inserts need a policy. Users can only add events for themselves
--    (self-inflating their own counters only hurts themselves).
drop policy if exists "usage_events_owner_select" on public.usage_events;
create policy "usage_events_owner_select" on public.usage_events
  for select using (auth.uid() = user_id);

drop policy if exists "usage_events_owner_insert" on public.usage_events;
create policy "usage_events_owner_insert" on public.usage_events
  for insert with check (auth.uid() = user_id);
