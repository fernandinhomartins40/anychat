import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import IconTile, { type Tone } from "./icon-tile";

/**
 * Top of every dashboard page: what this page is for, in one sentence, and
 * the single main action on the right.
 */
export default function PageHeader({
  icon,
  tone = "violet",
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  tone?: Tone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {icon && <IconTile icon={icon} tone={tone} size="lg" />}
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-[1.75rem]">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-muted sm:text-base">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}
