import Stripe from "stripe";
import { isBillingEnabled } from "@/lib/billing/plans";

let stripeClient: Stripe | null = null;

/**
 * Lazily built Stripe client. Only call this after isBillingEnabled() — on a
 * self-hosted instance there is no key and billing routes return 404 first.
 * The API version is the one pinned by the installed `stripe` package.
 */
export function getStripe(): Stripe {
  if (!isBillingEnabled()) {
    throw new Error("Billing is disabled: STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      typescript: true,
      appInfo: { name: "AnyChat" },
    });
  }
  return stripeClient;
}
