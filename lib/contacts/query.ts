import type { Prisma } from "@/app/generated/prisma/client";

export type ContactFilters = {
  search?: string | null;
  tag?: string | null;
  instagramAccountId?: string | null;
};

/** Workspace-scoped filter shared by the contacts list and the CSV export. */
export function buildContactWhere(workspaceId: string, filters: ContactFilters): Prisma.ContactWhereInput {
  const search = filters.search?.trim().replace(/^@/, "");
  const tag = filters.tag?.trim();
  const account = filters.instagramAccountId;
  return {
    workspaceId,
    ...(account && account !== "all" ? { instagramAccountId: account } : {}),
    ...(search ? { username: { contains: search, mode: "insensitive" } } : {}),
    ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
  };
}
