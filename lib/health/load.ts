import { prisma } from "@/lib/db/client";
import { getWorkerHealth } from "@/lib/ops/worker-health";
import {
  ACTIVITY_WINDOW_MS,
  type CampaignDeliveryStats,
  type HealthCampaign,
  type HealthInput,
} from "./issues";

const THREAD_OWNER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// The shared Redis connection retries forever (BullMQ needs that), so a Redis
// outage would hang the banner request instead of failing it. Unknown after a
// few seconds is reported the same as unhealthy.
const WORKER_HEALTH_TIMEOUT_MS = 3000;

async function readWorkerHealthy(): Promise<boolean | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), WORKER_HEALTH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      getWorkerHealth().then((health) => health.healthy),
      timeout,
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function emptyStats(): CampaignDeliveryStats {
  return { sent: 0, failed: 0, rateLimited: 0, planLimited: 0 };
}

// Reads everything computeHealthIssues needs for one workspace. Every query is
// scoped by workspaceId and bounded by the activity window, so this stays
// cheap enough to run on each dashboard page load.
export async function loadHealthInput(
  workspaceId: string,
  now = new Date()
): Promise<HealthInput> {
  const since = new Date(now.getTime() - ACTIVITY_WINDOW_MS);
  const threadOwnerSince = new Date(now.getTime() - THREAD_OWNER_WINDOW_MS);

  const [
    accounts,
    campaigns,
    webhookRows,
    statusRows,
    errorRows,
    threadOwnerErrors,
    workerHealthy,
  ] = await Promise.all([
    prisma.instagramAccount.findMany({
      where: { workspaceId },
      orderBy: { connectedAt: "asc" },
      select: {
        id: true,
        instagramId: true,
        username: true,
        provider: true,
        tokenExpiresAt: true,
        webhookSubscribed: true,
        connectedAt: true,
      },
    }),
    prisma.automation.findMany({
      where: { workspaceId, isActive: true },
      select: { id: true, name: true, instagramAccountId: true },
    }),
    // WebhookEvent has no account column; the stored payload only keeps
    // entries for accounts we know, keyed by their Instagram id.
    prisma.$queryRaw<{ instagramId: string; lastAt: Date }[]>`
      SELECT e->>'id' AS "instagramId", MAX(w."createdAt") AS "lastAt"
      FROM "WebhookEvent" w
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(w."payload"->'entry') = 'array'
          THEN w."payload"->'entry' ELSE '[]'::jsonb END
      ) e
      WHERE w."workspaceId" = ${workspaceId} AND w."createdAt" >= ${since}
      GROUP BY 1
    `,
    prisma.dmLog.groupBy({
      by: ["automationId", "status"],
      where: {
        workspaceId,
        createdAt: { gte: since },
        automation: { isActive: true },
      },
      _count: { _all: true },
    }),
    prisma.dmLog.groupBy({
      by: ["automationId", "errorMessage"],
      where: {
        workspaceId,
        createdAt: { gte: since },
        status: "FAILED",
        errorMessage: { not: null },
        automation: { isActive: true },
      },
      _count: { _all: true },
    }),
    prisma.dmLog.count({
      where: {
        workspaceId,
        updatedAt: { gte: threadOwnerSince },
        OR: [
          { errorMessage: { contains: "not the thread owner", mode: "insensitive" } },
          { errorMessage: { contains: "2534037" } },
        ],
      },
    }),
    readWorkerHealthy(),
  ]);

  const lastWebhookAt = new Map(
    webhookRows.map((row) => [row.instagramId, new Date(row.lastAt)])
  );

  const stats = new Map<string, CampaignDeliveryStats>();
  for (const row of statusRows) {
    const entry = stats.get(row.automationId) ?? emptyStats();
    const count = row._count._all;
    if (row.status === "SENT") entry.sent += count;
    else if (row.status === "FAILED") entry.failed += count;
    else if (row.status === "SKIPPED_RATE_LIMIT") entry.rateLimited += count;
    else if (row.status === "SKIPPED_PLAN_LIMIT") entry.planLimited += count;
    stats.set(row.automationId, entry);
  }

  const topErrors = new Map<string, { message: string; count: number }>();
  for (const row of errorRows) {
    if (!row.errorMessage) continue;
    const current = topErrors.get(row.automationId);
    if (!current || row._count._all > current.count) {
      topErrors.set(row.automationId, {
        message: row.errorMessage,
        count: row._count._all,
      });
    }
  }

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      username: account.username,
      provider: account.provider,
      tokenExpiresAt: account.tokenExpiresAt,
      webhookSubscribed: account.webhookSubscribed,
      connectedAt: account.connectedAt,
      lastWebhookAt: lastWebhookAt.get(account.instagramId) ?? null,
    })),
    campaigns: campaigns.map(
      (campaign): HealthCampaign => ({
        id: campaign.id,
        name: campaign.name,
        instagramAccountId: campaign.instagramAccountId,
        stats: stats.get(campaign.id) ?? emptyStats(),
        topError: topErrors.get(campaign.id) ?? null,
      })
    ),
    workerHealthy,
    threadOwnerErrors,
  };
}
