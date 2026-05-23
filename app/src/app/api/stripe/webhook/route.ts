import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { activateGoalById } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature({ rawBody, signature });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Signature verification failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  switch (event.type) {
    case "setup_intent.succeeded": {
      const si = event.data.object as Stripe.SetupIntent;
      const goalId = si.metadata?.goal_id;
      const pm =
        typeof si.payment_method === "string"
          ? si.payment_method
          : si.payment_method?.id;
      if (goalId && pm) {
        await activateGoalById({ id: goalId, paymentMethod: pm });
      }
      break;
    }
    // Future: payment_intent.payment_failed for the broken-pact charge,
    // payment_intent.requires_action for SCA re-auth emails, etc.
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
