import type { Prisma } from "@/app/generated/prisma/client";
import { isBillingEnabled, resolveWorkspacePlan } from "@/lib/billing/plans";
import { prisma } from "@/lib/db/client";

type InstagramAccountDb = Pick<Prisma.TransactionClient, "instagramAccount" | "workspace">;

export type InstagramConnectionCheck =
  | { allowed: true; reason: null }
  | { allowed: false; reason: "already_connected" }
  | { allowed: false; reason: "plan_limit"; limit: number };

/**
 * Plan cap on connected Instagram accounts. Reconnecting an account the
 * workspace already has never counts against the cap; disabled billing
 * (self-hosted) means no cap at all.
 */
export async function checkInstagramAccountLimit(
  workspaceId: string,
  instagramId: string,
  db: InstagramAccountDb = prisma
): Promise<{ allowed: true } | { allowed: false; limit: number }> {
  if (!isBillingEnabled()) return { allowed: true };

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true, subscriptionStatus: true },
  });
  if (!workspace) return { allowed: true };

  const limit = resolveWorkspacePlan(workspace).limits.maxInstagramAccounts;
  if (limit === null) return { allowed: true };

  const current = await db.instagramAccount.count({
    where: { workspaceId, instagramId: { not: instagramId } },
  });
  return current < limit ? { allowed: true } : { allowed: false, limit };
}

export async function canConnectInstagramAccount({
  workspaceId,
  instagramId,
}: {
  workspaceId: string;
  instagramId: string;
}): Promise<InstagramConnectionCheck> {
  const existingAccount = await prisma.instagramAccount.findUnique({
    where: { instagramId },
    select: { workspaceId: true, provider: true },
  });

  if (existingAccount && (existingAccount.workspaceId !== workspaceId || existingAccount.provider === "ZERNIO")) {
    return {
      allowed: false,
      reason: "already_connected" as const,
    };
  }

  const planCheck = await checkInstagramAccountLimit(workspaceId, instagramId);
  if (!planCheck.allowed) {
    return { allowed: false, reason: "plan_limit", limit: planCheck.limit };
  }

  return {
    allowed: true,
    reason: null,
  };
}

export async function getWorkspaceInstagramAccount(
  workspaceId: string,
  instagramAccountId?: string | null
) {
  if (instagramAccountId && instagramAccountId !== "all") {
    return prisma.instagramAccount.findFirst({
      where: { id: instagramAccountId, workspaceId },
    });
  }

  return prisma.instagramAccount.findFirst({
    where: { workspaceId },
    orderBy: { connectedAt: "desc" },
  });
}

