# Calorie Tracker — Context Handoff

Use this file to resume work on the calorie tracker app in a new session.

## What this is

A production-ready, mobile-first calorie tracking SaaS app. Phase 1 (core app) and Phase 2 (password reset + billing abstraction + Upstash docs) are both complete and pushed.

## Repository

- **Repo**: `the-parsonator/docs`
- **Branch**: `claude/calorie-tracker-app-aarDm` — always develop here, never push to main
- **PR**: https://github.com/the-parsonator/docs/pull/11

## Working directory (macOS)

```
~/code/calorie-tracker/                 # the cloned docs repo
└── calorie-tracker/                    # the Next.js app — `cd` here for everything
```

All `npm` / `npx` / `git` commands assume you are in `~/code/calorie-tracker/calorie-tracker/` (the app), except for `git` push/pull which work from anywhere inside the repo.

## Toolchain (already installed)

- Homebrew at `/opt/homebrew` (add `export PATH="/opt/homebrew/bin:$PATH"` if commands aren't found)
- Node 22 LTS via brew (`v22.22.3`)
- gh CLI configured with `the-parsonator` account, git operations over HTTPS — `git push` works
- Local SQLite DB at `prisma/dev.db`, fully migrated

## Current state

Everything builds, tests, and is pushed. Dev server runs with `npm run dev` → http://localhost:3000.

- tsc: clean
- vitest: 48/48 passing (24 from Phase 1 + 11 reset/validate + 9 LemonSqueezy + 3 CheckoutSchema + 1 misc)
- `next build`: clean, no deprecation warnings

### Phase 1 (complete)

- Auth (register / login / logout) with JWT in httpOnly cookie + session invalidation table
- Food logging via manual entry, barcode scan (OpenFoodFacts), and photo (Claude Haiku vision, 10/day per-user DB-tracked limit)
- Calorie countdown display (green/red), progress bar, editable daily target
- Recent foods chips, consistency counter (streak), history with cursor pagination
- PostHog analytics + Sentry error tracking
- Upstash Redis rate limiter (in-memory fallback for local dev)
- Auto-migration on deploy (`prisma migrate deploy && next build`)

### Phase 2 (complete — commits 24b14b6, 9c92760)

**Password reset (Resend)**
- `POST /api/auth/forgot-password` — rate-limited, generates `crypto.randomBytes(32).toString("hex")` token, stores SHA-256 hash + 1-hour expiry on User. Sends email via Resend. **Always returns 204** to prevent account enumeration. No-ops the send if `RESEND_API_KEY`/`RESEND_FROM_EMAIL` aren't set.
- `POST /api/auth/reset-password` — rate-limited, validates token hash + expiry, hashes new password, clears token fields, and **revokes all active sessions** in a single transaction.
- UI: `/forgot-password` and `/reset-password?token=...` pages. "Forgot password?" link in `AuthForm` (login mode only). All copy follows the Calm Precision brand voice.
- Utilities: `src/lib/reset-token.ts` (generate/hash), `src/lib/email.ts` (Resend wrapper).
- Zod: `ForgotPasswordSchema`, `ResetPasswordSchema` (rejects non-hex / wrong-length tokens).

**Billing abstraction (LemonSqueezy)**
- `src/lib/billing/index.ts` — `BillingProvider` interface with normalized `WebhookEvent` (created/updated/canceled/ignored). Factory + test seam.
- `src/lib/billing/lemonsqueezy.ts` — adapter:
  - `createCheckoutSession` posts JSON:API to `/v1/checkouts` with `userId` in `custom_data` so it round-trips via webhooks.
  - `createPortalSession` fetches the customer's `urls.customer_portal`.
  - `handleWebhook` verifies `X-Signature` via HMAC-SHA256 with `timingSafeEqual`, length-safe.
  - `mapStatus` normalizes LS statuses → `"free" | "trialing" | "active" | "canceled" | "past_due"`.
- Routes:
  - `POST /api/billing/checkout` (auth-required, Zod-validated `priceId`, returns `{ url }` or 502).
  - `POST /api/billing/portal` (auth-required, 404 if user has no `externalCustomerId`).
  - `POST /api/webhooks/billing` (signature-verified, applies events to DB, 204; 400 on bad signature). **No auth required — excluded from the proxy matcher.**
- Schema: added `externalCustomerId` (unique), `subscriptionStatus` (default `"free"`), `subscriptionId`, `trialEndsAt` to User.
- Migration: `20260523105700_add_billing_fields`.

**Upstash docs**: README documents `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, no code changes needed.

**Bonus**:
- `src/middleware.ts` → `src/proxy.ts` (Next.js 16 deprecation; exported function renamed `proxy`). Matcher uses non-capturing group to satisfy Next 16's stricter route parser.
- `prisma.config.ts` now loads `.env.local` before `.env` so the prisma CLI matches Next.js's runtime env loading.

### What's NOT built yet

- **Billing UI** — only the API routes exist. A "Subscribe" / "Manage billing" button on the dashboard would `POST /api/billing/checkout { priceId }` and redirect to the returned `url`. The proxy already protects the route.
- **Welcome email** — Resend wiring exists; a welcome-on-register email is not implemented.
- **Subscription gating** — `subscriptionStatus` is recorded but no feature is currently gated by it. Photo recognition could be a Pro feature, for example.
- **Linear/Paddle adapters** — interface is provider-agnostic, only LemonSqueezy is implemented.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, TypeScript |
| Database | SQLite (local) / Turso LibSQL (production) via Prisma 7 |
| Auth | JWT + Session table, `jose`, httpOnly cookie |
| Passwords | bcryptjs cost 12 |
| Email | Resend |
| Billing | LemonSqueezy (via provider-agnostic interface) |
| Validation | Zod on all API boundaries |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` in globals.css — no config file) |
| Client state | React Query v5 |
| Analytics | PostHog + Sentry |
| Testing | Vitest |

