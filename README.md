# Haki | حكي — Your AI Relationship Companion

Web-first MVP of the Haki product (see the PRD). Next.js App Router + TypeScript +
Tailwind CSS v4 + Supabase (auth, PostgreSQL, RLS) + any OpenAI-compatible LLM.

## Setup

1. **Supabase** — create a project at [supabase.com](https://supabase.com),
   open the SQL editor and run everything in [`supabase/schema.sql`](supabase/schema.sql).
   This creates all MVP tables with Row Level Security **plus** the future
   Live Companion tables (unused until the in-call feature ships).
2. **Environment** — copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
   - `LLM_API_KEY`, optional `LLM_BASE_URL`, `LLM_MODEL`
3. **Run** — `npm install && npm run dev`

### Placeholder mode

With no `LLM_API_KEY`, the app runs end-to-end but AI chat, smart replies and
insights return friendly canned fallbacks instead of failing. Add a key and
restart to go live. The LLM layer (`src/lib/llm`) speaks any
OpenAI-compatible `/chat/completions` API.

## What's in the MVP

- **Auth** — email/password + magic link (Supabase), session refresh in middleware.
- **Dashboard** — daily connection question, suggested activity, upcoming tasks, recent memories.
- **Haki AI** — streaming chat, conversation history, memory-aware context, delete conversations, stop control.
- **Memory extraction** — after each chat exchange a separate engine proposes memories; **nothing is stored without your confirmation**.
- **Partner profile** — name, relationship, interests, stress/love/energy preferences + "cheat sheet".
- **Talk** — 28 EN/AR questions, category filters, favorites, "we talked about it", send-to-to-do.
- **Activities** — 16 ideas with cost/energy/interest filters, favorites, send-to-to-do.
- **Memory** — categories, search, add/edit/delete, confirm AI suggestions.
- **To-do** — tasks with optional due dates.
- **Live Companion (text-based)** — smart replies (8 tones), conversation rescue, communication insights — all tentative, never judgmental, with 👍/👎 feedback.
- **i18n** — full English + Arabic (RTL), locale-aware dates.
- **Limits** — free plan: 20 chat messages / 10 suggestions / 5 insights per day; premium unlimited.
- **Export** — one-click JSON download of all user data.

## Architecture notes (for the future Live Companion)

- DB tables for `call_sessions`, `call_participants`, `call_consents`,
  `live_transcripts`, `live_suggestions`, `call_insights`,
  `call_data_preferences` already exist with RLS. Consent records are separate
  from user preferences; audio storage is disabled by default.
- AI engines are separate prompt modules (`src/lib/ai/prompts.ts`); the LLM
  transport is a swappable stream (`src/lib/llm`). When WebRTC + LiveKit arrive,
  the text-context source feeding `/api/suggest` and `/api/insights` gets
  replaced by a streaming-transcription source — the engines don't change.
- Raw audio is never stored by default; persistent transcripts require explicit opt-in (future `call_data_preferences` UI).

## Structure

```
src/
  app/
    (app)/          # authenticated pages: dashboard, chat, talk, activities, partner, memory, todo, settings
    api/            # chat (SSE), conversations, memory, tasks, partner, feedback, suggest, insights, export, lang, config, profile
    auth/           # callback (code exchange), signout
    login/          # auth page
  components/       # AppShell, ChatPanel, SuggestPanel, TopicBrowser, ActivityBrowser, PartnerForm, MemoryList, TaskList, SettingsView
  lib/
    ai/             # prompt modules per engine
    data/           # static topics / activities / situations catalogs
    i18n/           # EN+AR dictionary, server + client helpers
    llm/            # OpenAI-compatible streaming client (provider-agnostic)
    supabase/       # server / browser / middleware clients
  middleware.ts     # session refresh + route protection
supabase/schema.sql # full schema + RLS + future live tables
```
