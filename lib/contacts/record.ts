import { prisma } from "@/lib/db/client";
import type { ContactSource } from "@/app/generated/prisma/client";
import { normalizeTagList } from "./tags";

export type ContactInteraction = {
  workspaceId: string;
  /** InstagramAccount.id (our row), not the Instagram user id. */
  instagramAccountId: string;
  /** Instagram-scoped id of the person who commented or messaged. */
  igsid: string;
  username?: string | null;
  source: ContactSource;
  tagNames?: readonly string[];
  at?: Date;
};

/**
 * Creates or refreshes the contact behind an interaction and applies tags.
 * Safe to repeat for the same event: every write is an upsert, so a retried
 * job never duplicates a contact or a tag.
 */
export async function recordContactInteraction(input: ContactInteraction) {
  const at = input.at ?? new Date();
  const username = input.username?.trim() || undefined;

  const contact = await prisma.contact.upsert({
    where: {
      instagramAccountId_igsid: {
        instagramAccountId: input.instagramAccountId,
        igsid: input.igsid,
      },
    },
    create: {
      workspaceId: input.workspaceId,
      instagramAccountId: input.instagramAccountId,
      igsid: input.igsid,
      username,
      firstSeenAt: at,
      lastInteractionAt: at,
      lastSource: input.source,
    },
    update: {
      lastInteractionAt: at,
      lastSource: input.source,
      ...(username ? { username } : {}),
    },
    select: { id: true },
  });

  const names = normalizeTagList(input.tagNames ?? []);
  if (names.length) await applyTags(input.workspaceId, contact.id, names);
  return contact;
}

/** Adds already-normalized tag names to a contact, creating missing tags. */
export async function applyTags(workspaceId: string, contactId: string, names: readonly string[]) {
  if (!names.length) return;
  await prisma.tag.createMany({
    data: names.map((name) => ({ workspaceId, name })),
    skipDuplicates: true,
  });
  const tags = await prisma.tag.findMany({
    where: { workspaceId, name: { in: [...names] } },
    select: { id: true },
  });
  await prisma.contactTag.createMany({
    data: tags.map((tag) => ({ contactId, tagId: tag.id })),
    skipDuplicates: true,
  });
}

/**
 * Contact tracking is a side record: it must never block or fail a DM send.
 * Callers in the worker use this wrapper and only log the failure.
 */
export async function recordContactInteractionSafely(input: ContactInteraction) {
  try {
    await recordContactInteraction(input);
  } catch (error) {
    console.error("[contacts] failed to record interaction", {
      instagramAccountId: input.instagramAccountId,
      source: input.source,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Records the sender of an inbound DM. The webhook only knows the business
 * account's Instagram id, so resolve our account row first; a connection id,
 * when the job has one, pins the lookup to that exact connection.
 */
export async function recordInboundDmContactSafely(input: {
  accountConnectionId?: string;
  instagramUserId: string;
  senderId: string;
}) {
  try {
    const account = await prisma.instagramAccount.findFirst({
      where: {
        instagramId: input.instagramUserId,
        ...(input.accountConnectionId ? { id: input.accountConnectionId } : {}),
      },
      select: { id: true, workspaceId: true },
    });
    if (!account) return;
    await recordContactInteraction({
      workspaceId: account.workspaceId,
      instagramAccountId: account.id,
      igsid: input.senderId,
      source: "DM",
    });
  } catch (error) {
    console.error("[contacts] failed to record inbound DM", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
