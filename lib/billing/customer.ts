import type Stripe from "stripe";
import { prisma } from "@/lib/db/client";

/**
 * Returns the workspace's Stripe customer id, creating the customer on first
 * use. The id is saved before Checkout so every webhook can be matched back
 * to the workspace by customer, and so concurrent clicks share one customer.
 */
export async function ensureStripeCustomer(
  stripe: Pick<Stripe, "customers">,
  workspace: { id: string; name: string; stripeCustomerId: string | null },
  email: string | null
): Promise<string> {
  if (workspace.stripeCustomerId) return workspace.stripeCustomerId;

  const customer = await stripe.customers.create(
    {
      name: workspace.name,
      ...(email ? { email } : {}),
      metadata: { workspaceId: workspace.id },
    },
    { idempotencyKey: `anychat-customer-${workspace.id}` }
  );

  const saved = await prisma.workspace.updateMany({
    where: { id: workspace.id, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });
  if (saved.count > 0) return customer.id;

  const current = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    select: { stripeCustomerId: true },
  });
  return current?.stripeCustomerId ?? customer.id;
}
