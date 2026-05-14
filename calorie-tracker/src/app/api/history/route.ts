import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

const PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  // `before` is a date cursor — fetch the page of logs older than this date
  const before = request.nextUrl.searchParams.get("before") ?? today;

  const logs = await prisma.dailyLog.findMany({
    where: { userId, date: { lt: before } },
    include: { foodEntries: { orderBy: { timestamp: "asc" } } },
    orderBy: { date: "desc" },
    take: PAGE_SIZE,
  });

  const hasMore = logs.length === PAGE_SIZE;
  const nextCursor = hasMore ? logs[logs.length - 1].date : null;

  return Response.json({ logs, hasMore, nextCursor });
}
