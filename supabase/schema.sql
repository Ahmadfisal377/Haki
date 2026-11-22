-- ============================================================
-- Haki schema - run this in the Supabase SQL editor.
-- Uses UUID keys and RLS on all user-owned data.
-- Future Live Companion tables are created here but not used by the MVP UI.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- profiles (replaces PRD `users`; keyed to Supabase auth) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en' check (preferred_language in ('en','ar')),
  timezone text not null default 'UTC',
  subscription_plan text not null default 'free' check (subscription_plan in ('free','premium')),
  premium_until timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_owner_select" on public.profiles;
create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_owner_update" on public.profiles;
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Column-level lock: users may update only their display fields.
-- subscription_plan can never be written by anon/authenticated roles
-- (prevents self-upgrading to premium via the REST API).
revoke update on public.profiles from anon, authenticated;
grant update (display_name, preferred_language, timezone)
  on public.profiles to authenticated;

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, preferred_language)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''),
          coalesce(new.raw_user_meta_data->>'preferred_language', 'en'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- partner_profiles ----------
create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  partner_name text not null default '',
  relationship_type text not null default '',
  interests jsonb not null default '[]',          -- array of interest keys
  stress_pref text not null default '',           -- space | talk | comfort
  love_pref text not null default '',             -- words | time | gifts | acts | touch
  energy_pref text not null default '',           -- calm | out
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.partner_profiles enable row level security;
drop policy if exists "partner_profiles_owner_all" on public.partner_profiles;
create policy "partner_profiles_owner_all" on public.partner_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- conversations / messages ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
drop policy if exists "conversations_owner_all" on public.conversations;
create policy "conversations_owner_all" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.messages enable row level security;
drop policy if exists "messages_owner_all" on public.messages;
create policy "messages_owner_all" on public.messages
  for all using (
    exists (select 1 from public.conversations c
            where c.id = messages.conversation_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.conversations c
            where c.id = messages.conversation_id and c.user_id = auth.uid())
  );

-- ---------- memories ----------
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'note'
    check (category in ('preference','date','event','conversation','experience','note','milestone')),
  content text not null,
  source text not null default 'user',            -- user | chat | task | system
  confidence numeric not null default 1,
  confirmed boolean not null default true,        -- AI-extracted memories start false
  privacy_scope text not null default 'private' check (privacy_scope in ('private','shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.memories enable row level security;
drop policy if exists "memories_owner_all" on public.memories;
create policy "memories_owner_all" on public.memories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- tasks ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
drop policy if exists "tasks_owner_all" on public.tasks;
create policy "tasks_owner_all" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- activities (user-saved activities on top of the static catalog) ----------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text not null default 'general',
  cost_level text not null default 'free' check (cost_level in ('free','low','mid')),
  energy_level text not null default 'calm' check (energy_level in ('calm','active')),
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;
drop policy if exists "activities_owner_all" on public.activities;
create policy "activities_owner_all" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- user_feedback (favorites, "we talked about it", suggestion ratings) ----------
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,                          -- talk | activities | suggest | insights | chat
  item_id text,                                   -- static topic id or db uuid
  feedback_type text not null,                    -- favorite | talked | like | dislike | dismiss
  created_at timestamptz not null default now(),
  unique (user_id, feature, item_id, feedback_type)
);

alter table public.user_feedback enable row level security;
drop policy if exists "user_feedback_owner_all" on public.user_feedback;
create policy "user_feedback_owner_all" on public.user_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- usage_events (basic freemium limits) ----------
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,                             -- chat_message | suggestion | insight
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;
drop policy if exists "usage_events_owner_select" on public.usage_events;
create policy "usage_events_owner_select" on public.usage_events
  for select using (auth.uid() = user_id);
-- The server records usage with the user's own JWT; inserts are limited to
-- the user's own rows (self-inflating counters only hurts the user).
drop policy if exists "usage_events_owner_insert" on public.usage_events;
create policy "usage_events_owner_insert" on public.usage_events
  for insert with check (auth.uid() = user_id);

-- ---------- payments (premium ledger, written by service role only) ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'paypal',
  provider_order_id text,
  provider_capture_id text,
  amount numeric(10, 2) not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  premium_until timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;
drop policy if exists "payments_owner_select" on public.payments;
create policy "payments_owner_select" on public.payments
  for select using (auth.uid() = user_id);

-- ============================================================
-- FUTURE LIVE COMPANION TABLES (architected now, not used by MVP UI)
-- ============================================================

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id) on delete cascade,
  call_provider text not null default 'haki',
  status text not null default 'pending'
    check (status in ('pending','active','ended','cancelled')),
  started_at timestamptz,
  ended_at timestamptz,
  ai_assistance_enabled boolean not null default false
);

