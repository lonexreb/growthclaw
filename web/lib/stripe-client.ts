import Stripe from "stripe";

const STRIPE_KEY = process.env.STRIPE_API_KEY;

interface ConversionResult {
  converted: boolean;
  plan: string;
  mrr: number;
  converted_at: string;
}

function getClient(): Stripe {
  if (!STRIPE_KEY) {
    throw new Error(
      "Stripe not configured. Set STRIPE_API_KEY in .env.local"
    );
  }
  return new Stripe(STRIPE_KEY);
}

export async function checkConversion(
  email: string
): Promise<ConversionResult | null> {
  const stripe = getClient();

  const customers = await stripe.customers.search({
    query: `email:"${email}"`,
    limit: 1,
  });

  if (customers.data.length === 0) return null;

  const customer = customers.data[0];

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length === 0) return null;

  const sub = subscriptions.data[0];
  const item = sub.items.data[0];
  const planAmount = item?.price?.unit_amount ?? 0;
  const planName = item?.price?.nickname || "core";

  return {
    converted: true,
    plan: planName.toLowerCase(),
    mrr: planAmount / 100,
    converted_at: new Date(sub.created * 1000).toISOString(),
  };
}
