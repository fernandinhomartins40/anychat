"use client";

/**
 * Bottom tab bar on phones: thumb-reachable, 4 destinations plus the
 * primary "new automation" action in the middle. Everything else is in the
 * drawer opened from the top bar.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { isNavActive, primaryNav } from "@/components/sidebar";

const tabs = ["/dashboard", "/campaigns", "/inbox", "/contacts"];

export default function MobileNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = primaryNav.filter((item) => tabs.includes(item.href));
  const left = items.slice(0, 2);
  const right = items.slice(2);

  const renderTab = (item: (typeof items)[number]) => {
    const active = isNavActive(pathname, item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${
          active ? "text-accent" : "text-muted"
        }`}
      >
        <Icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} aria-hidden />
        {t(item.label)}
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t("Main menu")}
    >
      <div className="mx-auto flex max-w-md items-center px-2">
        {left.map(renderTab)}
        <Link
          href="/campaigns/new"
          aria-label={t("New automation")}
          className="bg-aurora mx-2 -mt-6 inline-flex size-14 shrink-0 items-center justify-center rounded-full text-white shadow-[var(--shadow-pop)]"
        >
          <Plus className="size-7" strokeWidth={2.6} aria-hidden />
        </Link>
        {right.map(renderTab)}
      </div>
    </nav>
  );
}
