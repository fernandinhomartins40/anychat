import {
  getPlanPriceLabel,
  getStripePriceId,
  isBillingEnabled,
  PAID_PLANS,
  type PaidPlan,
} from "@/lib/billing/plans";
import { getStripe } from "@/lib/billing/stripe";

const CACHE_MS = 60 * 60 * 1000;
let cache: { at: number; labels: Record<PaidPlan, string | null> } | null = null;

const INTERVAL_SUFFIX: Record<string, string> = {
  day: "/dia",
  week: "/semana",
  month: "/mês",
  year: "/ano",
};

async function priceLabelFromStripe(plan: PaidPlan): Promise<string | null> {
  const priceId = getStripePriceId(plan);
  if (!priceId) return null;
  try {
    const price = await getStripe().prices.retrieve(priceId);
    if (price.unit_amount === null) return null;
    const amount = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: price.currency.toUpperCase(),
    }).format(price.unit_amount / 100);
    const suffix = price.recurring
      ? INTERVAL_SUFFIX[price.recurring.interval] ?? ""
      : "";
    return `${amount}${suffix}`;
  } catch (error) {
    console.warn("[Billing] Could not load Stripe price", plan, error);
    return null;
  }
}

/**
 * Display prices for the paid plans: the NEXT_PUBLIC_PRICE_*_LABEL env var
 * when set, otherwise the amount of the configured Stripe Price, otherwise
 * null (the UI then shows a neutral placeholder). Never hardcoded.
 */
export async function getPlanPriceLabels(): Promise<Record<PaidPlan, string | null>> {
  const fromEnv: Record<PaidPlan, string | null> = {
    PRO: getPlanPriceLabel("PRO"),
    AGENCY: getPlanPriceLabel("AGENCY"),
  };

  if (!isBillingEnabled() || PAID_PLANS.every((plan) => fromEnv[plan])) {
    return fromEnv;
  }
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.labels;

  const labels = { ...fromEnv };
  for (const plan of PAID_PLANS) {
    labels[plan] ??= await priceLabelFromStripe(plan);
  }
  cache = { at: Date.now(), labels };
  return labels;
}
