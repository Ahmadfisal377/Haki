"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dict";
import { Icon, type IconName } from "@/components/Icon";

const NAV: Array<{ href: string; key: DictKey; icon: IconName }> = [
  { href: "/dashboard", key: "nav_dashboard", icon: "home" },
  { href: "/chat", key: "nav_chat", icon: "chat" },
  { href: "/talk", key: "nav_talk", icon: "talk" },
  { href: "/activities", key: "nav_activities", icon: "target" },
  { href: "/partner", key: "nav_partner", icon: "heart" },
  { href: "/memory", key: "nav_memory", icon: "bookmark" },
  { href: "/todo", key: "nav_todo", icon: "checkSquare" },
  { href: "/settings", key: "nav_settings", icon: "settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, lang } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    location.href = "/login";
  }

  async function switchLang() {
    const next = lang === "en" ? "ar" : "en";
    await fetch("/api/lang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next }),
    });
    location.reload();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="glass sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-white/50 px-3 py-5 md:flex">
        <div className="px-3">
          <Link href="/dashboard" className="font-display text-2xl font-bold whitespace-nowrap">
            Haki <span className="text-primary">حكي</span>
          </Link>
          <p className="sub mt-1 text-xs leading-snug">{t("tagline")}</p>
        </div>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                isActive(item.href)
                  ? "bg-primary-soft font-medium text-primary-deep"
                  : "text-muted hover:bg-sand/60 hover:text-ink"
              }`}
            >
              <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line pt-3">
          <button onClick={switchLang} className="w-full rounded-xl px-3 py-2 text-start text-sm text-muted hover:text-ink">
            {t("lang_switch")}
          </button>
          <button onClick={signOut} className="w-full rounded-xl px-3 py-2 text-start text-sm text-muted hover:text-rose">
            {t("sign_out")}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile header */}
        <header className="glass sticky top-0 z-10 flex items-center justify-between border-b border-white/50 px-4 py-3 md:hidden">
          <Link href="/dashboard" className="font-display text-xl font-bold whitespace-nowrap">
            Haki <span className="text-primary">حكي</span>
          </Link>
          <div className="flex gap-2">
            <button className="icon-btn" onClick={switchLang} aria-label={t("nav_settings")}>
              <span className="text-sm font-medium">{lang === "en" ? "ع" : "EN"}</span>
            </button>
            <button className="icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="menu">
              <Icon name="menu" className="h-4 w-4" />
            </button>
          </div>
        </header>

        {menuOpen && (
          <nav className="border-b border-line bg-surface px-4 py-2 md:hidden">
            <div className="grid grid-cols-2 gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
                    isActive(item.href)
                      ? "bg-primary-soft font-medium text-primary-deep"
                      : "text-muted"
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {t(item.key)}
                </Link>
              ))}
              <button
                onClick={signOut}
                className="col-span-2 rounded-xl px-3 py-2.5 text-start text-sm text-rose"
              >
                {t("sign_out")}
              </button>
            </div>
          </nav>
        )}

        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
