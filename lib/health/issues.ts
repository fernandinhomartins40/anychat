import type { I18n } from "@/lib/i18n";

// Active alerts (PRD R2) and the connection checklist (PRD C4). Everything in
// this file is pure: lib/health/load.ts reads the database and the worker
// heartbeat into a HealthInput, and these functions turn that snapshot into
// translated, actionable copy. Keeping the rules here makes every threshold
// unit-testable without Postgres or Redis.

export const ACTIVITY_WINDOW_MS = 48 * 60 * 60 * 1000;
export const TOKEN_WARNING_MS = 7 * 24 * 60 * 60 * 1000;
// A single failure among dozens of sends is noise; a campaign only counts as
// "failing a lot" once there are enough attempts for the ratio to mean
// something.
export const HIGH_FAILURE_MIN_FAILED = 5;
export const HIGH_FAILURE_RATIO = 0.3;

export type IssueSeverity = "critical" | "warning";

export type IssueCode =
  | "token_expired"
  | "token_expiring"
  | "webhook_not_subscribed"
  | "webhook_silent"
  | "campaign_not_sending"
  | "campaign_high_failure"
  | "worker_down"
  | "conversation_control";

export interface HealthIssue {
  // Stable across requests, so a dismissed banner can tell a new problem from
  // one the user already saw.
  id: string;
  code: IssueCode;
  severity: IssueSeverity;
  title: string;
  explanation: string;
  action: string;
  href: string;
}

export interface HealthAccount {
  id: string;
  username: string;
  provider: "META" | "ZERNIO";
  tokenExpiresAt: Date | null;
  webhookSubscribed: boolean;
  connectedAt: Date;
  // Most recent stored webhook event for this account, if any in the window.
  lastWebhookAt: Date | null;
}

export interface CampaignDeliveryStats {
  sent: number;
  failed: number;
  rateLimited: number;
  planLimited: number;
}

export interface HealthCampaign {
  id: string;
  name: string;
  instagramAccountId: string;
  // Only DmLog rows created inside the activity window.
  stats: CampaignDeliveryStats;
  topError: { message: string; count: number } | null;
}

export interface HealthInput {
  accounts: HealthAccount[];
  // Active campaigns only.
  campaigns: HealthCampaign[];
  // null when the heartbeat could not be read at all (Redis down), which is
  // just as fatal for delivery as a stale heartbeat.
  workerHealthy: boolean | null;
  // Recent sends Meta rejected with "not the thread owner": another tool such
  // as ManyChat still controls the account's conversations.
  threadOwnerErrors: number;
}

type T = I18n["t"];

