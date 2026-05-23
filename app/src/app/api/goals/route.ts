import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { newId, newSlug } from "@/lib/ids";
import { createCustomerAndSetupIntent, stripeConfigured } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  title: z.string().min(3).max(120),
  proof_prompt: z.string().min(10).max(500),
  owner_email: z.string().email(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stake_pounds: z.number().int().min(10).max(500),
  accept_terms: z.literal(true),
  waive_cooling_off: z.literal(true),
});

const insert = db.prepare(`
  INSERT INTO goals (
    id, slug, title, proof_prompt, owner_email, deadline,
    stake_pence, stripe_customer, status
  ) VALUES (
    @id, @slug, @title, @proof_prompt, @owner_email, @deadline,
    @stake_pence, @stripe_customer, @status
  )
`);

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const deadline = new Date(input.deadline);
  if (deadline.getTime() < Date.now() + 12 * 60 * 60 * 1000) {
    return NextResponse.json(
      { error: "Deadline must be at least 12 hours away" },
      { status: 400 }
    );
  }

  const id = newId();
  const slug = newSlug();

  let customerId: string | null = null;
  let clientSecret: string | null = null;
  let status: "pending_setup" | "active" = "pending_setup";

  if (stripeConfigured()) {
    try {
      const r = await createCustomerAndSetupIntent(input.owner_email);
      customerId = r.customerId;
      clientSecret = r.clientSecret;
    } catch (e) {
      return NextResponse.json(
        { error: "Could not create payment intent" },
        { status: 500 }
      );
    }
  } else {
    // Dev mode: skip Stripe and mark active immediately so the rest of the
    // flow is testable without keys.
    status = "active";
  }

  insert.run({
    id,
    slug,
    title: input.title,
    proof_prompt: input.proof_prompt,
    owner_email: input.owner_email,
    deadline: input.deadline,
    stake_pence: input.stake_pounds * 100,
    stripe_customer: customerId,
    status,
  });

  await sendEmail({
    to: input.owner_email,
    subject: `Your stake is set: ${input.title}`,
    text: `You've staked £${input.stake_pounds} on: ${input.title}\n\nDeadline: ${input.deadline}\n\nUpload your proof here: ${process.env.APP_URL || "http://localhost:3000"}/g/${slug}/proof\n\nWin and we charge nothing. Fail and we charge £${input.stake_pounds}.`,
  });

  return NextResponse.json({ slug, clientSecret });
}
