"use client";

import type { StaticMessageKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
/**
 * Status pill for DM status. Color plus the word, never color alone.
 */

const statusConfig: Record<string, { text: string; label: StaticMessageKey }> = {
  SENT: { text: "bg-mint-soft text-success", label: "Sent" },
  FAILED: { text: "bg-pink-soft text-error", label: "Failed" },
  PENDING: { text: "bg-sun-soft text-warning", label: "Pending" },
  SKIPPED_DEDUP: { text: "bg-surface-hover text-muted", label: "Dedup" },
  SKIPPED_RATE_LIMIT: { text: "bg-sun-soft text-warning", label: "Rate limited" },
  SKIPPED_PLAN_LIMIT: { text: "bg-sun-soft text-warning", label: "Skipped" },
  SKIPPED_NO_MATCH: { text: "bg-surface-hover text-muted", label: "No match" },
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useI18n();
  const config = statusConfig[status] ?? statusConfig.PENDING;

  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${config.text}`}>
      {t(config.label)}
    </span>
  );
}
