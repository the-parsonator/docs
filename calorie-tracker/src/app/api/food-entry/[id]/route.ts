import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entryId = parseInt(id, 10);
  if (isNaN(entryId)) return Response.json({ error: "Check your input." }, { status: 400 });

  const entry = await prisma.foodEntry.findUnique({
    where: { id: entryId },
    include: { dailyLog: true },
  });

  if (!entry) return Response.json({ error: "Not found." }, { status: 404 });
  if (entry.dailyLog.userId !== userId) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  await prisma.foodEntry.delete({ where: { id: entryId } });
  return new Response(null, { status: 204 });
}
