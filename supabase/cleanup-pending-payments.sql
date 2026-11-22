-- ============================================================
-- Cleanup: stale pending payment rows left by abandoned/failed checkouts.
-- Safe to re-run. Only touches uncaptured rows older than the most recent
-- successful purchase (or older than 1 hour if there are no purchases yet).
-- Completed payments and premium access are never modified.
-- ============================================================

update public.payments
set status = 'failed'
where status = 'pending'
  and provider_capture_id is null
  and created_at < coalesce(
        (select max(created_at) from public.payments where status = 'completed'),
        now() - interval '1 hour'
      );
