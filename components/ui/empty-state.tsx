import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import IconTile, { type Tone } from "./icon-tile";

/**
 * Empty states do three jobs: say what is (not) here, say what will appear,
 * and offer the one action that fills it.
 */
export default function EmptyState({
  icon,
  tone = "violet",
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <IconTile icon={icon} tone={tone} size="lg" />
      <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
