# Haki — production deployment checklist

## 1. Supabase (new production project)

1. Create a new project at https://database.new.
2. Run these SQL files in the SQL editor, in order:
   - `supabase/schema.sql`
   - `supabase/premium.sql` (idempotent; safe on a fresh DB)
   - `supabase/security-fix.sql` (idempotent)
   - `supabase/cleanup-pending-payments.sql` is only needed for an existing DB with stale rows.
3. Authentication → Providers: enable Email.
4. Authentication → URL Configuration:
   - Site URL: `https://<your-app>.vercel.app`
   - Redirect URLs: `https://<your-app>.vercel.app/auth/callback`
   - Add your custom domain too, if you use one.
5. Copy the project URL, anon key, and service-role key from Project Settings → API.
   The service-role key is a secret — never prefix it with `NEXT_PUBLIC_`.

## 2. PayPal

1. In https://developer.paypal.com/dashboard/applications/live, create a **Merchant** REST app
   under your verified Business account.
2. Copy the **Live** Client ID and secret. Sandbox credentials cannot receive real money.
3. Confirm the Business account can accept payments in its country/currency before going live.
4. Set `PAYPAL_ENV=live` in Vercel along with the live credentials.

## 3. Vercel

1. Push this repository to GitHub, then "Add New… → Project" in Vercel and import it.
2. Framework: Next.js (auto-detected). Build command: `npm run build`. No custom output directory.
3. Add these Environment Variables (Production, Preview and Development as needed):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | production service-role key (secret) |
| `PAYPAL_ENV` | `live` (or `sandbox` for a test deployment) |
| `PAYPAL_CLIENT_ID` | Live app client ID |
| `PAYPAL_CLIENT_SECRET` | Live app secret |
| `LLM_API_KEY` | rotated Gemini key |
| `LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `LLM_MODEL` | `gemini-3.5-flash-lite` |

4. Deploy. Then visit `/login`, sign up, and smoke-test chat, limits, language switching, and
   the premium checkout (make a small real purchase and refund it if you want to validate live).

## 4. Before public launch

- Rotate every API key/secret that was pasted into chat: Supabase service-role key,
  PayPal secret, Gemini key.
- Consider adding security headers (CSP, HSTS, `X-Frame-Options`) and rate limiting to
  auth/payment endpoints.

## 5. Rotation log (2026-11-23)

- Supabase: new secret key `haki_prod_rotated` created; the exposed `default` secret was
  deleted and confirmed rejected by the API. Vercel `SUPABASE_SERVICE_ROLE_KEY` updated.
- Gemini: new API key created and verified against `gemini-3.5-flash-lite`; Vercel
  `LLM_API_KEY` updated.
- PayPal: new Live REST app created under the verified Business account; its Live
  client ID/secret were verified with a token request. Vercel `PAYPAL_CLIENT_ID` and
  `PAYPAL_CLIENT_SECRET` updated. No live charge was made.
- Vercel Production was redeployed with all rotated values.
- The project's stable production domain is `https://haki-one-weld.vercel.app`.
  The earlier `https://haki-ka2e4dyd1-echo8.vercel.app` URL is a deployment-specific
  alias pinned to the first deployment and must not be used for production links or
  Supabase Auth redirects.
- Supabase Auth Site URL and redirect URL must use the stable production domain:
  `https://haki-one-weld.vercel.app` and
  `https://haki-one-weld.vercel.app/auth/callback`.
- Local `.env.local` no longer contains the old exposed Gemini key or old Live PayPal
  credentials; it is sandbox-only. The exposed Live PayPal app should also be deleted
  in the PayPal developer dashboard if it has not been already.

