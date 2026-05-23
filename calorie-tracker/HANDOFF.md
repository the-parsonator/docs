# Calorie Tracker — Context Handoff

Use this file to resume work on the calorie tracker app in a new session.

## What this is

A production-ready, mobile-first calorie tracking SaaS app at `/home/user/docs/calorie-tracker/`. Phase 1 is complete and pushed. Phase 2 (billing, password reset) is planned but not started.

## Repository

- **Repo**: `the-parsonator/docs`
- **Branch**: `claude/calorie-tracker-app-aarDm`
- **PR**: https://github.com/the-parsonator/docs/pull/11 — includes a full architecture walkthrough comment
- **Working directory**: `/home/user/docs/calorie-tracker/`

## Current state

Everything is built, tested, and pushed. The dev server runs with `npm run dev` and is accessible at `http://localhost:3000`.

### What's complete

- Auth (register / login / logout) with JWT in httpOnly cookie + session invalidation table
- Food logging via manual entry, barcode scan (OpenFoodFacts), and photo (Claude Haiku vision)
- Calorie countdown display (green/red), progress bar, editable daily target
- Recent foods quick-add chips, consistency counter (streak), food history
- PostHog analytics + Sentry error tracking
- Upstash Redis rate limiter (falls back to in-memory for local dev)
- Vitest test suite (24 tests across validate, rate-limit, ownership)
- Cursor-based pagination on history API
- Auto-migration on deploy (`prisma migrate deploy && next build`)

### What's not built yet (Phase 2)

- Billing — `resetToken` + `resetTokenExpiresAt` already on the `User` model, unused. Provider-agnostic interface planned for `src/lib/billing/`. Recommended providers: LemonSqueezy or Paddle (both handle global VAT as merchant of record).
- Password reset + welcome email via Resend
- Upstash Redis not yet configured in production (just add the two env vars in Vercel — no code changes needed)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, TypeScript |
| Database | SQLite (local) / Turso LibSQL (production) via Prisma 7 |
| Auth | JWT + Session table, `jose`, httpOnly cookie |
| Passwords | bcryptjs cost 12 |
| Validation | Zod on all API boundaries |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` in globals.css — no config file) |
| Client state | React Query v5 |
| Analytics | PostHog + Sentry |
| Testing | Vitest |

## Key files

```
calorie-tracker/
├── prisma/schema.prisma          # User, Session, DailyLog, FoodEntry models
├── prisma.config.ts              # Prisma 7: DATABASE_URL lives here, not schema.prisma
├── src/lib/
│   ├── auth.ts                   # JWT sign/verify, session create/revoke, cookie helpers
│   ├── prisma.ts                 # Singleton PrismaClient with PrismaLibSql adapter
│   ├── rate-limit.ts             # Upstash Redis if env vars set, in-memory fallback
│   ├── validate.ts               # All Zod schemas
│   ├── daily-log.ts              # getOrCreateTodayLog (upsert with calorieTarget snapshot)
│   ├── analytics.ts              # PostHog track() helper
│   └── password.ts               # bcryptjs hash/verify
├── src/middleware.ts             # JWT check on all routes except /api/auth/*
├── src/app/api/
│   ├── auth/{register,login,logout,me}/route.ts
│   ├── daily-log/route.ts
│   ├── food-entry/route.ts + [id]/route.ts
│   ├── history/route.ts          # cursor pagination via ?before=YYYY-MM-DD
│   ├── food-search/route.ts      # OpenFoodFacts barcode proxy
│   ├── recent-foods/route.ts
│   └── food-photo/route.ts       # Claude Haiku vision, 10/day per-user limit
├── src/components/
│   ├── auth/AuthForm.tsx
│   └── dashboard/
│       ├── CalorieDisplay.tsx    # Big number, green/red, progress bar
│       ├── FoodLogger.tsx        # Manual + barcode + photo inputs
│       ├── FoodList.tsx          # Scrollable entries with delete
│       ├── RecentFoods.tsx       # Quick-add chips (Agent F)
│       ├── StreakBadge.tsx        # Consecutive days counter
│       ├── TargetEditor.tsx      # Tap-to-edit calorie target
│       └── DashboardClient.tsx   # Assembles dashboard, lifts prefill state
└── src/lib/__tests__/ + src/app/api/__tests__/   # Vitest tests
```

## Environment variables

```bash
# .env.local (already configured for local dev)
DATABASE_URL="file:./prisma/dev.db"
TURSO_AUTH_TOKEN=""                        # empty = local SQLite
JWT_SECRET="dev-secret-change-in-production-must-be-32-chars-long"
ANTHROPIC_API_KEY=""                       # empty = photo recognition disabled

