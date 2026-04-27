import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { getOrCreateTodayLog } from "@/lib/daily-log";
import { FoodEntrySchema } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = FoodEntrySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check your input." }, { status: 400 });

  const log = await getOrCreateTodayLog(userId);
  const entry = await prisma.foodEntry.create({
    data: {
      dailyLogId: log.id,
      name: parsed.data.name,
      calories: parsed.data.calories,
    },
  });

  return Response.json({ entry }, { status: 201 });
}
