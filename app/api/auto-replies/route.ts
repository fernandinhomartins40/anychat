import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { canManageWorkspace, getCurrentWorkspaceContext } from "@/lib/workspace-access";
import {
  autoReplySettingsSchema,
  EMPTY_AUTO_REPLY_SETTINGS,
} from "@/lib/auto-replies/settings";

export const dynamic = "force-dynamic";

const RECENT_LOG_LIMIT = 20;

const settingsSelect = {
  welcomeEnabled: true,
  welcomeMessage: true,
  defaultReplyEnabled: true,
  defaultReplyMessage: true,
  defaultReplyCooldownHours: true,
} as const;

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function accountNotFound() {
  return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
}

// Settings and the latest auto replies of one connected account.
export async function GET(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) return unauthorized();

  const instagramAccountId = request.nextUrl.searchParams.get("instagramAccountId");
  if (!instagramAccountId) {
    return NextResponse.json({ success: false, error: "instagramAccountId is required" }, { status: 400 });
  }

  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, workspaceId: context.workspaceId },
    select: { id: true, autoReply: { select: settingsSelect } },
  });
  if (!account) return accountNotFound();

  const logs = await prisma.autoReplyLog.findMany({
    where: { instagramAccountId: account.id, workspaceId: context.workspaceId },
    orderBy: { createdAt: "desc" },
    take: RECENT_LOG_LIMIT,
    select: {
      id: true,
      kind: true,
      status: true,
      recipientId: true,
      recipientName: true,
      inboundText: true,
      errorMessage: true,
      sentAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: {
        settings: account.autoReply ?? EMPTY_AUTO_REPLY_SETTINGS,
        canEdit: canManageWorkspace(context.role),
        logs,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(request: NextRequest) {
  const context = await getCurrentWorkspaceContext();
  if (!context) return unauthorized();
  if (!canManageWorkspace(context.role)) {
    return NextResponse.json(
      { success: false, error: "Only owners and admins can change auto replies" },
      { status: 403 }
    );
  }

  const parsed = autoReplySettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" },
      { status: 400 }
    );
  }

  const { instagramAccountId, ...input } = parsed.data;
  const account = await prisma.instagramAccount.findFirst({
    where: { id: instagramAccountId, workspaceId: context.workspaceId },
    select: { id: true },
  });
  if (!account) return accountNotFound();

  const data = {
    ...input,
    welcomeMessage: input.welcomeMessage.trim(),
    defaultReplyMessage: input.defaultReplyMessage.trim(),
  };
  const settings = await prisma.accountAutoReply.upsert({
    where: { instagramAccountId: account.id },
    create: { instagramAccountId: account.id, ...data },
    update: data,
    select: settingsSelect,
  });

  return NextResponse.json({ success: true, data: { settings } });
}
