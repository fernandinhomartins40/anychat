import type { Plan, SubscriptionStatus } from "@/app/generated/prisma/client";
import {
  getStripePriceId,
  isBillingEnabled,
  PLAN_ORDER,
  PLANS,
  resolveWorkspacePlan,
  type PlanLimits,
} from "@/lib/billing/plans";
import { getPlanPriceLabels } from "@/lib/billing/prices";
import { getMonthStart } from "@/lib/billing/usage";
import { prisma } from "@/lib/db/client";

export interface BillingSummary {
  enabled: boolean;
  plan: Plan;
  effectivePlan: Plan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
  limits: PlanLimits;
  usage: {
    dmsThisPeriod: number;
    instagramAccounts: number;
    periodStart: string;
  };
  plans: Array<{
    id: Plan;
    name: string;
    limits: PlanLimits;
    priceLabel: string | null;
    purchasable: boolean;
  }>;
}

export async function getBillingSummary(workspaceId: string): Promise<BillingSummary | null> {
  const [workspace, instagramAccounts] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
        usagePeriodStart: true,
        dmsSentThisPeriod: true,
      },
    }),
    prisma.instagramAccount.count({ where: { workspaceId } }),
  ]);
  if (!workspace) return null;

  const enabled = isBillingEnabled();
  const resolved = resolveWorkspacePlan(workspace, enabled);
  const monthStart = getMonthStart();
  // The counter is reset lazily on the next send; report 0 for a new month.
  const dmsThisPeriod =
    workspace.usagePeriodStart < monthStart ? 0 : workspace.dmsSentThisPeriod;
  const priceLabels = enabled ? await getPlanPriceLabels() : null;

  return {
    enabled,
    plan: resolved.plan,
    effectivePlan: resolved.effectivePlan,
    subscriptionStatus: resolved.subscriptionStatus,
    currentPeriodEnd: workspace.currentPeriodEnd?.toISOString() ?? null,
    hasCustomer: Boolean(workspace.stripeCustomerId),
    limits: resolved.limits,
    usage: {
      dmsThisPeriod,
      instagramAccounts,
      periodStart: monthStart.toISOString(),
    },
    plans: enabled
      ? PLAN_ORDER.map((id) => ({
          id,
          name: PLANS[id].name,
          limits: { ...PLANS[id].limits },
          priceLabel: id === "FREE" ? null : priceLabels?.[id] ?? null,
          purchasable: id !== "FREE" && Boolean(getStripePriceId(id)),
        }))
      : [],
  };
}
