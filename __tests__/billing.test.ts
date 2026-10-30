import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockTx } = vi.hoisted(() => {
  const tx = {
    workspace: { findUnique: vi.fn(), updateMany: vi.fn() },
  };
  return {
    mockTx: tx,
    mockPrisma: {
      $transaction: vi.fn((callback: (txArg: typeof tx) => unknown) => callback(tx)),
      workspace: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
      instagramAccount: { findUnique: vi.fn(), count: vi.fn() },
      billingEvent: { findUnique: vi.fn(), create: vi.fn() },
    },
  };
});

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }));

import { Prisma } from "@/app/generated/prisma/client";
import {
  getPlanForPriceId,
  isBillingEnabled,
  resolveWorkspacePlan,
} from "../lib/billing/plans";
import { reserveWorkspaceDMSend } from "../lib/billing/usage";
import { canConnectInstagramAccount } from "../lib/instagram-accounts";
import {
  mapStripeStatus,
  processStripeWebhook,
  type StripeWebhookClient,
} from "../lib/billing/webhook";

function enableBilling() {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
  vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
  vi.stubEnv("STRIPE_PRICE_AGENCY", "price_agency");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("STRIPE_SECRET_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("plan resolution", () => {
  it("treats every workspace as unlimited when billing is disabled", () => {
    expect(isBillingEnabled()).toBe(false);
    const resolved = resolveWorkspacePlan({ plan: "FREE", subscriptionStatus: "NONE" });
    expect(resolved).toMatchObject({
      billingEnabled: false,
      limits: { maxInstagramAccounts: null, maxDMsPerMonth: null },
    });
  });

  it("applies Grátis limits to a free workspace", () => {
    enableBilling();
    expect(resolveWorkspacePlan({ plan: "FREE", subscriptionStatus: "NONE" })).toMatchObject({
      effectivePlan: "FREE",
      limits: { maxInstagramAccounts: 1, maxDMsPerMonth: 300 },
    });
  });

  it("grants paid limits to active and trialing subscriptions", () => {
    enableBilling();
    expect(resolveWorkspacePlan({ plan: "PRO", subscriptionStatus: "ACTIVE" }).limits).toEqual({
      maxInstagramAccounts: 3,
      maxDMsPerMonth: 10_000,
    });
    expect(
      resolveWorkspacePlan({ plan: "AGENCY", subscriptionStatus: "TRIALING" }).effectivePlan
    ).toBe("AGENCY");
  });

  it.each(["PAST_DUE", "UNPAID", "CANCELED", "PAUSED", "INCOMPLETE", "NONE"] as const)(
    "falls back to Grátis when a paid plan is %s",
    (subscriptionStatus) => {
      enableBilling();
      const resolved = resolveWorkspacePlan({ plan: "AGENCY", subscriptionStatus });
      expect(resolved.plan).toBe("AGENCY");
      expect(resolved.effectivePlan).toBe("FREE");
      expect(resolved.limits.maxDMsPerMonth).toBe(300);
    }
  );

  it("maps configured Stripe price ids to plans", () => {
    enableBilling();
    expect(getPlanForPriceId("price_pro")).toBe("PRO");
    expect(getPlanForPriceId("price_agency")).toBe("AGENCY");
    expect(getPlanForPriceId("price_other")).toBeNull();
    expect(getPlanForPriceId(null)).toBeNull();
  });

  it("maps Stripe subscription statuses", () => {
    expect(mapStripeStatus("active")).toBe("ACTIVE");
    expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
    expect(mapStripeStatus("incomplete_expired")).toBe("CANCELED");
  });
});

describe("monthly DM cap", () => {
  const periodStart = new Date(2026, 4, 1);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 24, 12));
  });

  function workspaceWith(plan: string, subscriptionStatus: string, dmsSentThisPeriod: number) {
    mockTx.workspace.findUnique.mockResolvedValueOnce({
      plan,
      subscriptionStatus,
      usagePeriodStart: periodStart,
      dmsSentThisPeriod,
    });
  }

  it("blocks a free workspace at its monthly cap", async () => {
    enableBilling();
    mockTx.workspace.updateMany.mockResolvedValueOnce({ count: 0 });
    workspaceWith("FREE", "NONE", 300);

    const result = await reserveWorkspaceDMSend("ws");

    expect(result).toMatchObject({ allowed: false, reserved: false, limit: 300 });
    expect(mockTx.workspace.updateMany).toHaveBeenCalledTimes(1);
  });

  it("reserves against the paid plan's cap with a guarded increment", async () => {
    enableBilling();
    mockTx.workspace.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    workspaceWith("PRO", "ACTIVE", 300);

    const result = await reserveWorkspaceDMSend("ws");

    expect(result).toMatchObject({ allowed: true, limit: 10_000, remaining: 9_699 });
    expect(mockTx.workspace.updateMany).toHaveBeenLastCalledWith({
      where: {
        id: "ws",
        usagePeriodStart: { gte: periodStart },
        dmsSentThisPeriod: { lt: 10_000 },
      },
      data: { dmsSentThisPeriod: { increment: 1 } },
    });
  });

  it("uses Grátis limits for a past-due paid workspace", async () => {
    enableBilling();
    mockTx.workspace.updateMany.mockResolvedValueOnce({ count: 0 });
    workspaceWith("PRO", "PAST_DUE", 300);

    await expect(reserveWorkspaceDMSend("ws")).resolves.toMatchObject({
      allowed: false,
      limit: 300,
    });
  });

  it("does not cap when billing is disabled", async () => {
    mockTx.workspace.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    workspaceWith("FREE", "NONE", 5_000);

    await expect(reserveWorkspaceDMSend("ws")).resolves.toMatchObject({
      allowed: true,
      limit: 2_000_000_000,
    });
  });
});

