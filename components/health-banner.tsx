"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { HealthIssue } from "@/lib/health/issues";

const DISMISSED_KEY = "anychat-health-dismissed";
const REFRESH_MS = 5 * 60 * 1000;

// The dismissal is remembered against the exact set of issues, so a problem
// that appears after the user closed the banner brings it back.
function signature(issues: HealthIssue[]) {
  return issues
    .map((issue) => issue.id)
    .sort()
    .join("|");
}

function readDismissed() {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

export default function HealthBanner() {
  const { t } = useI18n();
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  // Read lazily: the banner renders nothing until issues load, so the server
  // and first client render match even though only the client has storage.
  const [dismissed, setDismissed] = useState<string | null>(readDismissed);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/health/issues");
        const payload = await response.json();
        if (active && payload.success) {
          setIssues(payload.data.issues);
        }
      } catch {
        // The banner is advisory; a failed check must not break the page.
      }
    }

    void load();
    const interval = setInterval(() => void load(), REFRESH_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (issues.length === 0 || dismissed === signature(issues)) return null;

  const top = issues[0];
  const critical = top.severity === "critical";
  const others = issues.length - 1;

  function dismiss() {
    const value = signature(issues);
    try {
      sessionStorage.setItem(DISMISSED_KEY, value);
    } catch {
      // Without storage the banner simply hides until the next page load.
    }
    setDismissed(value);
  }

  return (
    <div
      role="alert"
      className={`mb-5 flex items-start gap-3 rounded border p-4 text-sm ${
        critical
          ? "border-error/20 bg-error/10 text-error"
          : "border-warning/20 bg-warning/10 text-warning"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {top.title}
          {others > 0 && (
            <span className="font-normal opacity-80">
              {" "}
              · {t("+{count} more issues", { count: others })}
            </span>
          )}
        </p>
        <p className="mt-1 opacity-90">{top.action}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
          <Link href={top.href} className="underline underline-offset-2">
            {t("Fix it")}
          </Link>
          <Link
            href="/diagnostics#checklist"
            className="underline underline-offset-2"
          >
            {t("See all ({count})", { count: issues.length })}
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("Dismiss")}
        className="shrink-0 rounded px-2 py-1 text-base leading-none opacity-70 transition hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
