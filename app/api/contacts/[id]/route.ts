import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { applyTags } from "@/lib/contacts/record";
import { MAX_TAG_LENGTH, normalizeTagList } from "@/lib/contacts/tags";

type RouteProps = { params: Promise<{ id: string }> };

const updateTagsSchema = z.object({
  addTags: z.array(z.string().max(MAX_TAG_LENGTH)).max(20).optional().default([]),
  removeTags: z.array(z.string().max(MAX_TAG_LENGTH)).max(20).optional().default([]),
});

// Adds or removes tags on one contact. Tags left with no contacts are kept,
// so a campaign that applies them later still finds them.
export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = updateTagsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid tags" }, { status: 400 });
  }

  const contact = await prisma.contact.findFirst({ where: { id, workspaceId }, select: { id: true } });
  if (!contact) {
    return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
  }

  const add = normalizeTagList(parsed.data.addTags);
  const remove = normalizeTagList(parsed.data.removeTags).filter((name) => !add.includes(name));

  await applyTags(workspaceId, contact.id, add);
  if (remove.length) {
    await prisma.contactTag.deleteMany({
      where: { contactId: contact.id, tag: { workspaceId, name: { in: remove } } },
    });
  }

  const tags = await prisma.contactTag.findMany({
    where: { contactId: contact.id },
    orderBy: [{ createdAt: "asc" }, { tag: { name: "asc" } }],
    select: { tag: { select: { name: true } } },
  });
  return NextResponse.json({ success: true, data: { tags: tags.map((t) => t.tag.name) } });
}
