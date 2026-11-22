-- ============================================================
-- Premium plan (PayPal one-time checkout, $4.99 / 1 month).
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- When premium expires. Set ONLY by the server (service role)
-- after a successful PayPal capture.
alter table public.profiles add column if not exists premium_until timestamptz;

-- Payment ledger: one row per PayPal order, written by the server
-- (service role). Users can view their own payment history.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
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
