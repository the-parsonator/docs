import { NextRequest, NextResponse } from "next/server";
import { findDueGoals, markAwaitingProof } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await findDueGoals();

  for (const g of due) {
    await markAwaitingProof(g.id);
    await sendEmail({
      to: g.owner_email,
      subject: `Deadline today: ${g.title}`,
      text: `Time's up. Upload your proof in the next 24 hours or your £${g.stake_pence / 100} stake is charged.\n\n${process.env.APP_URL || "http://localhost:3000"}/g/${g.slug}/proof`,
    });
  }

  return NextResponse.json({ processed: due.length });
}
