# Calorie Tracker

Mobile-first calorie counting app. Log food by name, barcode scan, or photo. Numbers only — no motivational copy.

## Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: SQLite locally / Turso (LibSQL) in production via Prisma 7
- **Auth**: JWT in httpOnly cookie (`jose`)
- **Styling**: Tailwind CSS v4
- **Analytics**: PostHog + Sentry

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in values
cp .env.example .env.local

# 3. Run database migration
npx prisma migrate dev --name init

# 4. Start dev server
npm run dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | `file:./prisma/dev.db` locally; `libsql://xxx.turso.io` in production |
| `TURSO_AUTH_TOKEN` | Production only | Auth token from Turso dashboard |
| `JWT_SECRET` | Yes | ≥ 32 chars random string — `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Optional | Enables photo food recognition (Claude Haiku) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | Defaults to `https://eu.i.posthog.com` |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry DSN for error tracking |
| `UPSTASH_REDIS_REST_URL` | Production | Activates distributed rate limiting (see below) |
| `UPSTASH_REDIS_REST_TOKEN` | Production | Paired with the URL above |
| `RESEND_API_KEY` | Optional | Enables password reset emails (see below) |
| `RESEND_FROM_EMAIL` | Optional | Verified sender, e.g. `noreply@yourdomain.com` |
| `APP_URL` | Production | Public base URL, used in reset email links (e.g. `https://app.example.com`) |

## Deploy to Vercel + Turso

### 1. Create Turso database

```bash
turso db create calorie-tracker
turso db show calorie-tracker           # copy the URL
turso db tokens create calorie-tracker  # copy the token
```

### 2. Run production migration

```bash
DATABASE_URL=libsql://xxx.turso.io \
TURSO_AUTH_TOKEN=your-token \
npx prisma migrate deploy
```

### 3. Deploy to Vercel

```bash
vercel deploy --prod
```

Set these environment variables in the Vercel dashboard:

- `DATABASE_URL` — your Turso URL
- `TURSO_AUTH_TOKEN` — your Turso auth token
- `JWT_SECRET` — a random 32+ char string
- `ANTHROPIC_API_KEY` — if photo recognition is wanted

### 4. Analytics (optional)

- **PostHog**: create a project at posthog.com, add `NEXT_PUBLIC_POSTHOG_KEY`
- **Sentry**: create a project at sentry.io, add `NEXT_PUBLIC_SENTRY_DSN`

Both are no-ops if the keys are absent — safe to skip for initial deploy.

### 5. Production rate limiting (Upstash Redis)

The rate limiter falls back to a process-local `Map` if Upstash env vars are absent — fine for local dev, but ineffective across serverless instances. For production:

1. Create a free Redis database at [upstash.com](https://upstash.com).
2. From the database page, copy the **REST URL** and **REST Token**.
3. Add to Vercel:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

No code changes required — [src/lib/rate-limit.ts](src/lib/rate-limit.ts) detects the vars at runtime and switches to `@upstash/ratelimit` (sliding window, 5 req/min/IP).

### 6. Password reset emails (Resend)

Required to enable the `/forgot-password` flow. Without these vars, the route still accepts requests (and returns `204` to avoid email enumeration) but no email is sent.

1. Create an account at [resend.com](https://resend.com) and verify a sending domain.
2. Create an API key.
3. Add to Vercel:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` — must be on the verified domain
   - `APP_URL` — public origin used in the reset link

## Features

- **Auth**: email + password, JWT cookie, rate-limited login (5/min/IP)
- **Food logging**: manual entry, barcode scan (OpenFoodFacts), photo recognition (Claude Haiku)
- **Photo scan limit**: 10/user/day, tracked in DB (survives deploys)
- **History**: per-day log with calorie target snapshot
- **Editable target**: tap the `/ 2000 kcal` display to change inline
- **Consistency counter**: consecutive days logged, shown in muted text
- **Recent foods**: one-tap re-add from last 5 entries
- **PWA-ready**: installable to home screen, standalone display mode

## Phase 2 (in progress)

- Billing abstraction layer (LemonSqueezy / Paddle — merchant of record handles global VAT)
- Password reset via Resend
