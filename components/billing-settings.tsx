"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/provider";
import type { StaticMessageKey } from "@/lib/i18n";

type PlanId = "FREE" | "PRO" | "AGENCY";
type Limits = { maxInstagramAccounts: number | null; maxDMsPerMonth: number | null };

interface BillingData {
  enabled: boolean;
  plan: PlanId;
  effectivePlan: PlanId;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
  canManageBilling: boolean;
  limits: Limits;
  usage: { dmsThisPeriod: number; instagramAccounts: number };
  plans: Array<{
    id: PlanId;
    limits: Limits;
    priceLabel: string | null;
    purchasable: boolean;
  }>;
}

const PLAN_NAMES: Record<PlanId, StaticMessageKey> = {
  FREE: "Free",
  PRO: "Pro",
  AGENCY: "Agency",
};

const PLAN_RANK: Record<PlanId, number> = { FREE: 0, PRO: 1, AGENCY: 2 };

const STATUS_WARNINGS: Record<string, StaticMessageKey> = {
  PAST_DUE: "Payment overdue. Free plan limits apply until the payment goes through.",
  UNPAID: "Payment overdue. Free plan limits apply until the payment goes through.",
  INCOMPLETE: "Payment not completed. Free plan limits apply until the payment goes through.",
  PAUSED: "Subscription paused. Free plan limits apply.",
  CANCELED: "Subscription canceled. Free plan limits apply.",
};

function UsageRow({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const { t, locale } = useI18n();
  const format = (value: number) => value.toLocaleString(locale);
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const full = limit !== null && used >= limit;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className={`text-sm font-semibold ${full ? "text-error" : "text-foreground"}`}>
          {limit === null
            ? format(used)
            : t("{used} of {limit}", { used: format(used), limit: format(limit) })}
        </span>
      </div>
      {limit !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full rounded-full ${full ? "bg-error" : percent >= 80 ? "bg-warning" : "bg-accent"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function BillingSettings() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get("billing");
  const [data, setData] = useState<BillingData | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/billing", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success) setData(payload.data);
      })
      .catch(() => setError(t("Could not load billing details.")));
  }, [t]);

  async function redirectTo(path: string, body?: unknown, key = path) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const payload = await res.json();
      if (!payload.success || !payload.data?.url) throw new Error(payload.error);
      window.location.assign(payload.data.url);
    } catch {
      setError(t("Could not reach the billing provider. Please try again."));
      setBusy(null);
    }
  }

  if (!data) return null;

  if (!data.enabled) {
    return (
      <section id="billing" className="panel rounded p-4 sm:p-6">
        <h2 className="text-base font-semibold mb-6">{t("Usage")}</h2>
        <div className="flex items-center justify-between gap-3 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t("DMs sent this month")}</p>
            <p className="text-xs text-muted mt-0.5">{t("Self-hosted — no plan limits.")}</p>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {data.usage.dmsThisPeriod.toLocaleString(locale)}
          </span>
        </div>
      </section>
    );
  }

  const warning = data.plan !== "FREE" ? STATUS_WARNINGS[data.subscriptionStatus] : undefined;
  const renews =
    data.currentPeriodEnd &&
    (data.subscriptionStatus === "ACTIVE" || data.subscriptionStatus === "TRIALING")
      ? new Date(data.currentPeriodEnd).toLocaleDateString(locale)
      : null;

  return (
    <section id="billing" className="panel rounded p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t("Plan & billing")}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("Current plan: {plan}", { plan: t(PLAN_NAMES[data.effectivePlan]) })}
            {renews ? ` · ${t("Renews on {date}", { date: renews })}` : ""}
          </p>
        </div>
        {data.canManageBilling && data.hasCustomer && (
          <button
            type="button"
            onClick={() => void redirectTo("/api/billing/portal", undefined, "portal")}
            disabled={busy !== null}
            className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-hover disabled:opacity-50"
          >
            {busy === "portal" ? t("Opening...") : t("Manage billing")}
          </button>
        )}
      </div>

      {checkoutResult === "success" && (
        <p className="rounded border border-success/20 bg-success/10 p-3 text-sm text-success">
          {t("Payment received. Your plan updates in a few seconds; refresh if it has not changed yet.")}
        </p>
      )}
      {checkoutResult === "canceled" && (
        <p className="rounded border border-border p-3 text-sm text-muted">
          {t("Checkout canceled. Nothing was charged.")}
        </p>
      )}
      {warning && (
        <p className="rounded border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
          {t(warning)}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded border border-error/20 bg-error/10 p-3 text-sm text-error">
          {error}
        </p>
      )}

      <div className="divide-y divide-border">
        <UsageRow
          label={t("DMs sent this month")}
          used={data.usage.dmsThisPeriod}
          limit={data.limits.maxDMsPerMonth}
        />
        <UsageRow
          label={t("Instagram accounts")}
          used={data.usage.instagramAccounts}
          limit={data.limits.maxInstagramAccounts}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {data.plans.map((plan) => {
          const current = plan.id === data.effectivePlan;
          const upgrade = PLAN_RANK[plan.id] > PLAN_RANK[data.effectivePlan];
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded border p-4 ${current ? "border-accent" : "border-border"}`}
            >
              <p className="text-sm font-semibold text-foreground">{t(PLAN_NAMES[plan.id])}</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {plan.id === "FREE" ? t("Free of charge") : plan.priceLabel ?? t("See pricing")}
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-xs text-muted">
                <li>
                  {t("{count} Instagram account(s)", {
                    count: plan.limits.maxInstagramAccounts ?? "∞",
                  })}
                </li>
                <li>
                  {t("{count} DMs per month", {
                    count: plan.limits.maxDMsPerMonth?.toLocaleString(locale) ?? "∞",
                  })}
                </li>
              </ul>
              {current ? (
                <span className="mt-4 text-center text-xs font-semibold text-accent">
                  {t("Current plan")}
                </span>
              ) : data.canManageBilling && plan.purchasable ? (
                <button
                  type="button"
                  onClick={() => void redirectTo("/api/billing/checkout", { plan: plan.id }, plan.id)}
                  disabled={busy !== null}
                  className="mt-4 rounded bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {busy === plan.id ? t("Opening...") : upgrade ? t("Upgrade") : t("Switch plan")}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        {data.canManageBilling
          ? t("Fixed monthly price per plan, never per contact. Card payments via Stripe. To downgrade or cancel, use Manage billing.")
          : t("Only the workspace owner can change the plan.")}{" "}
        <a href="/pricing" className="underline underline-offset-4">
          {t("Compare plans")}
        </a>
      </p>
    </section>
  );
}
