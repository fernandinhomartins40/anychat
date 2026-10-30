import { Check } from "lucide-react";

/**
 * Progress for a 3-step flow. Steps before the current one show a check and
 * can be clicked to go back; steps ahead are not clickable, so a step can
 * never be skipped.
 */
export default function Stepper({
  steps,
  current,
  onSelect,
}: {
  steps: readonly string[];
  current: number;
  onSelect?: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Progress">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        const clickable = done && onSelect;
        const content = (
          <>
            <span
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done ? "bg-mint text-white" : active ? "bg-aurora text-white" : "bg-surface-hover text-muted"
              }`}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
            </span>
            <span className={`hidden text-sm font-semibold sm:inline ${active ? "text-foreground" : "text-muted"}`}>
              {label}
            </span>
          </>
        );
        return (
          <li key={label} className="flex min-w-0 items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
            {clickable ? (
              <button type="button" onClick={() => onSelect(index)} className="flex min-h-11 items-center gap-2 rounded-full pr-2">
                {content}
              </button>
            ) : (
              <span className="flex min-h-11 items-center gap-2">{content}</span>
            )}
            {index < steps.length - 1 && (
              <span className={`h-0.5 w-6 rounded-full sm:w-10 ${done ? "bg-mint" : "bg-border"}`} aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
