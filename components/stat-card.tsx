"use client";

import { useI18n } from "@/lib/i18n/provider";
import type { LucideIcon } from "lucide-react";
import IconTile, { type Tone } from "@/components/ui/icon-tile";


/**
 * Stat Card
 *
 * Metric panel with label, value, and optional trend.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: LucideIcon;
  tone?: Tone;
}

export default function StatCard({ label, value, trend, trendUp, icon, tone }: StatCardProps) {
  const { t } = useI18n();
  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex items-center gap-3">
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trendUp ? "text-success" : "text-error"}`}>
          {trendUp ? t("Up") : t("Down")} {trend}
        </p>
      )}
    </div>
  );
}
