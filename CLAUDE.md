# DockSlot

## What this is
DockSlot is a booking and operations SaaS for charter boat captains. Core
features: vessel/trip-type management, public booking flow with deposit and
balance payments via Stripe Connect, weather-hold workflow with self-serve
reschedule, waivers, SMS/email reminders, reviews, referral program, and
captain analytics. Target users are independent captains and small fleets
running fishing/sunset/sightseeing charters. In active development; live
URL: https://dockslot-app.vercel.app.

## Tech stack
- Next.js 16.1.1 (App Router) — note: middleware file is named `proxy.ts`
  (Next.js 16 renamed middleware → proxy)
- React 18.2, TypeScript (strict mode)
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- Supabase: Postgres, Auth, Storage
- Stripe + Stripe Connect (captain payouts) — 10% platform fee
- Resend for transactional email
- Twilio for SMS reminders and notifications
- Vercel hosting with preview deployments per branch
- Package manager: npm

## Repository map
- `/app` — Next.js App Router pages, layouts, and server actions
  - `/app/dashboard/*` — authenticated captain UI
  - `/app/c/[slug]` — public captain profile and booking pages
  - `/app/book`, `/app/manage`, `/app/modify`, `/app/reschedule`, `/app/review`,
    `/app/waivers`, `/app/payment` — guest-facing flows
  - `/app/onboarding/*` — captain signup wizard (slug, vessel, trip types)
  - `/app/api/*` — route handlers (REST endpoints, webhooks, crons)
  - `/app/api/cron/*` — Vercel cron handlers (see `vercel.json`)
- `/components` — React components; `/components/ui` has shared primitives
- `/lib` — Shared utilities and business logic
  - `/lib/auth/server.ts` — `requireAuth()` / `getAuthUser()` with retry logic
  - `/lib/data/` — server-side data-access helpers
  - `/lib/db/types.ts` — auto-generated Supabase types
  - `/lib/stripe/config.ts` — Stripe client, price ID resolution, platform fee
  - `/lib/subscription/` — tier gates (currently no-ops; see below)
  - `/lib/weather/`, `/lib/email/`, `/lib/sms/`, `/lib/availability.ts`,
    `/lib/booking-conflicts.ts`, `/lib/cache.ts`
- `/utils/supabase` — Supabase client factories (`server`, `client`, `service`,
  `middleware`). Uses `@supabase/ssr` with proper cookie handling.
