import { describe, expect, it } from "vitest";
import { createI18n } from "../lib/i18n";
import {
  computeConnectionChecklist,
  computeHealthIssues,
  type HealthAccount,
  type HealthCampaign,
  type HealthInput,
} from "../lib/health/issues";

const now = new Date("2026-10-30T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const { t } = createI18n("en");

function account(overrides: Partial<HealthAccount> = {}): HealthAccount {
  return {
    id: "acc_1",
    username: "studio",
    provider: "META",
    tokenExpiresAt: new Date(now.getTime() + 50 * DAY),
    webhookSubscribed: true,
    connectedAt: new Date(now.getTime() - 30 * DAY),
    lastWebhookAt: new Date(now.getTime() - HOUR),
    ...overrides,
  };
}

function campaign(overrides: Partial<HealthCampaign> = {}): HealthCampaign {
  return {
    id: "camp_1",
    name: "Ebook",
    instagramAccountId: "acc_1",
    stats: { sent: 10, failed: 0, rateLimited: 0, planLimited: 0 },
    topError: null,
    ...overrides,
  };
}

function input(overrides: Partial<HealthInput> = {}): HealthInput {
  return {
    accounts: [account()],
    campaigns: [campaign()],
    workerHealthy: true,
    threadOwnerErrors: 0,
    ...overrides,
  };
}

function issues(overrides: Partial<HealthInput> = {}) {
  return computeHealthIssues(input(overrides), { t, now });
}

function codes(overrides: Partial<HealthInput> = {}) {
  return issues(overrides).map((issue) => issue.code);
}

describe("computeHealthIssues", () => {
  it("reports nothing for a healthy workspace", () => {
    expect(issues()).toEqual([]);
  });

  it("flags an expired Meta token as critical with a link to Settings", () => {
    const [issue] = issues({
      accounts: [account({ tokenExpiresAt: new Date(now.getTime() - DAY) })],
    });
    expect(issue).toMatchObject({
      id: "token_expired:acc_1",
      code: "token_expired",
      severity: "critical",
      href: "/settings",
    });
    expect(issue.title).toContain("@studio");
    expect(issue.action).not.toBe("");
  });

  it("warns when a token expires within 7 days, with the day count", () => {
    const [issue] = issues({
      accounts: [
        account({ tokenExpiresAt: new Date(now.getTime() + 3 * DAY - HOUR) }),
      ],
    });
    expect(issue.code).toBe("token_expiring");
    expect(issue.severity).toBe("warning");
    expect(issue.title).toContain("3 days");
  });

  it("does not warn about a token expiring in more than 7 days", () => {
    expect(
      codes({
        accounts: [account({ tokenExpiresAt: new Date(now.getTime() + 8 * DAY) })],
      })
    ).toEqual([]);
  });

  it("skips token and webhook-subscription checks for Zernio accounts", () => {
    expect(
      codes({
        accounts: [
          account({
            provider: "ZERNIO",
            tokenExpiresAt: new Date(now.getTime() - DAY),
            webhookSubscribed: false,
          }),
        ],
      })
    ).toEqual([]);
  });

  it("flags a Meta account whose webhook is not subscribed", () => {
    expect(codes({ accounts: [account({ webhookSubscribed: false })] })).toEqual([
      "webhook_not_subscribed",
    ]);
  });

  it("warns when an account with active campaigns has been silent for 48 hours", () => {
    const silent = account({ lastWebhookAt: new Date(now.getTime() - 49 * HOUR) });
    expect(codes({ accounts: [silent] })).toEqual(["webhook_silent"]);
    expect(codes({ accounts: [account({ lastWebhookAt: null })] })).toEqual([
      "webhook_silent",
    ]);
  });

  it("does not call a webhook silent without active campaigns or for a new connection", () => {
    const silent = account({ lastWebhookAt: null });
    expect(codes({ accounts: [silent], campaigns: [] })).toEqual([]);
    expect(
      codes({
        accounts: [
          account({
            lastWebhookAt: null,
            connectedAt: new Date(now.getTime() - 2 * HOUR),
          }),
        ],
      })
    ).toEqual([]);
  });

  it("flags an active campaign that received comments but sent nothing, with the top error", () => {
    const [issue] = issues({
      campaigns: [
        campaign({
          stats: { sent: 0, failed: 4, rateLimited: 0, planLimited: 0 },
          topError: { message: "Token expired [code=190]", count: 3 },
        }),
      ],
    });
    expect(issue).toMatchObject({
      id: "campaign_not_sending:camp_1",
      severity: "critical",
      href: "/logs",
    });
    expect(issue.title).toContain("Ebook");
    expect(issue.explanation).toContain("4 people");
    expect(issue.explanation).toContain("Token expired [code=190]");
    expect(issue.action).toContain("@studio");
  });

  it("explains a plan limit when no error message was recorded", () => {
    const [issue] = issues({
      campaigns: [
        campaign({ stats: { sent: 0, failed: 0, rateLimited: 0, planLimited: 2 } }),
      ],
    });
    expect(issue.code).toBe("campaign_not_sending");
    expect(issue.explanation).toContain("monthly DM limit");
  });

  it("ignores campaigns with no triggers in the window", () => {
    expect(
      codes({
        campaigns: [
          campaign({ stats: { sent: 0, failed: 0, rateLimited: 0, planLimited: 0 } }),
        ],
      })
    ).toEqual([]);
  });

  it("warns on a high failure ratio only past the minimum failure count", () => {
    expect(
      codes({
        campaigns: [
          campaign({ stats: { sent: 10, failed: 5, rateLimited: 0, planLimited: 0 } }),
        ],
      })
    ).toEqual(["campaign_high_failure"]);
    // Ratio high but too few failures to be meaningful.
    expect(
      codes({
        campaigns: [
          campaign({ stats: { sent: 2, failed: 4, rateLimited: 0, planLimited: 0 } }),
        ],
      })
    ).toEqual([]);
    // Enough failures but a low ratio.
    expect(
      codes({
        campaigns: [
          campaign({ stats: { sent: 100, failed: 6, rateLimited: 0, planLimited: 0 } }),
        ],
      })
    ).toEqual([]);
  });

  it("flags a stopped or unreachable worker as critical", () => {
    expect(codes({ workerHealthy: false })).toEqual(["worker_down"]);
    expect(codes({ workerHealthy: null })).toEqual(["worker_down"]);
  });

  it("flags conversation control errors left by ManyChat", () => {
    expect(codes({ threadOwnerErrors: 2 })).toEqual(["conversation_control"]);
  });

  it("lists critical issues before warnings", () => {
    const result = issues({
      accounts: [account({ tokenExpiresAt: new Date(now.getTime() + DAY) })],
      workerHealthy: false,
      threadOwnerErrors: 1,
    });
    expect(result.map((issue) => issue.severity)).toEqual([
      "critical",
      "warning",
      "warning",
    ]);
  });

  it("renders the copy in Brazilian Portuguese", () => {
    const ptBR = createI18n("pt-BR");
    const [issue] = computeHealthIssues(input({ workerHealthy: false }), {
      t: ptBR.t,
      now,
    });
    expect(issue.title).toBe("O envio de DMs está parado");
  });
});

describe("computeConnectionChecklist", () => {
  function statuses(overrides: Partial<HealthInput> = {}) {
    return Object.fromEntries(
      computeConnectionChecklist(input(overrides), { t, now }).map((item) => [
        item.id,
        item.status,
      ])
    );
  }

  it("is all green for a healthy workspace", () => {
    expect(statuses()).toEqual({
      account_connected: "ok",
      token_valid: "ok",
      webhook_subscribed: "ok",
      webhook_receiving: "ok",
      worker_healthy: "ok",
      conversation_control: "ok",
    });
  });

  it("asks to connect an account first when there is none", () => {
    const result = statuses({ accounts: [], campaigns: [] });
    expect(result.account_connected).toBe("error");
    expect(result.token_valid).toBe("warning");
    expect(result.webhook_subscribed).toBe("warning");
    expect(result.webhook_receiving).toBe("warning");
  });

  it("marks expired and expiring tokens", () => {
    expect(
      statuses({
        accounts: [account({ tokenExpiresAt: new Date(now.getTime() - DAY) })],
      }).token_valid
    ).toBe("error");
    expect(
      statuses({
        accounts: [account({ tokenExpiresAt: new Date(now.getTime() + DAY) })],
      }).token_valid
    ).toBe("warning");
  });

  it("marks webhook subscription, reception, worker and conversation control problems", () => {
    const result = statuses({
      accounts: [account({ webhookSubscribed: false, lastWebhookAt: null })],
      workerHealthy: false,
      threadOwnerErrors: 3,
    });
    expect(result.webhook_subscribed).toBe("error");
    expect(result.webhook_receiving).toBe("warning");
    expect(result.worker_healthy).toBe("error");
    expect(result.conversation_control).toBe("error");
  });

  it("always shows the ManyChat migration step on the conversation control item", () => {
    const item = computeConnectionChecklist(input(), { t, now }).find(
      (entry) => entry.id === "conversation_control"
    );
    expect(item?.action).toContain("Conversation routing");
  });
});