describe("Instagram account cap", () => {
  it("blocks a new account beyond the plan limit", async () => {
    enableBilling();
    mockPrisma.instagramAccount.findUnique.mockResolvedValue(null);
    mockPrisma.workspace.findUnique.mockResolvedValue({ plan: "FREE", subscriptionStatus: "NONE" });
    mockPrisma.instagramAccount.count.mockResolvedValue(1);

    await expect(
      canConnectInstagramAccount({ workspaceId: "ws", instagramId: "ig_new" })
    ).resolves.toEqual({ allowed: false, reason: "plan_limit", limit: 1 });
    expect(mockPrisma.instagramAccount.count).toHaveBeenCalledWith({
      where: { workspaceId: "ws", instagramId: { not: "ig_new" } },
    });
  });

  it("allows reconnecting an account the workspace already has", async () => {
    enableBilling();
    mockPrisma.instagramAccount.findUnique.mockResolvedValue({ workspaceId: "ws", provider: "META" });
    mockPrisma.workspace.findUnique.mockResolvedValue({ plan: "FREE", subscriptionStatus: "NONE" });
    // The account being reconnected is excluded from the count.
    mockPrisma.instagramAccount.count.mockResolvedValue(0);

    await expect(
      canConnectInstagramAccount({ workspaceId: "ws", instagramId: "ig_existing" })
    ).resolves.toEqual({ allowed: true, reason: null });
  });

  it("allows more accounts on an active paid plan", async () => {
    enableBilling();
    mockPrisma.instagramAccount.findUnique.mockResolvedValue(null);
    mockPrisma.workspace.findUnique.mockResolvedValue({ plan: "PRO", subscriptionStatus: "ACTIVE" });
    mockPrisma.instagramAccount.count.mockResolvedValue(2);

    await expect(
      canConnectInstagramAccount({ workspaceId: "ws", instagramId: "ig_new" })
    ).resolves.toEqual({ allowed: true, reason: null });
  });

  it("never queries plan data when billing is disabled", async () => {
    mockPrisma.instagramAccount.findUnique.mockResolvedValue(null);

    await expect(
      canConnectInstagramAccount({ workspaceId: "ws", instagramId: "ig_new" })
    ).resolves.toEqual({ allowed: true, reason: null });
    expect(mockPrisma.workspace.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.instagramAccount.count).not.toHaveBeenCalled();
  });
});

