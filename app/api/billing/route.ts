import { NextResponse } from "next/server";
import { getBillingSummary } from "@/lib/billing/summary";
import { canManageBilling, getCurrentWorkspaceContext } from "@/lib/workspace-access";

export const dynamic = "force-dynamic";

/** Plan, limits and usage for the Settings "Plano e cobrança" section. */
export async function GET() {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getBillingSummary(context.workspaceId);
  if (!summary) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: { ...summary, canManageBilling: canManageBilling(context.role) },
  });
}
