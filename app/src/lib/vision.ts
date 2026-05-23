import Anthropic from "@anthropic-ai/sdk";

const key = process.env.ANTHROPIC_API_KEY;
const client = key ? new Anthropic({ apiKey: key }) : null;

export type Verdict = {
  verdict: "VERIFIED" | "REJECTED" | "INCONCLUSIVE";
  reason: string;
};

const SYSTEM = `You are a strict but fair photo-verification judge for an accountability app.

The user committed to a goal and uploaded a selfie or photo as proof they did it.

Reply with a single JSON object: {"verdict": "VERIFIED" | "REJECTED" | "INCONCLUSIVE", "reason": "<one sentence>"}.

Rules:
- VERIFIED only if the image clearly shows evidence matching the proof description.
- REJECTED if the image is unrelated, obviously staged, or a screenshot of someone else's content.
- INCONCLUSIVE if the image is blurry, ambiguous, or partial.
- Be specific in the reason. No preamble, no markdown.`;

export async function verifyProof(args: {
  proofPrompt: string;
  goalTitle: string;
  imageBase64: string;
  imageMediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}): Promise<Verdict> {
  if (!client) {
    return {
      verdict: "INCONCLUSIVE",
      reason: "Vision verification not configured (missing ANTHROPIC_API_KEY).",
    };
  }

  const msg = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 300,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: args.imageMediaType,
              data: args.imageBase64,
            },
          },
          {
            type: "text",
            text: `Goal: ${args.goalTitle}\nProof description: ${args.proofPrompt}\n\nJudge the image.`,
          },
        ],
      },
    ],
  });

  const text =
    msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
  try {
    const parsed = JSON.parse(text) as Verdict;
    if (
      parsed.verdict === "VERIFIED" ||
      parsed.verdict === "REJECTED" ||
      parsed.verdict === "INCONCLUSIVE"
    ) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return {
    verdict: "INCONCLUSIVE",
    reason: `Could not parse judge response: ${text.slice(0, 200)}`,
  };
}
