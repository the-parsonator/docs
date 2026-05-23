import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const findDue = db.prepare(`
  SELECT * FROM goals
   WHERE status = 'active'
     AND date(deadline) <= date('now')
`);
const markAwaiting = db.prepare(`
  UPDATE goals SET status = 'awaiting_proof' WHERE id = ?
`);

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = findDue.all() as Array<{
    id: string;
    slug: string;
    title: string;
    owner_email: string;
    stake_pence: number;
  }>;

  for (const g of due) {
    markAwaiting.run(g.id);
    await sendEmail({
      to: g.owner_email,
      subject: `Deadline today: ${g.title}`,
      text: `Time's up. Upload your proof in the next 24 hours or your £${g.stake_pence / 100} stake is charged.\n\n${process.env.APP_URL || "http://localhost:3000"}/g/${g.slug}/proof`,
    });
  }

  return NextResponse.json({ processed: due.length });
}