function daysUntil(date: Date, now: Date) {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

function tokenState(account: HealthAccount, now: Date) {
  // Zernio holds the Instagram credentials on its side; there is no token for
  // us to expire or refresh.
  if (account.provider !== "META" || !account.tokenExpiresAt) return "ok";
  const remaining = account.tokenExpiresAt.getTime() - now.getTime();
  if (remaining <= 0) return "expired";
  if (remaining <= TOKEN_WARNING_MS) return "expiring";
  return "ok";
}

function webhookSilent(
  account: HealthAccount,
  activeAccountIds: Set<string>,
  now: Date
) {
  const since = now.getTime() - ACTIVITY_WINDOW_MS;
  return (
    activeAccountIds.has(account.id) &&
    // A brand new connection has not had 48 hours to receive anything.
    account.connectedAt.getTime() <= since &&
    (!account.lastWebhookAt || account.lastWebhookAt.getTime() < since)
  );
}

function notSentCount(stats: CampaignDeliveryStats) {
  return stats.failed + stats.rateLimited + stats.planLimited;
}

export function computeHealthIssues(
  input: HealthInput,
  { t, now = new Date() }: { t: T; now?: Date }
): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const activeAccountIds = new Set(
    input.campaigns.map((campaign) => campaign.instagramAccountId)
  );

  if (input.workerHealthy !== true) {
    issues.push({
      id: "worker_down",
      code: "worker_down",
      severity: "critical",
      title: t("DM sending is stopped"),
      explanation: t(
        "The background worker that sends your DMs is not running. Comments still arrive, but nobody gets a reply until it is back."
      ),
      action: t(
        "If you host AnyChat yourself, start it with npm run worker and check that it can reach Redis. Otherwise, contact support."
      ),
      href: "/diagnostics",
    });
  }

  for (const account of input.accounts) {
    const username = account.username;
    const token = tokenState(account, now);

    if (token === "expired") {
      issues.push({
        id: `token_expired:${account.id}`,
        code: "token_expired",
        severity: "critical",
        title: t("Instagram connection expired for @{username}", { username }),
        explanation: t(
          "Instagram no longer accepts our access for this account, so its campaigns cannot reply or send DMs."
        ),
        action: t(
          "Go to Settings and click Connect Instagram again with this account. Your campaigns are kept."
        ),
        href: "/settings",
      });
    } else if (token === "expiring" && account.tokenExpiresAt) {
      issues.push({
        id: `token_expiring:${account.id}`,
        code: "token_expiring",
        severity: "warning",
        title: t("Instagram connection for @{username} expires in {days} days", {
          username,
          days: daysUntil(account.tokenExpiresAt, now),
        }),
        explanation: t(
          "We renew access automatically, but the last renewal did not succeed. When it expires, campaigns on this account stop."
        ),
        action: t(
          "Go to Settings and click Connect Instagram again with this account to renew it now."
        ),
        href: "/settings",
      });
    }

    if (account.provider === "META" && !account.webhookSubscribed) {
      issues.push({
        id: `webhook_not_subscribed:${account.id}`,
        code: "webhook_not_subscribed",
        severity: "critical",
        title: t("@{username} is not receiving comments", { username }),
        explanation: t(
          "Instagram was not told to send this account's comments and DMs to AnyChat, so campaigns cannot react to them."
        ),
        action: t(
          "Go to Settings and click Connect Instagram again with this account, accepting every permission requested."
        ),
        href: "/settings",
      });
    } else if (webhookSilent(account, activeAccountIds, now)) {
      issues.push({
        id: `webhook_silent:${account.id}`,
        code: "webhook_silent",
        severity: "warning",
        title: t("No Instagram activity for @{username} in 48 hours", {
          username,
        }),
        explanation: t(
          "This account has active campaigns, but Instagram has not sent us a single comment or DM in the last 48 hours. If nobody interacted, that is expected; otherwise, the connection may be broken."
        ),
        action: t(
          "Comment one of your keywords from another Instagram account. If no DM arrives, connect the account again in Settings."
        ),
        href: "/diagnostics",
      });
    }
  }

  const usernames = new Map(
    input.accounts.map((account) => [account.id, account.username])
  );
  for (const campaign of input.campaigns) {
    const { stats } = campaign;
    const notSent = notSentCount(stats);
    const attempts = stats.sent + notSent;
    if (notSent === 0) continue;
    const errorDetail = campaign.topError
      ? t("Most common error: {error}", { error: campaign.topError.message })
      : stats.planLimited > 0
        ? t("The monthly DM limit of your plan was reached.")
        : stats.rateLimited > 0
          ? t("Instagram's hourly DM limit was reached.")
          : "";

    if (stats.sent === 0) {
      issues.push({
        id: `campaign_not_sending:${campaign.id}`,
        code: "campaign_not_sending",
        severity: "critical",
        title: t("Campaign \"{name}\" sent no DMs", { name: campaign.name }),
        explanation: [
          t(
            "{count} people triggered it in the last 48 hours and none of them received the DM.",
            { count: notSent }
          ),
          errorDetail,
        ]
          .filter(Boolean)
          .join(" "),
        action: t(
          "Open DM Logs to see each failure. Check the account connection for @{username} and the checklist on the Diagnostics page.",
          { username: usernames.get(campaign.instagramAccountId) ?? "?" }
        ),
        href: "/logs",
      });
    } else if (
      stats.failed >= HIGH_FAILURE_MIN_FAILED &&
      stats.failed / attempts >= HIGH_FAILURE_RATIO
    ) {
      issues.push({
        id: `campaign_high_failure:${campaign.id}`,
        code: "campaign_high_failure",
        severity: "warning",
        title: t("Campaign \"{name}\" is failing often", { name: campaign.name }),
        explanation: [
          t(
            "{failed} of {total} DMs failed in the last 48 hours.",
            { failed: stats.failed, total: attempts }
          ),
          errorDetail,
        ]
          .filter(Boolean)
          .join(" "),
        action: t(
          "Open DM Logs to see which messages failed and why, then fix the cause shown there."
        ),
        href: "/logs",
      });
    }
  }

  if (input.threadOwnerErrors > 0) {
    issues.push({
      id: "conversation_control",
      code: "conversation_control",
      severity: "warning",
      title: t("Another app controls your Instagram conversations"),
      explanation: t(
        "Instagram rejected follow-up DMs because another tool, often ManyChat, still owns the conversations. The first DM arrives, but button taps get no answer."
      ),
      action: conversationControlAction(t),
      href: "/diagnostics",
    });
  }

  const rank: Record<IssueSeverity, number> = { critical: 0, warning: 1 };
  return issues.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function conversationControlAction(t: T) {
  return t(
    "In Meta Business Suite, open Settings, Integrations, Conversation routing. Under Partner apps, remove the old tool, then click Manage next to AnyChat and turn on Access all conversations and Take control of conversations."
  );
}

export type ChecklistStatus = "ok" | "warning" | "error";

export interface ChecklistItem {
  id:
    | "account_connected"
    | "token_valid"
    | "webhook_subscribed"
    | "webhook_receiving"
    | "worker_healthy"
    | "conversation_control";
  status: ChecklistStatus;
  title: string;
  detail: string;
  // What to do; present even on "ok" items that need a one-time manual step
  // we cannot verify from here.
  action: string | null;
  href: string | null;
}

function handles(accounts: HealthAccount[]) {
  return accounts.map((account) => `@${account.username}`).join(", ");
}

export function computeConnectionChecklist(
  input: HealthInput,
  { t, now = new Date() }: { t: T; now?: Date }
): ChecklistItem[] {
  const { accounts } = input;
  const hasAccounts = accounts.length > 0;
  const connectFirst = t("Connect an Instagram account first.");
  const activeAccountIds = new Set(
    input.campaigns.map((campaign) => campaign.instagramAccountId)
  );
  const since = now.getTime() - ACTIVITY_WINDOW_MS;

  const expired = accounts.filter((a) => tokenState(a, now) === "expired");
  const expiring = accounts.filter((a) => tokenState(a, now) === "expiring");
  const unsubscribed = accounts.filter(
    (a) => a.provider === "META" && !a.webhookSubscribed
  );
  const quiet = accounts.filter(
    (a) => !a.lastWebhookAt || a.lastWebhookAt.getTime() < since
  );
  const quietWithCampaigns = quiet.filter((a) =>
    webhookSilent(a, activeAccountIds, now)
  );

  const items: ChecklistItem[] = [];

  items.push(
    hasAccounts
      ? {
          id: "account_connected",
          status: "ok",
          title: t("Instagram Business or Creator account connected"),
          detail: t(
            "Connected: {accounts}. Instagram only lets professional accounts connect, so the account type is right.",
            { accounts: handles(accounts) }
          ),
          action: null,
          href: null,
        }
      : {
          id: "account_connected",
          status: "error",
          title: t("Instagram Business or Creator account connected"),
          detail: t("No Instagram account is connected to this workspace yet."),
          action: t(
            "Switch your Instagram to a Business or Creator account in the Instagram app (Settings, Account type and tools), then click Connect Instagram in Settings."
          ),
          href: "/settings",
        }
  );

  items.push(
    !hasAccounts
      ? {
          id: "token_valid",
          status: "warning",
          title: t("Permissions and access valid"),
          detail: connectFirst,
          action: null,
          href: "/settings",
        }
      : expired.length > 0
        ? {
            id: "token_valid",
            status: "error",
            title: t("Permissions and access valid"),
            detail: t("Access expired for {accounts}.", {
              accounts: handles(expired),
            }),
            action: t(
              "Go to Settings and click Connect Instagram again with each account listed."
            ),
            href: "/settings",
          }
        : expiring.length > 0
          ? {
              id: "token_valid",
              status: "warning",
              title: t("Permissions and access valid"),
              detail: t("Access expires within 7 days for {accounts}.", {
                accounts: handles(expiring),
              }),
              action: t(
                "Go to Settings and click Connect Instagram again with each account listed."
              ),
              href: "/settings",
            }
          : {
              id: "token_valid",
              status: "ok",
              title: t("Permissions and access valid"),
              detail: t("Every connected account has valid access."),
              action: null,
              href: null,
            }
  );

  items.push(
    !hasAccounts
      ? {
          id: "webhook_subscribed",
          status: "warning",
          title: t("Comments and DMs subscribed"),
          detail: connectFirst,
          action: null,
          href: "/settings",
        }
      : unsubscribed.length > 0
        ? {
            id: "webhook_subscribed",
            status: "error",
            title: t("Comments and DMs subscribed"),
            detail: t("Instagram is not sending events for {accounts}.", {
              accounts: handles(unsubscribed),
            }),
            action: t(
              "Go to Settings and click Connect Instagram again with each account listed, accepting every permission requested."
            ),
            href: "/settings",
          }
        : {
            id: "webhook_subscribed",
            status: "ok",
            title: t("Comments and DMs subscribed"),
            detail: t(
              "Instagram is set to send comments and DMs from every account to AnyChat."
            ),
            action: null,
            href: null,
          }
  );

  items.push(
    !hasAccounts
      ? {
          id: "webhook_receiving",
          status: "warning",
          title: t("Receiving comments and DMs"),
          detail: connectFirst,
          action: null,
          href: "/settings",
        }
      : quiet.length === 0
        ? {
            id: "webhook_receiving",
            status: "ok",
            title: t("Receiving comments and DMs"),
            detail: t(
              "Every account received comments or DMs in the last 48 hours."
            ),
            action: null,
            href: null,
          }
        : {
            id: "webhook_receiving",
            status: "warning",
            title: t("Receiving comments and DMs"),
            detail:
              quietWithCampaigns.length > 0
                ? t(
                    "Nothing received in the last 48 hours for {accounts}, even with active campaigns.",
                    { accounts: handles(quietWithCampaigns) }
                  )
                : t("Nothing received in the last 48 hours for {accounts}.", {
                    accounts: handles(quiet),
                  }),
            action: t(
              "Comment one of your keywords from another Instagram account. If no DM arrives, connect the account again in Settings."
            ),
            href: "/campaigns",
          }
  );

  items.push(
    input.workerHealthy === true
      ? {
          id: "worker_healthy",
          status: "ok",
          title: t("DM sending running"),
          detail: t("The background worker that sends DMs is running."),
          action: null,
          href: null,
        }
      : {
          id: "worker_healthy",
          status: "error",
          title: t("DM sending running"),
          detail: t(
            "The background worker that sends DMs is not running. No DM goes out until it is back."
          ),
          action: t(
            "If you host AnyChat yourself, start it with npm run worker and check that it can reach Redis. Otherwise, contact support."
          ),
          href: "/diagnostics",
        }
  );

  items.push(
    input.threadOwnerErrors > 0
      ? {
          id: "conversation_control",
          status: "error",
          title: t("AnyChat controls your conversations"),
          detail: t(
            "Instagram rejected {count} follow-up DMs in the last 7 days because another app owns the conversations.",
            { count: input.threadOwnerErrors }
          ),
          action: conversationControlAction(t),
          href: null,
        }
      : {
          id: "conversation_control",
          status: "ok",
          title: t("AnyChat controls your conversations"),
          detail: t(
            "No conversation ownership errors seen. Coming from ManyChat or another DM tool? Do this once, even if you cancelled it, or button taps in DMs will get no answer."
          ),
          action: conversationControlAction(t),
          href: null,
        }
  );

  return items;
}
