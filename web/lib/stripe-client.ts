const STRIPE_KEY = process.env.STRIPE_API_KEY;

interface ConversionResult {
  converted: boolean;
  plan: string;
  mrr: number;
  converted_at: string;
}

function requireConfig(): void {
  if (!STRIPE_KEY) {
    throw new Error(
      "Stripe not configured. Set STRIPE_API_KEY in .env.local"
    );
  }
}

export async function checkConversion(
  email: string
): Promise<ConversionResult | null> {
  requireConfig();

  const res = await fetch(
    `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'`,
    { headers: { Authorization: `Bearer ${STRIPE_KEY}` } }
  );
  if (!res.ok) {
    throw new Error(`Stripe search failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.data || data.data.length === 0) return null;

  const customer = data.data[0];

  const subRes = await fetch(
    `https://api.stripe.com/v1/subscriptions?customer=${customer.id}&status=active`,
    { headers: { Authorization: `Bearer ${STRIPE_KEY}` } }
  );
  if (!subRes.ok) {
    throw new Error(`Stripe subscriptions failed: ${subRes.status}`);
  }

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
}