# Add these for production (Vercel):
# DATABASE_URL=libsql://xxx.turso.io
# TURSO_AUTH_TOKEN=your-turso-token
# JWT_SECRET=<openssl rand -base64 32>
# ANTHROPIC_API_KEY=your-key
# NEXT_PUBLIC_POSTHOG_KEY=your-key
# NEXT_PUBLIC_SENTRY_DSN=your-dsn
# UPSTASH_REDIS_REST_URL=your-url      # activates production rate limiting
# UPSTASH_REDIS_REST_TOKEN=your-token
```

## Common commands

```bash
cd /home/user/docs/calorie-tracker

npm run dev          # start dev server → http://localhost:3000
npm test             # run Vitest suite (24 tests)
npx tsc --noEmit     # TypeScript check

npx prisma migrate dev --name <name>   # new migration after schema change
npx prisma generate                    # regenerate client after schema change
npx prisma studio                      # browse DB in browser
```

## Important architectural decisions (non-obvious)

1. **`date` stored as `String "YYYY-MM-DD"`** — SQLite has no native date type; using DateTime causes timezone edge cases. String comparison works correctly on this format.
2. **`DailyLog.calorieTarget` is a snapshot** — changing your target on Wednesday must not retroactively alter Tuesday's log.
3. **`photoScansDate` + `photoScansUsed`** — photo rate limit (10/day) lives in DB not memory, so it survives deploys. Natural daily reset: if `photoScansDate !== today`, treat count as 0.
4. **Session table + JWT hybrid** — JWT alone can't be revoked. Session table row is set `revokedAt` on logout. Middleware only checks JWT signature (fast); route handlers check DB session (revocation).
5. **`rateLimit()` is async** — required for Upstash. Both callers (`login`, `register`) use `await rateLimit(ip)`.
6. **Prisma 7 breaking changes** — adapter is `PrismaLibSql` (not `PrismaLibSQL`), takes `{ url, authToken }` directly. `datasource.url` moved to `prisma.config.ts`. Must run `npx prisma generate` after any schema change.
7. **`next/dynamic({ ssr: false })`** on `BarcodeScanner` and `PhotoLogger` — both access browser APIs (`getUserMedia`, `FileReader`) that don't exist server-side.
8. **`key` prop re-mount** on `FoodLogger` when a recent food is selected — `useState` ignores prop changes after mount; re-mounting via `key` is the correct pattern here.

## Brand voice (enforced, not optional)

The UI follows a "Calm Precision" system. Any new copy must pass:
- No exclamation marks anywhere
- No motivational language, praise, or reassurance
- Error messages ≤ 4 words
- Button labels ≤ 2 words
- Numbers are the primary communication — copy supports only when necessary
- Banned words: `great, nice, amazing, awesome, goal, streak, achievement, challenge, reward, congrats, well done, keep it up, you got this, don't worry, journey, healthier, celebrate, milestone`

## API contract

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | `{ email, password }` → sets cookie, returns user |
| POST | /api/auth/login | No | `{ email, password }` → sets cookie, returns user |
| GET | /api/auth/me | Yes | Returns current user |
| POST | /api/auth/logout | Yes | Revokes session, clears cookie |
| PATCH | /api/auth/me | Yes | `{ calorieTarget }` → updates target |
| GET | /api/daily-log | Yes | Today's log + food entries (creates if missing) |
| POST | /api/food-entry | Yes | `{ name, calories }` → adds entry |
| DELETE | /api/food-entry/[id] | Yes | Ownership-checked delete |
| GET | /api/history | Yes | Past logs, `?before=YYYY-MM-DD` cursor |
| GET | /api/food-search?barcode | Yes | OpenFoodFacts lookup |
| GET | /api/recent-foods | Yes | Last 5 distinct foods for this user |
| POST | /api/food-photo | Yes | `{ image: base64 }` → Claude Haiku vision |
