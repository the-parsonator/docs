import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;

export const stripeConfigured = () => stripe !== null;

export async function createCustomerAndSetupIntent(args: {
  email: string;
  goalId: string;
}) {
  if (!stripe) throw new Error("Stripe not configured");
  const customer = await stripe.customers.create({
    email: args.email,
    metadata: { goal_id: args.goalId },
  });
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ["card"],
    usage: "off_session",
    metadata: { goal_id: args.goalId },
  });
  return {
    customerId: customer.id,
    setupIntentId: setupIntent.id,
    clientSecret: setupIntent.client_secret!,
  };
}

export async function retrieveSetupIntent(id: string) {
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.setupIntents.retrieve(id);
}

export function verifyWebhookSignature(args: {
  rawBody: string;
  signature: string | null;
}) {
  if (!stripe) throw new Error("Stripe not configured");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  if (!args.signature) throw new Error("Missing signature");
  return stripe.webhooks.constructEvent(args.rawBody, args.signature, secret);
}

export async function chargeStake(args: {
  customerId: string;
  paymentMethod: string;
  amountPence: number;
  description: string;
}) {
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.paymentIntents.create({
    amount: args.amountPence,
    currency: "gbp",
    customer: args.customerId,
    payment_method: args.paymentMethod,
    off_session: true,
    confirm: true,
    description: args.description,
  });
}
