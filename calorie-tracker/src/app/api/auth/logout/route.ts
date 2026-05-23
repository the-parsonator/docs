import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken, revokeSession, clearAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (token) {
    const payload = await verifyToken(token);
    if (payload?.sid) await revokeSession(payload.sid);
  }
  const response = NextResponse.json({});
  clearAuthCookie(response);
  return response;
}
