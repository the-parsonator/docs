import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/history/:path*",
    // Protect all /api/* except the public auth endpoints
    "/api/((?!auth/(?:register|login|logout|forgot-password|reset-password)).+)",
  ],
};

export async function proxy(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    const isApi = request.nextUrl.pathname.startsWith("/api/");
    if (isApi) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
