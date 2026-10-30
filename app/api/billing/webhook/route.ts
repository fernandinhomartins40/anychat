import { NextResponse } from "next/server";
import { isBillingEnabled } from "@/lib/billing/plans";
import { getStripe } from "@/lib/billing/stripe";
import { processStripeWebhook } from "@/lib/billing/webhook";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isBillingEnabled()) {
    return NextResponse.json({ error: "Billing is disabled" }, { status: 404 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Billing] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Signature verification needs the exact bytes Stripe sent.
  const rawBody = await request.text();

  try {
    const result = await processStripeWebhook({
      stripe: getStripe(),
      rawBody,
      signature: request.headers.get("stripe-signature"),
      secret,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("[Billing] Webhook handling failed:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
