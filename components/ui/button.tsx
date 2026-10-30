import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Buttons and button-styled links. One primary action per screen: the
 * gradient "primary" variant. Every size keeps a 44px touch target.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all " +
  "disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-aurora text-white shadow-[var(--shadow-pop)] hover:brightness-110 active:brightness-95",
  secondary: "bg-surface text-foreground border border-border hover:border-border-hover hover:bg-surface-hover",
  ghost: "text-accent hover:bg-violet-soft",
  danger: "bg-surface text-error border border-error/30 hover:bg-error/5",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-7 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children: ReactNode;
};

export function Button({
  variant,
  size,
  icon,
  children,
  className = "",
  type = "button",
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  children,
  className = "",
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
