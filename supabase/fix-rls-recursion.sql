-- Fix: infinite RLS recursion (PostgreSQL 42P17) between
-- public.call_sessions and public.call_participants.
--
-- The old policies referenced each other (and call_participants referenced
-- itself), so any query on those tables failed with 500 / 42P17.
-- These are future Live Companion tables, not used by the MVP UI,
-- but the broken policies must be replaced.
--
-- Safe to re-run. Already applied to supabase/schema.sql as the source of truth.

-- Session creators own their sessions. Deliberately NO reference to
-- call_participants here, to keep the policy graph acyclic.
drop policy if exists "call_sessions_participants" on public.call_sessions;
create policy "call_sessions_participants" on public.call_sessions
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- A participant may read/write their own membership row; the session creator
-- may manage all rows. Reads call_sessions (whose policy is now acyclic),
-- so RLS never loops back into call_participants.
drop policy if exists "call_participants_session_members" on public.call_participants;
create policy "call_participants_session_members" on public.call_participants
  for all using (
    auth.uid() = user_id
    or exists (select 1 from public.call_sessions s
               where s.id = call_participants.session_id
                 and s.created_by = auth.uid())
  ) with check (
    auth.uid() = user_id
    or exists (select 1 from public.call_sessions s
               where s.id = call_participants.session_id
                 and s.created_by = auth.uid())
  );
