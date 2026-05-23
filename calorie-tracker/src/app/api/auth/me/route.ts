import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { UpdateTargetSchema } from "@/lib/validate";

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return Response.json({ id: user.id, email: user.email, calorieTarget: user.calorieTarget });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = UpdateTargetSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check your input." }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { calorieTarget: parsed.data.calorieTarget },
  });
  return Response.json({ id: user.id, email: user.email, calorieTarget: user.calorieTarget });
}
