import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { ForgotPasswordSchema } from "@/lib/validate";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await rateLimit(ip))) {
    return Response.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Check your input." }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const { raw, hash } = generateResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hash,
        resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const origin = process.env.APP_URL ?? new URL(request.url).origin;
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${origin}/reset-password?token=${raw}`,
    });
  }

  // Always 204 — same response whether the email exists or not, to prevent enumeration.
  return new Response(null, { status: 204 });
}