describe("Stripe webhook", () => {
  const secret = "whsec_test_secret";
  // Real signature verification from the stripe package; only API calls are mocked.
  const realWebhooks = new Stripe("sk_test_123").webhooks;
  const retrieve = vi.fn();
  const stripe = {
    webhooks: realWebhooks,
    subscriptions: { retrieve },
  } as unknown as StripeWebhookClient;

  function subscription(overrides: Record<string, unknown> = {}) {
    return {
      id: "sub_1",
      object: "subscription",
      customer: "cus_1",
      status: "active",
      metadata: { workspaceId: "ws" },
      items: {
        data: [{ price: { id: "price_pro" }, current_period_end: 1_800_000_000 }],
      },
      ...overrides,
    };
  }

  function signed(event: Record<string, unknown>) {
    const rawBody = JSON.stringify(event);
    const signature = realWebhooks.generateTestHeaderString({ payload: rawBody, secret });
    return { rawBody, signature };
  }

  const checkoutEvent = {
    id: "evt_checkout",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_1",
        object: "checkout.session",
        mode: "subscription",
        client_reference_id: "ws",
        customer: "cus_1",
        subscription: "sub_1",
        metadata: { workspaceId: "ws" },
      },
    },
  };

  beforeEach(() => {
    enableBilling();
    mockPrisma.billingEvent.findUnique.mockResolvedValue(null);
    mockPrisma.billingEvent.create.mockResolvedValue({});
    mockPrisma.workspace.update.mockResolvedValue({});
  });

  it("rejects a missing or invalid signature", async () => {
    const { rawBody } = signed(checkoutEvent);

    await expect(
      processStripeWebhook({ stripe, rawBody, signature: null, secret })
    ).resolves.toMatchObject({ status: 400 });
    await expect(
      processStripeWebhook({ stripe, rawBody, signature: "t=1,v1=bad", secret })
    ).resolves.toMatchObject({ status: 400 });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("rejects a body that was modified after signing", async () => {
    const { signature } = signed(checkoutEvent);
    const tampered = JSON.stringify({ ...checkoutEvent, id: "evt_other" });

    await expect(
      processStripeWebhook({ stripe, rawBody: tampered, signature, secret })
    ).resolves.toMatchObject({ status: 400 });
  });

  it("activates the plan on checkout.session.completed", async () => {
    retrieve.mockResolvedValue(subscription());
    mockPrisma.workspace.findUnique
      .mockResolvedValueOnce(null) // by subscription id
      .mockResolvedValueOnce({ id: "ws", stripeCustomerId: "cus_1", stripeSubscriptionId: null });

    const result = await processStripeWebhook({ stripe, ...signed(checkoutEvent), secret });

    expect(result).toEqual({ status: 200, body: { received: true } });
    expect(retrieve).toHaveBeenCalledWith("sub_1");
    expect(mockPrisma.workspace.update).toHaveBeenCalledWith({
      where: { id: "ws" },
      data: {
        plan: "PRO",
        subscriptionStatus: "ACTIVE",
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        stripePriceId: "price_pro",
        currentPeriodEnd: new Date(1_800_000_000 * 1000),
      },
    });
    expect(mockPrisma.billingEvent.create).toHaveBeenCalledWith({
      data: { stripeEventId: "evt_checkout", type: "checkout.session.completed", workspaceId: "ws" },
    });
  });

  it("acknowledges a replayed event without applying it again", async () => {
    mockPrisma.billingEvent.findUnique.mockResolvedValue({ id: "be_1" });

    const result = await processStripeWebhook({ stripe, ...signed(checkoutEvent), secret });

    expect(result).toEqual({ status: 200, body: { received: true, duplicate: true } });
    expect(retrieve).not.toHaveBeenCalled();
    expect(mockPrisma.workspace.update).not.toHaveBeenCalled();
  });

  it("tolerates a concurrent duplicate delivery", async () => {
    retrieve.mockResolvedValue(subscription());
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({
      id: "ws",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
    });
    mockPrisma.billingEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    await expect(
      processStripeWebhook({ stripe, ...signed(checkoutEvent), secret })
    ).resolves.toMatchObject({ status: 200 });
  });

  it("records a past-due update from the latest subscription state", async () => {
    retrieve.mockResolvedValue(subscription({ status: "past_due" }));
    mockPrisma.workspace.findUnique.mockResolvedValueOnce({
      id: "ws",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
    });
    const event = {
      id: "evt_updated",
      object: "event",
      type: "customer.subscription.updated",
      // Stale payload: the handler must trust the re-fetched subscription.
      data: { object: subscription({ status: "active" }) },
    };

    await processStripeWebhook({ stripe, ...signed(event), secret });

    expect(mockPrisma.workspace.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: "PRO", subscriptionStatus: "PAST_DUE" }),
      })
    );
  });

  it("ignores the deletion of an old subscription replaced by a newer one", async () => {
    retrieve.mockResolvedValue(subscription({ id: "sub_old", status: "canceled" }));
    mockPrisma.workspace.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "ws", stripeCustomerId: "cus_1", stripeSubscriptionId: "sub_new" });
    const event = {
      id: "evt_deleted",
      object: "event",
      type: "customer.subscription.deleted",
      data: { object: subscription({ id: "sub_old", status: "canceled" }) },
    };

    const result = await processStripeWebhook({ stripe, ...signed(event), secret });

    expect(result.status).toBe(200);
    expect(mockPrisma.workspace.update).not.toHaveBeenCalled();
  });

  it("does not record the event when applying it fails, so Stripe retries", async () => {
    retrieve.mockRejectedValue(new Error("Stripe unavailable"));

    await expect(
      processStripeWebhook({ stripe, ...signed(checkoutEvent), secret })
    ).rejects.toThrow("Stripe unavailable");
    expect(mockPrisma.billingEvent.create).not.toHaveBeenCalled();
  });

  it("ignores unrelated event types", async () => {
    const event = { id: "evt_x", object: "event", type: "invoice.paid", data: { object: {} } };

    await expect(
      processStripeWebhook({ stripe, ...signed(event), secret })
    ).resolves.toEqual({ status: 200, body: { received: true } });
    expect(retrieve).not.toHaveBeenCalled();
  });
});
