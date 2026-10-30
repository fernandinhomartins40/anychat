import { NextResponse } from "next/server";
import { getCurrentWorkspaceId } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";
import {
  computeConnectionChecklist,
  computeHealthIssues,
} from "@/lib/health/issues";
import { loadHealthInput } from "@/lib/health/load";

export const runtime = "nodejs";
// Alerts must reflect live state, never a cached response.
export const dynamic = "force-dynamic";

export async function GET() {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { t } = await getI18n();
  const now = new Date();
  const input = await loadHealthInput(workspaceId, now);

  return NextResponse.json({
    success: true,
    data: {
      issues: computeHealthIssues(input, { t, now }),
      checklist: computeConnectionChecklist(input, { t, now }),
    },
  });
}
