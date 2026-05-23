import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "auth_token";

function buildSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(raw);
}
const secret = buildSecret();

export async function createSession(userId: number): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { userId, expiresAt } });
  return session.id;
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  }).catch(() => {});
}

async function isSessionValid(sessionId: string): Promise<boolean> {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.revokedAt) return false;
  if (session.expiresAt < new Date()) return false;
  return true;
}

export async function signToken(payload: { sub: string; email: string; sid: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<{ sub: string; email: string; sid: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || !payload.sid) return null;
    return payload as { sub: string; email: string; sid: string };
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value ?? null;
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  if (!(await isSessionValid(payload.sid))) return null;
  return parseInt(payload.sub, 10);
}

export async function getUserIdFromCookies(): Promise<number | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  if (!(await isSessionValid(payload.sid))) return null;
  return parseInt(payload.sub, 10);
}
