import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/history/:path*",
    // Protect all /api/* except the three public auth endpoints
    "/api/((?!auth/(register|login|logout)).+)",
  ],
};

export async function middleware(request: NextRequest) {
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
