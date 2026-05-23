import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBillingProvider } from "@/lib/billing";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  let event;
  try {
    event = await getBillingProvider().handleWebhook(rawBody, signature);
  } catch (err) {
    console.error("[webhooks/billing] signature/parse failed", err);
    return Response.json({ error: "Invalid." }, { status: 400 });
  }

  switch (event.type) {
    case "subscription.created":
      await prisma.user.update({
        where: { id: event.userId },
        data: {
          externalCustomerId: event.externalCustomerId,
          subscriptionId: event.subscriptionId,
          subscriptionStatus: event.status,
          trialEndsAt: event.trialEndsAt,
        },
      });
      break;

    case "subscription.updated":
      await prisma.user.updateMany({
        where: { externalCustomerId: event.externalCustomerId },
        data: {
          subscriptionId: event.subscriptionId,
          subscriptionStatus: event.status,
          trialEndsAt: event.trialEndsAt,
        },
      });
      break;

    case "subscription.canceled":
      await prisma.user.updateMany({
        where: { subscriptionId: event.subscriptionId },
        data: { subscriptionStatus: "canceled" },
      });
      break;

    case "ignored":
      break;
  }

  return new Response(null, { status: 204 });
}
