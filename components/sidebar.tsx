"use client";

/**
 * Sidebar Navigation
 *
 * Five everyday destinations up top, the rarely used ones tucked under
 * "More", and one obvious primary action: create an automation.
 * On phones the same destinations live in the bottom tab bar
 * (components/mobile-nav.tsx); this drawer holds the rest.
 */

import LanguageSwitcher from "@/components/language-switcher";
import Logo from "@/components/ui/logo";
import { buttonClasses } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import type { StaticMessageKey } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  Code2,
  House,
  ListChecks,
  MessageCircle,
  Plus,
  Settings,
  Stethoscope,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "@/components/ui/icon-tile";

export type NavItem = {
  label: StaticMessageKey;
  href: string;
  icon: LucideIcon;
  tone: Tone;
  /** Other routes that should light this item up. */
  also?: string[];
};

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: House, tone: "violet" },
  { label: "Automations", href: "/campaigns", icon: Zap, tone: "pink", also: ["/automations"] },
  { label: "Auto replies", href: "/auto-replies", icon: Bot, tone: "sun" },
  { label: "Inbox", href: "/inbox", icon: MessageCircle, tone: "sky" },
  { label: "Contacts", href: "/contacts", icon: Users, tone: "mint" },
  { label: "Results", href: "/overview", icon: BarChart3, tone: "violet" },
];

export const secondaryNav: NavItem[] = [
  { label: "DM Logs", href: "/logs", icon: ListChecks, tone: "violet" },
  { label: "Diagnostics", href: "/diagnostics", icon: Stethoscope, tone: "violet" },
  { label: "API & MCP", href: "/integrations", icon: Code2, tone: "violet" },
  { label: "Settings", href: "/settings", icon: Settings, tone: "violet" },
];

const activeTone: Record<Tone, string> = {
  violet: "bg-violet-soft text-violet",
  pink: "bg-pink-soft text-pink",
  sun: "bg-sun-soft text-warning",
  mint: "bg-mint-soft text-success",
  sky: "bg-sky-soft text-[#0369a1]",
};

export function isNavActive(pathname: string, item: NavItem) {
  // "New automation" has its own button; don't also light up the list item.
  if (pathname === "/campaigns/new") return false;
  return [item.href, ...(item.also ?? [])].some(
    (href) => pathname === href || pathname.startsWith(href + "/")
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
}

export default function Sidebar({ isOpen, onClose, workspaceName }: SidebarProps) {
  const { t } = useI18n();
  const pathname = usePathname();

  const renderItem = (item: NavItem, small = false) => {
    const active = isNavActive(pathname, item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-semibold transition-colors ${
          small ? "text-[13px]" : "text-sm"
        } ${active ? activeTone[item.tone] : "text-muted hover:bg-surface-hover hover:text-foreground"}`}
      >
        <Icon className={small ? "size-4" : "size-[18px]"} strokeWidth={2.2} aria-hidden />
        {t(item.label)}
      </Link>
    );
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={onClose} />}

      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-dvh w-72 max-w-[85vw] shrink-0 flex-col border-r border-border bg-surface
          transition-transform duration-200 ease-out
          lg:static lg:z-auto lg:h-full lg:w-64 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Full-height drawer: keep the logo clear of the status bar. */}
        <div className="px-5 pb-4" style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}>
          <Link href="/dashboard" onClick={onClose} aria-label="AnyChat">
            <Logo />
          </Link>
        </div>

        <div className="px-4 pb-2">
          <Link
            href="/campaigns/new"
            onClick={onClose}
            className={buttonClasses("primary", "md", "w-full")}
          >
            <Plus className="size-4" strokeWidth={2.6} aria-hidden />
            {t("New automation")}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label={t("Main menu")}>
          {primaryNav.map((item) => renderItem(item))}
          <p className="px-3 pb-1 pt-5 text-[11px] font-bold uppercase tracking-wider text-muted">{t("More")}</p>
          {secondaryNav.map((item) => renderItem(item, true))}
        </nav>

        <div className="border-t border-border px-5 py-4">
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
          <p className="truncate text-sm font-semibold text-foreground">{workspaceName}</p>
        </div>
      </aside>
    </>
  );
}
