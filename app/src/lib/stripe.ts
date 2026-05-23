import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;

export const stripeConfigured = () => stripe !== null;

export async function createCustomerAndSetupIntent(email: string) {
  if (!stripe) throw new Error("Stripe not configured");
  const customer = await stripe.customers.create({ email });
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ["card"],
    usage: "off_session",
  });
  return { customerId: customer.id, clientSecret: setupIntent.client_secret! };
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
