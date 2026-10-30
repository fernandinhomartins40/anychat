import type { LucideIcon } from "lucide-react";

/**
 * A soft colored square holding an icon. Each area of the product has its own
 * tone, so people learn to recognize sections by color as well as by name.
 */

export type Tone = "violet" | "pink" | "sun" | "mint" | "sky";

export const toneClasses: Record<Tone, string> = {
  violet: "bg-violet-soft text-violet",
  pink: "bg-pink-soft text-pink",
  sun: "bg-sun-soft text-warning",
  mint: "bg-mint-soft text-success",
  sky: "bg-sky-soft text-[#0369a1]",
};

export default function IconTile({
  icon: Icon,
  tone = "violet",
  size = "md",
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "size-14 rounded-2xl" : size === "sm" ? "size-8 rounded-lg" : "size-11 rounded-xl";
  const glyph = size === "lg" ? "size-7" : size === "sm" ? "size-4" : "size-5";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box} ${toneClasses[tone]}`} aria-hidden>
      <Icon className={glyph} strokeWidth={2.2} />
    </span>
  );
}
