import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  const resend = getClient();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resend || !from) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[email] RESEND_API_KEY or RESEND_FROM_EMAIL not set; reset email not sent"
      );
    }
    return;
  }
  await resend.emails.send({
    from,
    to: params.to,
    subject: "Reset your password",
    text: `Reset link: ${params.resetUrl}\n\nExpires in 1 hour. Ignore this email if you did not request a reset.`,
  });
}
