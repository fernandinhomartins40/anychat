import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureStripeCustomer } from "@/lib/billing/customer";
import { getStripePriceId, hasLiveSubscription, PAID_PLANS } from "@/lib/billing/plans";
import { requireBillingOwner } from "@/lib/billing/route-guard";
import { getStripe } from "@/lib/billing/stripe";
import { prisma } from "@/lib/db/client";
import { getBaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ plan: z.enum(PAID_PLANS) });

export async function POST(request: Request) {
  const guard = await requireBillingOwner(request);
  if ("response" in guard) return guard.response;
  const { context } = guard;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Choose a plan: PRO or AGENCY." }, { status: 400 });
  }
  const { plan } = parsed.data;

  const priceId = getStripePriceId(plan);
  if (!priceId) {
    return NextResponse.json(
      { success: false, error: "This plan is not configured on the server." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const workspace = context.workspace;
  const baseUrl = getBaseUrl();

  try {
    // A live subscription (active, or past due and still retrying) changes
    // plan or fixes its payment method in the Customer Portal rather than
    // starting a second subscription in Checkout.
    if (
      workspace.stripeCustomerId &&
      workspace.stripeSubscriptionId &&
      hasLiveSubscription(workspace.subscriptionStatus)
    ) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: workspace.stripeCustomerId,
        return_url: `${baseUrl}/settings#billing`,
        locale: "pt-BR",
      });
      return NextResponse.json({ success: true, data: { url: portal.url } });
    }

    const user = await prisma.user.findUnique({
      where: { id: context.userId },
      select: { email: true },
    });
    const customerId = await ensureStripeCustomer(stripe, workspace, user?.email ?? null);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: workspace.id,
      line_items: [{ price: priceId, quantity: 1 }],
      currency: "brl",
      // Pix does not support recurring subscriptions in Checkout; card only.
      allowed_payment_method_types: ["card"],
      locale: "pt-BR",
      allow_promotion_codes: true,
      metadata: { workspaceId: workspace.id, plan },
      subscription_data: { metadata: { workspaceId: workspace.id, plan } },
      success_url: `${baseUrl}/settings?billing=success#billing`,
      cancel_url: `${baseUrl}/settings?billing=canceled#billing`,
    });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL");
    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error("[Billing] Checkout failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not start checkout. Please try again." },
      { status: 502 }
    );
  }
}
