import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const logs = await prisma.dailyLog.findMany({
    where: { userId, date: { lt: today } },
    include: { foodEntries: { orderBy: { timestamp: "asc" } } },
    orderBy: { date: "desc" },
    take: 30,
  });

  return Response.json({ logs });
}
