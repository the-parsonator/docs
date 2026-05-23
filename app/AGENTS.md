# Pact

Accountability tracker. Users make a public pact, stake real money, and prove they kept it by uploading a selfie that an AI judge verifies.

## Product

**Name:** Pact. **Domain:** `pact.ai` (primary, not yet registered) + `pact.so` (defensive).
**Pitch:** "Make a pact with yourself. Prove it with a selfie."
**Inspiration:** Pieter Levels' "Go Fucking Do It" (the stake mechanic) — modernised with selfie + AI verification instead of a referee email.

### Brand guidelines (decided, do not break)
- A CTO would say the name in a meeting (no jokey, no vulgar, no diminutives)
- B2B-extensible — "Pact for Teams" / "Pact for Coaches" must read naturally
- Positive framing — never lean on the loss narrative
- Short, friction-free, copy-paste-shareable
- Founders/makers wedge is the v1 target audience
- UK launch — `.co.uk` matters in copy and trust signals

### Vocabulary
- Brand: **Pact** (proper noun)
- Verb: **make a pact**, **seal the pact**
- Money: **stake** (noun) — the £ amount the user puts up
- Outcomes: **Kept** / **Broken** (status labels), not Won/Lost/Burned
- Email subjects: "Pact made", "Pact kept", "Pact broken"

## Mechanic
1. User writes a goal title + a proof description (what a photo of success looks like)
2. Picks a deadline + stake (£10–£500)
3. Adds card via Stripe SetupIntent (off-session, SCA-compliant via 3DS)
4. On deadline day, cron flips pact to `awaiting_proof` and emails owner
5. Owner uploads selfie → Claude vision judges against the proof description
6. Verdicts: `VERIFIED` (kept, no charge), `REJECTED` (retry), `INCONCLUSIVE` (retry, no attempt burned conceptually but counts in current impl)
7. After 3 rejections → status `lost`, off-session PaymentIntent charges the stake

## UK launch constraints (decided)
- **Not gambling**: no chance element. Always call it a *conditional service fee*, never a "bet".
- **No money transmission**: stake → us (service fee). Don't add charity/anti-charity (would require Stripe Connect + FCA).
- **SCA**: SetupIntent with `usage: off_session` triggers 3DS at goal creation. Charge later with `off_session: true` (MIT flag). Handle `requires_action` by emailing a re-auth link (not yet built).
- **Consumer Contracts Regs 2013**: required cooling-off waiver checkbox at creation. Form already has it.
- **Unfair Terms**: 14-day grace, two reminder emails before charge. Currently 24h grace + 3 attempts — revisit before launch.
- **GDPR**: no third-party PII surface (we ditched the referee model). Owner email only.
- **ICO registration** required at launch (~£40/yr).
- **Tax**: sole trader to start, VAT only above £90k.
- **Banking**: Tide (sole trader) or Mettle (Ltd).

## Tech stack
- Next.js 15 App Router + TypeScript strict + React 19
- Tailwind v4 (`@theme` tokens in `globals.css`)
- SQLite via `better-sqlite3` (one file at `data/app.db`, one table `goals`)
- Stripe SDK (`stripe` + `@stripe/stripe-js` + `@stripe/react-stripe-js`)
- Anthropic SDK (`claude-opus-4-7` with vision for the judge)
- Resend for email
- `nanoid` for IDs (24-char internal, 8-char shareable slug)
- `zod` for input validation

## File layout
```
app/
  src/
    app/
      layout.tsx, page.tsx, globals.css, icon.svg
      g/[slug]/page.tsx              # public goal page (re-verifies SetupIntent on ?setup_complete=1)
      g/[slug]/proof/page.tsx        # selfie upload UI
      api/
        goals/route.ts               # POST create
        goals/[slug]/proof/route.ts  # POST selfie -> vision -> charge
        cron/deadlines/route.ts      # bearer-auth, daily deadline transitions
        stripe/webhook/route.ts      # setup_intent.succeeded -> activate
    lib/
      db.ts, stripe.ts, vision.ts, email.ts, ids.ts, money.ts
    components/
      CreateGoalForm.tsx, PaymentForm.tsx, ProofUploader.tsx, StatusBadge.tsx
```

## Conventions (do not break without reason)
- **One table.** Schema in `src/lib/db.ts` with `CREATE TABLE IF NOT EXISTS` + idempotent `ALTER` for new columns. No ORM, no migration tool.
- **No auth.** Email is the identifier. Nothing is gated behind a login.
- **Money in pence.** Column is `stake_pence` (int). Format via `src/lib/money.ts` `formatGBP`.
- **Key-absent dev mode.** Every external dep checks for its env var and degrades gracefully:
  - No `STRIPE_SECRET_KEY` → goal goes straight to `active`, `clientSecret` is null
  - No `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → PaymentForm renders a warning banner
  - No `ANTHROPIC_API_KEY` → judge returns `INCONCLUSIVE` with explanation
  - No `RESEND_API_KEY` → emails log to console as `[email:stub]`
  This is the test harness. Do not introduce mocks or test scaffolding.
- **Single source of truth for SetupIntent activation.** Webhook is authoritative; the goal page's `?setup_complete=1` handler re-fetches from Stripe as belt-and-braces. Both paths are idempotent.
- **CSS tokens:** `--color-pact` (green), `--color-pact-dark`, `--color-burn` (red). Brand green is `#16a34a`.

## Status enum
`pending_setup | active | awaiting_proof | won | lost | refunded`
- `won` → label "Kept" (verdict was VERIFIED)
- `lost` → label "Broken" (3 rejections, card charged)

## Wired
- Goal creation form + zod validation + cooling-off + stake-auth consent
- Stripe SetupIntent w/ goal_id metadata
- Stripe Elements (PaymentElement) mounted inline post-creation
- Stripe webhook handler (`setup_intent.succeeded`)
- Public goal page with shareable slug + status badge
- Selfie upload + Claude vision verdict + 3-attempt retry + auto-charge on burn
- Recently-settled wall on landing
- Cron endpoint for deadline transitions (bearer-auth)
- Brand: name, colour tokens, copy, icon

## Stubbed / not yet built
- `requires_action` SCA fallback for the burn charge (email re-auth link)
- Replace SQLite + local uploads with Turso + Cloudflare R2 before deploy
- Vercel Cron schedule for `/api/cron/deadlines`
- Plausible analytics
- Terms / Privacy / Cookies pages
- Domain registration (`pact.ai` + `pact.so`)
- Real `RESEND_FROM` + verified sender domain
- Anti-tamper on the judge: EXIF + perceptual hash to reject reused photos

## Local dev
```
cd app
cp .env.example .env.local   # all keys optional; absence triggers dev mode
npm install
npm run dev                  # localhost:3000
npm run typecheck            # strict, must be 0 errors
```

To exercise the real Stripe flow: set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and run `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Build philosophy
Boring stack. One table. Ship in days. Monetise day one. Every line earns its place. Pieter Levels' playbook, adapted for a CTO-acceptable brand and a UK launch.
