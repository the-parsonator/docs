import { NextRequest } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getOrCreateTodayLog } from "@/lib/daily-log";

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const log = await getOrCreateTodayLog(userId);
  return Response.json({ log });
}
