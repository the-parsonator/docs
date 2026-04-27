import { prisma } from "./prisma";

export async function getOrCreateTodayLog(userId: number) {
  const today = new Date().toISOString().slice(0, 10);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return prisma.dailyLog.upsert({
    where: { userId_date: { userId, date: today } },
    update: {},
    create: { userId, date: today, calorieTarget: user.calorieTarget },
    include: { foodEntries: { orderBy: { timestamp: "asc" } } },
  });
}
