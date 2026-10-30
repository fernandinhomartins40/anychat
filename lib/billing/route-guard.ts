import { NextResponse } from "next/server";
import { isBillingEnabled } from "@/lib/billing/plans";
import {
  canManageBilling,
  getCurrentWorkspaceContext,
  type WorkspaceContext,
} from "@/lib/workspace-access";

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  // Behind a TLS-terminating proxy request.url is http://, so also accept the
  // public NEXTAUTH_URL origin and the forwarded host (same rule as Zernio).
  const allowed = [new URL(request.url).origin];
  if (process.env.NEXTAUTH_URL) allowed.push(new URL(process.env.NEXTAUTH_URL).origin);
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    allowed.push(`${request.headers.get("x-forwarded-proto") ?? "https"}://${forwardedHost}`);
  }
  return allowed.includes(origin);
}

/**
 * Common checks for owner-only billing mutations. Returns either the
 * workspace context or the error response to send.
 */
export async function requireBillingOwner(
  request: Request
): Promise<{ context: WorkspaceContext } | { response: NextResponse }> {
  if (!isBillingEnabled()) {
    return {
      response: NextResponse.json(
        { success: false, error: "Billing is disabled on this instance." },
        { status: 404 }
      ),
    };
  }
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return {
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!isAllowedOrigin(request)) {
    return {
      response: NextResponse.json(
        { success: false, error: "Invalid request origin." },
        { status: 403 }
      ),
    };
  }
  if (!canManageBilling(context.role)) {
    return {
      response: NextResponse.json(
        { success: false, error: "Only the workspace owner can manage billing." },
        { status: 403 }
      ),
    };
  }
  return { context };
}
