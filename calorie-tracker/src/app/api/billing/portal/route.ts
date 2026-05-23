import { NextRequest } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBillingProvider } from "@/lib/billing";

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { externalCustomerId: true },
  });
  if (!user?.externalCustomerId) {
    return Response.json({ error: "No subscription." }, { status: 404 });
  }

  const origin = process.env.APP_URL ?? new URL(request.url).origin;
  try {
    const { url } = await getBillingProvider().createPortalSession({
      externalCustomerId: user.externalCustomerId,
      returnUrl: `${origin}/dashboard`,
    });
    return Response.json({ url });
  } catch (err) {
    console.error("[billing/portal]", err);
    return Response.json({ error: "Failed." }, { status: 502 });
  }
}
