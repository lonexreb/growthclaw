const STRIPE_KEY = process.env.STRIPE_API_KEY;

const isConfigured = Boolean(STRIPE_KEY);

interface ConversionResult {
  converted: boolean;
  plan: string;
  mrr: number;
  converted_at: string;
}

export async function checkConversion(
  email: string
): Promise<ConversionResult | null> {
  if (!isConfigured) return null;

  try {
    // Search Stripe for customers matching email
    const res = await fetch(
      `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'`,
      {
        headers: { Authorization: `Bearer ${STRIPE_KEY}` },
      }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    const customer = data.data[0];

    // Check for active subscriptions
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active`,
      {
        headers: { Authorization: `Bearer ${STRIPE_KEY}` },
      }
    );
    if (!subRes.ok) return null;

    const subData = await subRes.json();
    if (!subData.data || subData.data.length === 0) return null;

    const sub = subData.data[0];
    const planAmount = sub.items?.data?.[0]?.price?.unit_amount ?? 0;
    const planName = sub.items?.data?.[0]?.price?.nickname || "core";

    return {
      converted: true,
      plan: planName.toLowerCase(),
      mrr: planAmount / 100,
      converted_at: new Date(sub.created * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export function isStripeConfigured(): boolean {
  return isConfigured;
}
