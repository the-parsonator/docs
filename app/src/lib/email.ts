import { Resend } from "resend";

const key = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM || "Pact <hi@pact.ai>";
const client = key ? new Resend(key) : null;

export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!client) {
    console.log("[email:stub]", args.subject, "->", args.to);
    console.log(args.text);
    return;
  }
  await client.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    text: args.text,
  });
}
