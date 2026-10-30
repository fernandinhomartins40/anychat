import { NextResponse } from "next/server";
import { requireBillingOwner } from "@/lib/billing/route-guard";
import { getStripe } from "@/lib/billing/stripe";
import { getBaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireBillingOwner(request);
  if ("response" in guard) return guard.response;
  const customerId = guard.context.workspace.stripeCustomerId;

  if (!customerId) {
    return NextResponse.json(
      { success: false, error: "No billing account yet. Choose a plan first." },
      { status: 400 }
    );
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getBaseUrl()}/settings#billing`,
      locale: "pt-BR",
    });
    return NextResponse.json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error("[Billing] Portal session failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not open the billing portal. Please try again." },
      { status: 502 }
    );
  }
}
