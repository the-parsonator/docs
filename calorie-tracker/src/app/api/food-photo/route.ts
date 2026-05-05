import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { FoodPhotoSchema, ClaudePhotoResponseSchema } from "@/lib/validate";

const DAILY_LIMIT = 10;

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const scansUsed = user.photoScansDate === today ? user.photoScansUsed : 0;

  if (scansUsed >= DAILY_LIMIT) {
    return Response.json({ error: "Daily photo limit reached." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = FoodPhotoSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check your input." }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Photo recognition unavailable." }, { status: 503 });
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: parsed.data.image,
              },
            },
            {
              type: "text",
              text: 'If this image contains food, respond with JSON only: {"name":"<short food name>","calories":<integer>}. Estimate calories for the visible portion. If no food is visible, respond with exactly: NOT_FOOD',
            },
          ],
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    if (text === "NOT_FOOD") {
      // Increment after confirming a valid (non-food) scan — not before parse
      await prisma.user.update({
        where: { id: userId },
        data: { photoScansDate: today, photoScansUsed: scansUsed + 1 },
      });
      return Response.json({ found: false, scansRemaining: DAILY_LIMIT - scansUsed - 1 });
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(text);
    } catch {
      return Response.json({ error: "Failed." }, { status: 500 });
    }

    const validated = ClaudePhotoResponseSchema.safeParse(rawJson);
    if (!validated.success) {
      return Response.json({ error: "Failed." }, { status: 500 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { photoScansDate: today, photoScansUsed: scansUsed + 1 },
    });

    return Response.json({
      found: true,
      name: validated.data.name,
      calories: validated.data.calories,
      scansRemaining: DAILY_LIMIT - scansUsed - 1,
    });
  } catch {
    return Response.json({ error: "Failed." }, { status: 500 });
  }
}
