import { NextRequest, NextResponse } from "next/server";
import {
  getGoalBySlug,
  recordProofAttempt,
  type GoalStatus,
} from "@/lib/db";
import { uploadProof } from "@/lib/storage";
import { verifyProof } from "@/lib/vision";
import { chargeStake } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const goal = await getGoalBySlug(slug);
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (goal.status === "won" || goal.status === "lost") {
    return NextResponse.json({ error: "Already settled" }, { status: 400 });
  }
  if (goal.attempts >= 3) {
    return NextResponse.json({ error: "No attempts left" }, { status: 400 });
  }

  const form = await req.formData();
  const image = form.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "No image" }, { status: 400 });
  }
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 400 });
  }
  const mediaType = image.type;
  if (!ALLOWED.has(mediaType)) {
    return NextResponse.json(
      { error: "Unsupported image type" },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await image.arrayBuffer());
  const proofPath = await uploadProof({ slug, buffer: buf, mediaType });

  const verdict = await verifyProof({
    proofPrompt: goal.proof_prompt,
    goalTitle: goal.title,
    imageBase64: buf.toString("base64"),
    imageMediaType: mediaType as "image/jpeg" | "image/png" | "image/webp",
  });

  const nextAttempts = goal.attempts + 1;
  let newStatus: GoalStatus = goal.status;
  let chargedAt: string | null = null;

  if (verdict.verdict === "VERIFIED") {
    newStatus = "won";
  } else if (nextAttempts >= 3) {
    newStatus = "lost";
    chargedAt = new Date().toISOString();
    if (goal.stripe_customer && goal.stripe_pm) {
      try {
        await chargeStake({
          customerId: goal.stripe_customer,
          paymentMethod: goal.stripe_pm,
          amountPence: goal.stake_pence,
          description: `Pact broken: ${goal.title}`,
        });
      } catch (e) {
        console.error("Stripe charge failed", e);
      }
    }
    await sendEmail({
      to: goal.owner_email,
      subject: `Pact broken: £${goal.stake_pence / 100} charged`,
      text: `Your proof for "${goal.title}" was rejected after 3 attempts. Your stake has been charged.\n\nJudge: ${verdict.reason}`,
    });
  } else {
    newStatus = "awaiting_proof";
  }

  await recordProofAttempt({
    slug,
    proofPath,
    verdict: verdict.verdict,
    reason: verdict.reason,
    newStatus,
    attempts: nextAttempts,
    chargedAt,
  });

  if (newStatus === "won") {
    await sendEmail({
      to: goal.owner_email,
      subject: `Pact kept: ${goal.title}`,
      text: `Your proof was verified. No charge. Nicely done.`,
    });
  }

  return NextResponse.json({
    verdict: verdict.verdict,
    reason: verdict.reason,
    attempts_left: Math.max(0, 3 - nextAttempts),
    status: newStatus,
  });
}
