import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signToken, setAuthCookie, createSession } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { AuthSchema } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await rateLimit(ip))) {
    return Response.json({ error: "Too many attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = AuthSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Check your input." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const valid = user && (await verifyPassword(password, user.passwordHash));
  if (!valid) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const sid = await createSession(user.id);
  const token = await signToken({ sub: String(user.id), email: user.email, sid });
  const response = NextResponse.json({
    id: user.id,
    email: user.email,
    calorieTarget: user.calorieTarget,
  });
  setAuthCookie(response, token);
  return response;
}
