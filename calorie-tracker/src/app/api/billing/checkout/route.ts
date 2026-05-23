import { NextRequest } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getBillingProvider } from "@/lib/billing";
import { CheckoutSchema } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Check your input." }, { status: 400 });
  }

  const origin = process.env.APP_URL ?? new URL(request.url).origin;
  try {
    const { url } = await getBillingProvider().createCheckoutSession({
      userId,
      priceId: parsed.data.priceId,
      successUrl: `${origin}/dashboard`,
      cancelUrl: `${origin}/dashboard`,
    });
    return Response.json({ url });
  } catch (err) {
    console.error("[billing/checkout]", err);
    return Response.json({ error: "Failed." }, { status: 502 });
  }
}