## Key files

```
calorie-tracker/
├── prisma/schema.prisma          # User (incl. billing fields), Session, DailyLog, FoodEntry
├── prisma.config.ts              # Prisma 7: loads .env.local then .env; DATABASE_URL lives here
├── src/lib/
│   ├── auth.ts                   # JWT sign/verify, session create/revoke, cookie helpers
│   ├── prisma.ts                 # Singleton PrismaClient with PrismaLibSql adapter
│   ├── rate-limit.ts             # Upstash Redis if env vars set, in-memory fallback
│   ├── validate.ts               # All Zod schemas (incl. ForgotPasswordSchema, ResetPasswordSchema, CheckoutSchema)
│   ├── daily-log.ts              # getOrCreateTodayLog (calorieTarget snapshot upsert)
│   ├── analytics.ts              # PostHog track()
│   ├── password.ts               # bcryptjs hash/verify
│   ├── reset-token.ts            # generate/hash reset tokens (Phase 2)
│   ├── email.ts                  # Resend wrapper, no-op without keys (Phase 2)
│   └── billing/
│       ├── index.ts              # BillingProvider interface, types, factory (Phase 2)
│       └── lemonsqueezy.ts       # LemonSqueezy adapter (Phase 2)
├── src/proxy.ts                  # JWT check on all routes except public auth + webhooks (renamed from middleware.ts)
├── src/app/api/
│   ├── auth/{register,login,logout,me,forgot-password,reset-password}/route.ts
│   ├── billing/{checkout,portal}/route.ts                  # Phase 2
│   ├── webhooks/billing/route.ts                           # Phase 2 (signature-verified)
│   ├── daily-log/route.ts
│   ├── food-entry/route.ts + [id]/route.ts
│   ├── history/route.ts          # cursor pagination via ?before=YYYY-MM-DD
│   ├── food-search/route.ts      # OpenFoodFacts barcode proxy
│   ├── recent-foods/route.ts
│   └── food-photo/route.ts       # Claude Haiku vision, 10/day per-user limit
├── src/components/
│   ├── auth/
│   │   ├── AuthForm.tsx          # login + register; "Forgot password?" link (Phase 2)
│   │   ├── ForgotPasswordForm.tsx (Phase 2)
│   │   └── ResetPasswordForm.tsx  (Phase 2)
│   └── dashboard/
│       ├── CalorieDisplay.tsx, FoodLogger.tsx, FoodList.tsx
│       ├── RecentFoods.tsx, StreakBadge.tsx, TargetEditor.tsx
│       └── DashboardClient.tsx
├── src/app/{forgot-password,reset-password}/page.tsx       # Phase 2
└── src/lib/__tests__/ + src/app/api/__tests__/             # Vitest tests (48 total)
```

## Environment variables

```bash
# .env.local — already configured for local dev
DATABASE_URL="file:./prisma/dev.db"
TURSO_AUTH_TOKEN=""
JWT_SECRET="dev-secret-change-in-production-must-be-32-chars-long"
ANTHROPIC_API_KEY=""

# Production (Vercel):
# DATABASE_URL=libsql://xxx.turso.io
# TURSO_AUTH_TOKEN=your-turso-token
# JWT_SECRET=$(openssl rand -base64 32)
# ANTHROPIC_API_KEY=your-key
# NEXT_PUBLIC_POSTHOG_KEY=your-key
# NEXT_PUBLIC_SENTRY_DSN=your-dsn
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
# RESEND_API_KEY=...
# RESEND_FROM_EMAIL=noreply@yourdomain.com
# APP_URL=https://app.example.com
# LEMONSQUEEZY_API_KEY=...
# LEMONSQUEEZY_STORE_ID=...
# LEMONSQUEEZY_WEBHOOK_SECRET=...
```