- `/lib/supabase/` — older copies of the same client factories. New code
  should prefer `/utils/supabase/`. Migration in progress (see "Intentional
  patterns" below).
- `/supabase/migrations` — SQL migrations, timestamp-prefixed
- `/supabase/templates` — auth email HTML templates
- `/scripts` — operational scripts (DB inspection, schema dump, backfills)
- `/docs` — feature docs, QA notes, setup guides
- `/public` — static assets

## Environment variables
- **Public:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_APP_URL`
- **Supabase server:** `SUPABASE_SERVICE_ROLE_KEY` (admin/service-role client;
  bypasses RLS)
- **Email:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (defaults to Resend sandbox
  until domain is verified)
- **SMS:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_CAPTAIN_MONTHLY_PRICE_ID`, `STRIPE_CAPTAIN_ANNUAL_PRICE_ID`,
  `STRIPE_FLEET_MONTHLY_PRICE_ID`, `STRIPE_FLEET_ANNUAL_PRICE_ID`,
  `STRIPE_PRO_PRICE_ID` (legacy → maps to `captain` tier)
- **Stripe Connect:** `DOCKSLOT_PLATFORM_FEE_PERCENT` (defaults to 10)
- **Cron security:** `CRON_SECRET`
- **Vercel:** `VERCEL_OIDC_TOKEN` (auto), optional `VERCEL_TOKEN`

All `.env*` files are gitignored. Use `.env.local` for local development;
Vercel environment variables for deployments. Pull dev env locally via
`vercel env pull .env.local`.

Supabase project ref: `yuwenhahrdqdnwtfpxoe`. When using the Supabase MCP,
scope all operations to this project.

## Authentication
Supabase Auth with email/password. Sessions are cookie-based via
`@supabase/ssr`; the proxy in `/proxy.ts` calls `supabase.auth.getUser()` on
every request to refresh the session. Server-side auth in route handlers and
Server Components should use `requireAuth()` from `/lib/auth/server.ts`,
which adds retry logic for transient Supabase failures and redirects to
`/login` after retries are exhausted. The auth callback at
`/app/auth/callback/route.ts` exchanges codes for sessions (used by email
confirmation links). After signup, captains are routed through an onboarding
wizard (`/app/onboarding/`) that collects profile slug, vessel, and trip
types before granting full dashboard access.

## Route protection
The proxy at `/proxy.ts` refreshes sessions on every request. Per-route
authentication is enforced in Server Components / route handlers via
`requireAuth()`. Public routes include the captain profile pages
(`/c/[slug]`), the booking flow under `/book`, and guest self-service routes
(`/manage`, `/modify`, `/reschedule`, `/review`, `/waivers`, `/payment`).

## Subscriptions and gating
Three subscription tiers exist in the data model: `deckhand` (free),
`captain` ($29/mo or $249/yr), `fleet` ($79/mo or $699/yr). Stripe products
and prices for each tier+interval combination must be created in the Stripe
Dashboard and wired via env vars (see above). Tier mapping logic lives in
`/lib/stripe/config.ts` (`getPriceId`, `getTierFromPriceId`).

**Important:** the gating functions in `/lib/subscription/gates.ts` are
currently **no-ops** — every feature is available to every tier. This was
an intentional simplification; do not assume gates enforce limits, and do
not "fix" the no-ops without explicit confirmation from Eric.

## Stripe Connect and platform fees
Captains accept payments through their own connected Stripe accounts.
DockSlot keeps a platform fee (default 10%, configurable via
`DOCKSLOT_PLATFORM_FEE_PERCENT`) on each booking payment via
`application_fee_amount`. The remainder is auto-transferred to the captain.
See `calculatePlatformFee()` in `/lib/stripe/config.ts`. Webhooks live under
`/app/api/stripe/`.

## Cron jobs (Vercel)
Defined in `vercel.json`:
- `0 6 * * *` — `/api/cron/expire-bookings`
- `0 * * * *` — `/api/cron/resume-hibernation` (hourly)
- `0 8 * * *` — `/api/cron/check-weather`
- `0 9 * * *` — `/api/cron/generate-referral-codes`
- `0 10 * * *` — `/api/cron/send-reminders`
- `0 * * * *` — `/api/cron/send-review-requests` (hourly)
- `0 14 * * *` — `/api/cron/send-deposit-reminders`

All cron handlers must validate the `CRON_SECRET` header before executing.

## Conventions

### Data access layer
Server Components and route handlers read user-scoped data through the
`@supabase/ssr` server client (`createSupabaseServerClient` in
`/utils/supabase/server.ts`). For admin/cross-user operations (cron jobs,
webhooks, public-facing data lookups by slug), use
`createSupabaseServiceClient()` from `/utils/supabase/service.ts`, which
uses the service role key and bypasses RLS. Use the service client
sparingly and never in user-driven flows where RLS should apply.

### Supabase clients
Never instantiate Supabase clients inline. Use:
- `/utils/supabase/server.ts` — Server Components, Server Actions, route
  handlers (cookie-aware, RLS-enforced)
- `/utils/supabase/client.ts` — Client Components ("use client")
- `/utils/supabase/service.ts` — admin/cron/webhook (service role)
- `/lib/supabase/middleware.ts` — proxy refresh client

A second copy of `server.ts` and `client.ts` lives under `/lib/supabase/`.
This is legacy; new code should import from `/utils/supabase/`.

### Components
- Server Components by default. Client Components only with `"use client"`
  and a brief comment explaining why.
- All user-facing text lives in components; no hardcoded strings in route
  handlers. No i18n setup — plain English text only.
- TypeScript strict mode — no `any`, no `@ts-ignore` without a comment
  explaining why.

### Path aliases
`@/*` maps to the repo root. Import as `@/lib/...`, `@/components/...`,
`@/utils/...`, `@/app/...`.

## Key commands
- `npm run dev` — start development server
- `npm run build` — production build
- `npm run lint` — `next lint`
- `npm start` — start production server

## Workflow rules

### Always
- Create a feature branch off main for any change. Branch naming:
  `feature/<short-description>`, `fix/<short-description>`, `chore/<...>`.
- Open a Pull Request for every change. Never push directly to main.
- Before opening a PR, verify the change on the Vercel preview URL using
  Playwright MCP. Click through the actual user flow the change affects
  (captain dashboard *and* the relevant guest-facing flow if the change
  touches both). Screenshot anything that looks broken.
- Regenerate types after any schema change and commit `/lib/db/types.ts` in
  the same PR as the migration. Use the Supabase MCP
  `generate_typescript_types` tool, or run:
  `npx supabase gen types typescript --project-id yuwenhahrdqdnwtfpxoe > lib/db/types.ts`
- Write SQL migrations as files in `/supabase/migrations` with timestamp
  prefix. Apply via Supabase MCP, not by hand-running SQL in the dashboard.
- In PR descriptions: state the goal, the approach, and what was verified
  (preview URL tested, migrations applied cleanly, types regenerated).

### Never
- Never run destructive SQL (DROP, TRUNCATE, DELETE without WHERE) against
  production. If destructive work is needed in dev, confirm with Eric first.
- Never commit secrets, tokens, or API keys. Use `.env.local` for local
  development; environment variables for Vercel.
- Never modify `/lib/db/types.ts` by hand — it's auto-generated.
- Never touch payment, Stripe Connect, or platform-fee code paths without
  explicit confirmation from Eric.
- Never enable real subscription gates (`/lib/subscription/gates.ts`) without
  explicit confirmation — they are intentionally no-ops right now.
- Never mark a task done without running the verification checklist below.

## Verification checklist
A task is not done until all of these have been completed:

1. Code compiles with no TypeScript errors (`tsc --noEmit`) and no lint
   warnings introduced.
2. If schema changed: migration ran cleanly on the Supabase project
   (`yuwenhahrdqdnwtfpxoe`) or a branch DB, and types were regenerated.
3. Feature branch pushed and Vercel preview deployment succeeded.
4. Playwright MCP has clicked through the affected user flow on the
   preview URL and confirmed it works.
5. PR opened with a description covering goal, approach, and verification.

Note: a formal test suite doesn't exist yet. When adding a meaningful
feature, add at least one Playwright smoke test for it in `/tests/e2e`
(directory not yet created).

## Design system
- Maritime palette — emerald (success/confirmed), amber (warning/weather
  hold), rose (error/cancelled), blue (info/rescheduled), purple (refunds),
  slate (neutral). See `<StatusBadge />` and `<PaymentBadge />` for canonical
  usage.
- Tailwind CSS v4 with `@tailwindcss/postcss`. Tokens defined via CSS
  variables in `app/globals.css`.
- Icons: `lucide-react` is imported directly throughout the codebase. There
  is no shim layer (unlike GameLedger).
- Component primitives are minimal — extend existing components in
  `/components/ui` rather than pulling in a new UI library.

## Intentional patterns — do not refactor
These patterns look unconventional but are deliberate. Do not "modernize"
or refactor without explicit discussion with Eric:

1. **`proxy.ts` instead of `middleware.ts`** — Next.js 16 renamed
   middleware to proxy. This is correct, not a typo to "fix".
2. **No-op subscription gates** — `/lib/subscription/gates.ts` returns
   `true` / `false` constants by design. All paid features are currently
   available to all tiers. Re-enabling gating is a product decision, not
   a refactor.
3. **Dual Supabase client directories** — `/utils/supabase/` is the target;
   `/lib/supabase/` is legacy. Migrate call sites incrementally; do not
   delete `/lib/supabase/` wholesale.
4. **Service-role client used for public lookups** — captain profile pages
   under `/c/[slug]` use the service role client to fetch public data
   without forcing the visitor to authenticate. This is correct for public
   read paths; do not "fix" it by adding RLS gymnastics.
5. **Auth retry logic in `requireAuth()`** — the retry loop in
   `/lib/auth/server.ts` exists to handle transient Supabase auth failures.
   Don't simplify it back to a single `getUser()` call.

## Current state and known issues
- In active development; production has real captains and bookings.
- Stripe Fleet tier price IDs may not be configured in all environments —
  check before testing Fleet upgrade paths.
- Dual Supabase client directories (`/lib/supabase/` legacy,
  `/utils/supabase/` modern). New code uses modern; legacy call sites
  being migrated.
- No formal test suite yet.
- Transactional email: Resend (sender configured via `RESEND_FROM_EMAIL`,
  falls back to Resend sandbox).
- SMS: Twilio.

## People
- Eric: solo founder and sole developer. All meaningful decisions route to him.
