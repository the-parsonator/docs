import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { ResetPasswordSchema } from "@/lib/validate";
import { hashResetToken } from "@/lib/reset-token";
import { hashPassword } from "@/lib/password";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await rateLimit(ip))) {
    return Response.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Check your input." }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  const user = await prisma.user.findFirst({
    where: { resetToken: tokenHash },
  });
  if (
    !user ||
    !user.resetTokenExpiresAt ||
    user.resetTokenExpiresAt < new Date()
  ) {
    return Response.json({ error: "Invalid token." }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    }),
    // Existing sessions become invalid once the password is changed.
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return new Response(null, { status: 204 });
}