## Common commands

```bash
cd ~/code/calorie-tracker/calorie-tracker
export PATH="/opt/homebrew/bin:$PATH"   # if node/npm aren't found

npm run dev                              # http://localhost:3000
npm test                                 # Vitest (48 tests)
npx tsc --noEmit                         # TypeScript check
npx next build                           # full production build
npx prisma migrate dev --name <name>     # after schema changes
npx prisma generate                      # after schema changes (migrate dev does this too)
```

## Critical architectural decisions — read before touching anything

1. **Prisma 7 is NOT Prisma 6.** Adapter is `PrismaLibSql` (capital S, no L at end). `datasource` block in `schema.prisma` has no `url` field — it lives in `prisma.config.ts`. Always run `npx prisma generate` after any schema change.
2. **`date` is `String "YYYY-MM-DD"`**, not DateTime. String comparisons work on this format.
3. **`DailyLog.calorieTarget` is a snapshot**, not a FK. Today's log stays in sync via the upsert; past logs are immutable history.
4. **Session table + JWT hybrid.** `signToken` embeds `sid` in the JWT. `getUserIdFromRequest` verifies JWT signature AND checks the `Session` row is not revoked. Proxy (`src/proxy.ts`) only checks JWT signature for Edge perf — route handlers do the DB check.
5. **`rateLimit()` is async.** Callers must `await rateLimit(ip)`.
6. **Reset tokens are stored hashed (SHA-256)**, never raw. The URL contains the raw token; the DB only has the hash.
7. **Password reset revokes all sessions** in the same transaction as the password update — existing JWTs are dead once the password changes.
8. **Webhooks are NOT auth-protected** by the proxy. They are authenticated by HMAC-SHA256 signature verification inside the route handler. The proxy matcher excludes `/api/webhooks/`.
9. **LemonSqueezy `custom_data.userId`** rides on the checkout and survives across webhook events for the subscription. That's how we map LS customers back to our users on `subscription_created`. Subsequent events use `externalCustomerId` or `subscriptionId` to look up the user.
10. **`next/dynamic({ ssr: false })`** on BarcodeScanner and PhotoLogger — they use browser APIs.
11. **Photo scan counter increments after successful parse**, not before — a malformed Claude response doesn't burn the user's daily quota.

## Brand voice — enforced, not optional

All UI copy follows the "Calm Precision" system. New copy must pass:

- No exclamation marks — anywhere
- No motivational language, praise, or reassurance
- Error messages ≤ 4 words (`Failed.` / `Not found.` / `Invalid credentials.` / `Invalid token.`)
- Button labels ≤ 2 words (`Add` / `Log in` / `Create account` / `Send link` / `Save`)
- Numbers are the primary communication — copy supports only when necessary
- **Banned words**: great, nice, amazing, awesome, goal, streak, achievement, challenge, reward, congrats, well done, keep it up, you got this, don't worry, journey, healthier, celebrate, milestone

## API contract (full)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/register | No | Rate-limited |
| POST | /api/auth/login | No | Rate-limited |
| GET | /api/auth/me | Yes | |
| POST | /api/auth/logout | Yes | Revokes session |
| PATCH | /api/auth/me | Yes | `{ calorieTarget }` |
| POST | /api/auth/forgot-password | No | Rate-limited, always 204 |
| POST | /api/auth/reset-password | No | Rate-limited, revokes all sessions on success |
| GET | /api/daily-log | Yes | Creates today's log if missing |
| POST | /api/food-entry | Yes | `{ name, calories }` |
| DELETE | /api/food-entry/[id] | Yes | Ownership-checked |
| GET | /api/history | Yes | `?before=YYYY-MM-DD` cursor |
| GET | /api/food-search?barcode | Yes | OpenFoodFacts proxy |
| GET | /api/recent-foods | Yes | Last 5 distinct foods |
| POST | /api/food-photo | Yes | `{ image: base64 }`, 10/day limit |
| POST | /api/billing/checkout | Yes | `{ priceId }` → `{ url }` |
| POST | /api/billing/portal | Yes | 404 if no `externalCustomerId` |
| POST | /api/webhooks/billing | No (HMAC-verified) | Updates `subscriptionStatus` etc. |
