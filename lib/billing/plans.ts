import type { Plan, SubscriptionStatus } from "@/app/generated/prisma/client";

/**
 * The single billing switch. Hosted AnyChat sets STRIPE_SECRET_KEY; a
 * self-hosted instance leaves it unset, which makes every workspace unlimited
 * and hides all billing UI. Everything billing-related must go through this.
 */
export function isBillingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** `null` means unlimited. */
export interface PlanLimits {
  maxInstagramAccounts: number | null;
  maxDMsPerMonth: number | null;
}

export interface PlanDefinition {
  id: Plan;
  name: string;
  limits: Required<{ [K in keyof PlanLimits]: number }>;
  /** Env var holding the Stripe Price id. Free has no price. */
  priceIdEnv: "STRIPE_PRICE_PRO" | "STRIPE_PRICE_AGENCY" | null;
}

// Fixed price per plan, never per contact (PRD principle "preço previsível").
// Prices themselves live in Stripe; only limits are defined in code.
export const PLANS: Record<Plan, PlanDefinition> = {
  FREE: {
    id: "FREE",
    name: "Grátis",
    limits: { maxInstagramAccounts: 1, maxDMsPerMonth: 300 },
    priceIdEnv: null,
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    limits: { maxInstagramAccounts: 3, maxDMsPerMonth: 10_000 },
    priceIdEnv: "STRIPE_PRICE_PRO",
  },
  AGENCY: {
    id: "AGENCY",
    name: "Agência",
    limits: { maxInstagramAccounts: 15, maxDMsPerMonth: 50_000 },
    priceIdEnv: "STRIPE_PRICE_AGENCY",
  },
};

export const PLAN_ORDER: Plan[] = ["FREE", "PRO", "AGENCY"];
export const PAID_PLANS = ["PRO", "AGENCY"] as const;
export type PaidPlan = (typeof PAID_PLANS)[number];

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === "PRO" || value === "AGENCY";
}

/**
 * Display price labels. Read from NEXT_PUBLIC_* env so marketing copy never
 * hardcodes a price; written out literally so Next can inline them.
 */
export function getPlanPriceLabel(plan: Plan): string | null {
  if (plan === "PRO") return process.env.NEXT_PUBLIC_PRICE_PRO_LABEL || null;
  if (plan === "AGENCY") return process.env.NEXT_PUBLIC_PRICE_AGENCY_LABEL || null;
  return null;
}

export function getStripePriceId(plan: Plan): string | null {
  const envName = PLANS[plan].priceIdEnv;
  return envName ? process.env[envName] || null : null;
}

export function getPlanForPriceId(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  for (const plan of PAID_PLANS) {
    if (getStripePriceId(plan) === priceId) return plan;
  }
  return null;
}

/** Statuses that grant the paid plan's limits. Everything else is Grátis. */
export function hasPaidAccess(status: SubscriptionStatus): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

/** The subscription still exists in Stripe (not ended, not never-started). */
export function hasLiveSubscription(status: SubscriptionStatus): boolean {
  return status !== "NONE" && status !== "CANCELED";
}

export interface ResolvedPlan {
  billingEnabled: boolean;
  /** Plan stored on the workspace (what the customer subscribed to). */
  plan: Plan;
  /** Plan whose limits actually apply right now. */
  effectivePlan: Plan;
  subscriptionStatus: SubscriptionStatus;
  limits: PlanLimits;
}

export const UNLIMITED: PlanLimits = {
  maxInstagramAccounts: null,
  maxDMsPerMonth: null,
};

export function resolveWorkspacePlan(
  workspace: { plan: Plan; subscriptionStatus: SubscriptionStatus },
  billingEnabled = isBillingEnabled()
): ResolvedPlan {
  if (!billingEnabled) {
    return {
      billingEnabled: false,
      plan: workspace.plan,
      effectivePlan: workspace.plan,
      subscriptionStatus: workspace.subscriptionStatus,
      limits: UNLIMITED,
    };
  }

  // Past-due, unpaid, canceled, paused or incomplete subscriptions fall back
  // to Grátis limits until Stripe reports the subscription active again.
  const effectivePlan =
    workspace.plan !== "FREE" && hasPaidAccess(workspace.subscriptionStatus)
      ? workspace.plan
      : "FREE";

  return {
    billingEnabled: true,
    plan: workspace.plan,
    effectivePlan,
    subscriptionStatus: workspace.subscriptionStatus,
    limits: { ...PLANS[effectivePlan].limits },
  };
}
