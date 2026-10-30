import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { buildContactWhere } from "@/lib/contacts/query";
import { toCsv } from "@/lib/utils/csv";

export const dynamic = "force-dynamic";

// Upper bound for one CSV export, so a huge workspace cannot stall the server.
const MAX_EXPORT_ROWS = 50_000;

const contactInclude = {
  instagramAccount: { select: { username: true } },
  // Tags added in one write share a createdAt; the name breaks the tie so
  // the order never shuffles between loads.
  tags: {
    select: { tag: { select: { name: true } } },
    orderBy: [{ createdAt: "asc" as const }, { tag: { name: "asc" as const } }],
  },
};

export async function GET(request: NextRequest) {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const where = buildContactWhere(workspaceId, {
    search: searchParams.get("search"),
    tag: searchParams.get("tag"),
    instagramAccountId: searchParams.get("instagramAccountId"),
  });

  if (searchParams.get("format") === "csv") {
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { lastInteractionAt: "desc" },
      take: MAX_EXPORT_ROWS,
      include: contactInclude,
    });
    const csv = toCsv(
      ["username", "instagram_account", "tags", "first_seen_at", "last_interaction_at", "last_source", "instagram_scoped_id"],
      contacts.map((c) => [
        c.username,
        c.instagramAccount.username,
        c.tags.map((t) => t.tag.name).join("; "),
        c.firstSeenAt.toISOString(),
        c.lastInteractionAt.toISOString(),
        c.lastSource,
        c.igsid,
      ])
    );
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "25", 10) || 25));

  const [contacts, total, tags] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { lastInteractionAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: contactInclude,
    }),
    prisma.contact.count({ where }),
    prisma.tag.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { name: true, _count: { select: { contacts: true } } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      contacts: contacts.map((c) => ({
        id: c.id,
        username: c.username,
        igsid: c.igsid,
        instagramAccountUsername: c.instagramAccount.username,
        tags: c.tags.map((t) => t.tag.name),
        firstSeenAt: c.firstSeenAt,
        lastInteractionAt: c.lastInteractionAt,
        lastSource: c.lastSource,
      })),
      tags: tags.map((t) => ({ name: t.name, count: t._count.contacts })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  });
}
