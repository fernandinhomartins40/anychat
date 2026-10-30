import type Stripe from "stripe";
import { Prisma, type SubscriptionStatus } from "@/app/generated/prisma/client";
import { getPlanForPriceId, hasPaidAccess } from "@/lib/billing/plans";
import { prisma } from "@/lib/db/client";

/** The subset of the Stripe client the webhook needs; mocked in tests. */
export type StripeWebhookClient = {
  webhooks: Pick<Stripe["webhooks"], "constructEvent">;
  subscriptions: Pick<Stripe["subscriptions"], "retrieve">;
};

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "unpaid":
      return "UNPAID";
    case "paused":
      return "PAUSED";
    case "incomplete":
      return "INCOMPLETE";
    case "canceled":
    case "incomplete_expired":
    default:
      return "CANCELED";
  }
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
  // Since API 2025-03-31 the period lives on each item, not the subscription.
  const itemEnd = subscription.items?.data?.[0]?.current_period_end;
  const legacyEnd = (subscription as unknown as { current_period_end?: number })
    .current_period_end;
  const seconds = itemEnd ?? legacyEnd;
  return seconds ? new Date(seconds * 1000) : null;
}

async function findWorkspaceForSubscription(
  subscription: Stripe.Subscription,
  customerId: string | null,
  hintWorkspaceId: string | null
) {
  const select = { id: true, stripeCustomerId: true, stripeSubscriptionId: true } as const;

  const bySubscription = await prisma.workspace.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    select,
  });
  if (bySubscription) return bySubscription;

  if (customerId) {
    const byCustomer = await prisma.workspace.findUnique({
      where: { stripeCustomerId: customerId },
      select,
    });
    if (byCustomer) return byCustomer;
  }

  const workspaceId = hintWorkspaceId ?? subscription.metadata?.workspaceId ?? null;
  if (!workspaceId) return null;
  const byId = await prisma.workspace.findUnique({ where: { id: workspaceId }, select });
  // Never let metadata attach a subscription to a workspace that already
  // belongs to a different Stripe customer.
  if (byId && byId.stripeCustomerId && byId.stripeCustomerId !== customerId) return null;
  return byId;
}

/**
 * Copies the subscription's current state onto its workspace. The subscription
 * is re-fetched from Stripe so out-of-order or replayed events can never roll
 * the workspace back to an older state.
 */
export async function syncSubscription(
  stripe: StripeWebhookClient,
  subscriptionId: string,
  hintWorkspaceId: string | null = null
): Promise<string | null> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = idOf(subscription.customer);
  const workspace = await findWorkspaceForSubscription(
    subscription,
    customerId,
    hintWorkspaceId
  );

  if (!workspace) {
    console.warn("[Billing] No workspace for Stripe subscription", subscription.id);
    return null;
  }

  const subscriptionStatus = mapStripeStatus(subscription.status);

  // A stale, ended subscription must not override the workspace's newer one.
  if (
    workspace.stripeSubscriptionId &&
    workspace.stripeSubscriptionId !== subscription.id &&
    !hasPaidAccess(subscriptionStatus)
  ) {
    return workspace.id;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const plan = getPlanForPriceId(priceId);
  if (!plan) {
    console.warn(
      "[Billing] Subscription price does not match STRIPE_PRICE_PRO or STRIPE_PRICE_AGENCY; treating as Grátis",
      { subscriptionId: subscription.id, priceId }
    );
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      plan: plan ?? "FREE",
      subscriptionStatus,
      stripeCustomerId: customerId ?? workspace.stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      currentPeriodEnd: getPeriodEnd(subscription),
    },
  });

  return workspace.id;
}

export async function handleStripeEvent(
  stripe: StripeWebhookClient,
  event: Stripe.Event
): Promise<string | null> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription") return null;
      const subscriptionId = idOf(session.subscription);
      if (!subscriptionId) return null;
      const workspaceId =
        session.client_reference_id ?? session.metadata?.workspaceId ?? null;
      return syncSubscription(stripe, subscriptionId, workspaceId);
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return syncSubscription(stripe, event.data.object.id);
    default:
      return null;
  }
}

export type WebhookResult = { status: number; body: Record<string, unknown> };

export async function processStripeWebhook({
  stripe,
  rawBody,
  signature,
  secret,
}: {
  stripe: StripeWebhookClient;
  rawBody: string;
  signature: string | null;
  secret: string;
}): Promise<WebhookResult> {
  if (!signature) {
    return { status: 400, body: { error: "Missing Stripe-Signature header" } };
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return { status: 400, body: { error: "Invalid Stripe signature" } };
  }

  const seen = await prisma.billingEvent.findUnique({
    where: { stripeEventId: event.id },
    select: { id: true },
  });
  if (seen) return { status: 200, body: { received: true, duplicate: true } };

  // Throwing here returns 500 and Stripe retries; the event is only recorded
  // once it has been applied.
  const workspaceId = await handleStripeEvent(stripe, event);

  try {
    await prisma.billingEvent.create({
      data: { stripeEventId: event.id, type: event.type, workspaceId },
    });
  } catch (error) {
    // A concurrent delivery of the same event already recorded it.
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    ) {
      throw error;
    }
  }

  return { status: 200, body: { received: true } };
}
