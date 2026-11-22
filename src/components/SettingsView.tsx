"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { Icon } from "@/components/Icon";
import { PremiumSection } from "@/components/PremiumSection";

export function SettingsView() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => setLlmConfigured(Boolean(j.llmConfigured)))
      .catch(() => setLlmConfigured(false));
  }, []);

  async function switchLang(next: "en" | "ar") {
    if (next === lang) return;
    await fetch("/api/lang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next }),
    });
    router.refresh();
    location.reload();
  }

  async function signOut() {
    await fetch("/auth/signout", { method: "POST" });
    location.href = "/login";
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">{t("set_title")}</h1>
      </header>

      <section className="card">
        <h2 className="h-section">{t("set_lang")}</h2>
        <p className="sub mt-1">{t("set_lang_sub")}</p>
        <div className="mt-3 flex gap-2">
          <button className={`chip ${lang === "en" ? "chip-on" : ""}`} onClick={() => switchLang("en")}>
            English
          </button>
          <button className={`chip ${lang === "ar" ? "chip-on" : ""}`} onClick={() => switchLang("ar")}>
            العربية
          </button>
        </div>
      </section>

      <PremiumSection />

      <section className="card">
        <h2 className="h-section">{t("set_export")}</h2>
        <p className="sub mt-1">{t("set_export_sub")}</p>
        <a className="btn-ghost mt-3" href="/api/export" download>
          <Icon name="download" className="h-4 w-4" />
          {t("set_export_btn")}
        </a>
      </section>

      <section className="card">
        <p className="sub">
          {llmConfigured === null ? (
            t("loading")
          ) : (
            <span className="inline-flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  llmConfigured ? "bg-emerald-500" : "bg-gold"
                }`}
              />
              {llmConfigured ? t("set_ai_on") : t("set_ai_off")}
            </span>
          )}
        </p>
        <p className="sub mt-2">{t("set_privacy")}</p>
        <p className="sub mt-2">{t("set_live_note")}</p>
      </section>

      <button className="btn-danger" onClick={signOut}>
        {t("sign_out")}
      </button>
    </div>
  );
}
