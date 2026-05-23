You are continuing work on a calorie tracker SaaS app. Read the handoff doc first, then confirm you're ready.

```
Read /home/user/docs/calorie-tracker/HANDOFF.md
```

## Context

- Working directory: `/home/user/docs/calorie-tracker/`
- Branch: `claude/calorie-tracker-app-aarDm` on `the-parsonator/docs`
- PR with full architecture notes: https://github.com/the-parsonator/docs/pull/11
- Dev server: `npm run dev` → http://localhost:3000
- Tests: `npm test` (24 passing)
- TypeScript: clean (`npx tsc --noEmit`)

## Phase 1 is complete. Phase 2 is next.

Phase 2 work remaining:

1. **Billing abstraction layer** — provider-agnostic interface in `src/lib/billing/`. Recommended: LemonSqueezy or Paddle (merchant of record, handles global VAT). Fields `externalCustomerId`, `subscriptionStatus`, `subscriptionId`, `trialEndsAt` need adding to the `User` model.

2. **Password reset** — `resetToken` + `resetTokenExpiresAt` already on `User` model, unused. Needs: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, email sending via Resend (free tier: 3,000/mo).

3. **Production Upstash Redis** — no code changes needed. Just set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel. The rate limiter detects them automatically.

## Rules

- Always develop on branch `claude/calorie-tracker-app-aarDm`
- Commit and push when work is complete
- Run `npx tsc --noEmit` and `npm test` before committing
- After any `prisma/schema.prisma` change: `npx prisma migrate dev --name <name>` then `npx prisma generate`
- Brand voice: no exclamation marks, no motivational copy, numbers first, error messages ≤ 4 words. Full rules in HANDOFF.md.
- Do not create a PR unless explicitly asked