alter table public.call_sessions enable row level security;
drop policy if exists "call_sessions_participants" on public.call_sessions;
create policy "call_sessions_participants" on public.call_sessions
  for all using (
    auth.uid() = created_by
    or exists (select 1 from public.call_participants p
               where p.session_id = call_sessions.id and p.user_id = auth.uid())
  ) with check (auth.uid() = created_by);

create table if not exists public.call_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.call_sessions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  participant_role text not null default 'guest' check (participant_role in ('host','guest')),
  joined_at timestamptz,
  left_at timestamptz
);

alter table public.call_participants enable row level security;
drop policy if exists "call_participants_session_members" on public.call_participants;
create policy "call_participants_session_members" on public.call_participants
  for all using (
    exists (select 1 from public.call_sessions s
            where s.id = call_participants.session_id
              and (s.created_by = auth.uid()
                   or exists (select 1 from public.call_participants p
                              where p.session_id = s.id and p.user_id = auth.uid())))
  ) with check (
    exists (select 1 from public.call_sessions s
            where s.id = call_participants.session_id
              and (s.created_by = auth.uid()
                   or exists (select 1 from public.call_participants p
                              where p.session_id = s.id and p.user_id = auth.uid())))
  );

-- Consent records are kept separate from user preferences (PRD 88).
create table if not exists public.call_consents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.call_sessions (id) on delete cascade,
  participant_id uuid not null references public.call_participants (id) on delete cascade,
  consent_type text not null default 'ai_audio_processing',
  status text not null check (status in ('granted','declined','revoked')),
  granted_at timestamptz,
  revoked_at timestamptz,
  policy_version text not null default '1.0'
);

alter table public.call_consents enable row level security;
drop policy if exists "call_consents_session_members" on public.call_consents;
create policy "call_consents_session_members" on public.call_consents
  for all using (
    exists (select 1 from public.call_participants p
            join public.call_sessions s on s.id = p.session_id
            where p.id = call_consents.participant_id
              and (p.user_id = auth.uid() or s.created_by = auth.uid()))
  ) with check (
    exists (select 1 from public.call_participants p
            join public.call_sessions s on s.id = p.session_id
            where p.id = call_consents.participant_id
              and (p.user_id = auth.uid() or s.created_by = auth.uid()))
  );

create table if not exists public.live_transcripts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.call_sessions (id) on delete cascade,
  participant_id uuid references public.call_participants (id) on delete set null,
  text text not null,
  start_timestamp timestamptz not null default now(),
  end_timestamp timestamptz,
  created_at timestamptz not null default now()
);

alter table public.live_transcripts enable row level security;
drop policy if exists "live_transcripts_session_members" on public.live_transcripts;
create policy "live_transcripts_session_members" on public.live_transcripts
  for all using (
    exists (select 1 from public.call_participants p
            where p.session_id = live_transcripts.session_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.call_participants p
            where p.session_id = live_transcripts.session_id and p.user_id = auth.uid())
  );

create table if not exists public.live_suggestions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.call_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  suggestion_type text not null,                  -- reply | rescue | topic
  content text not null,
  status text not null default 'shown' check (status in ('shown','used','dismissed')),
  created_at timestamptz not null default now()
);

alter table public.live_suggestions enable row level security;
drop policy if exists "live_suggestions_owner" on public.live_suggestions;
create policy "live_suggestions_owner" on public.live_suggestions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.call_insights (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.call_sessions (id) on delete cascade,
  insight_type text not null,                     -- voice_pattern | communication
  summary text not null,
  confidence numeric,
  created_at timestamptz not null default now()
);

alter table public.call_insights enable row level security;
drop policy if exists "call_insights_session_members" on public.call_insights;
create policy "call_insights_session_members" on public.call_insights
  for all using (
    exists (select 1 from public.call_participants p
            where p.session_id = call_insights.session_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.call_participants p
            where p.session_id = call_insights.session_id and p.user_id = auth.uid())
  );

create table if not exists public.call_data_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users (id) on delete cascade,
  transcript_storage_enabled boolean not null default false,
  audio_storage_enabled boolean not null default false,   -- raw audio: disabled by default
  post_call_analysis_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.call_data_preferences enable row level security;
drop policy if exists "call_data_preferences_owner" on public.call_data_preferences;
create policy "call_data_preferences_owner" on public.call_data_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- indexes ----------
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);
create index if not exists idx_conversations_user on public.conversations (user_id, updated_at desc);
create index if not exists idx_memories_user on public.memories (user_id, created_at desc);
create index if not exists idx_tasks_user on public.tasks (user_id, completed_at, due_at);
create index if not exists idx_usage_user_kind on public.usage_events (user_id, kind, created_at);
