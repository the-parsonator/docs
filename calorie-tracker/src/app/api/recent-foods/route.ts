import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.foodEntry.findMany({
    where: { dailyLog: { userId } },
    orderBy: { timestamp: "desc" },
    take: 50,
    select: { name: true, calories: true },
  });

  // Deduplicate by name, keep most recent calorie value
  const seen = new Map<string, number>();
  for (const e of entries) {
    if (!seen.has(e.name)) seen.set(e.name, e.calories);
  }

  const foods = Array.from(seen.entries())
    .slice(0, 10)
    .map(([name, calories]) => ({ name, calories }));

  return Response.json({ foods });
}
