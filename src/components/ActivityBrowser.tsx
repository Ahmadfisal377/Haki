"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { ACTIVITIES } from "@/lib/data/activities";
import { Icon } from "@/components/Icon";
import type { DictKey } from "@/lib/i18n/dict";
import type { Activity } from "@/lib/types";

type CostFilter = "any" | "free" | "low" | "mid";
type EnergyFilter = "any" | "calm" | "active";

const COSTS: Array<{ value: CostFilter; key: DictKey }> = [
  { value: "any", key: "cost_any" },
  { value: "free", key: "cost_free" },
  { value: "low", key: "cost_low" },
  { value: "mid", key: "cost_mid" },
];
const ENERGIES: Array<{ value: EnergyFilter; key: DictKey }> = [
  { value: "any", key: "energy_any" },
  { value: "calm", key: "energy_calm" },
  { value: "active", key: "energy_active" },
];

const INTERESTS: Array<{ value: string; en: string; ar: string }> = [
  { value: "humor", en: "Humor", ar: "كوميديا" },
  { value: "food", en: "Food", ar: "أكل" },
  { value: "music", en: "Music", ar: "موسيقى" },
  { value: "travel", en: "Travel", ar: "سفر" },
  { value: "movies", en: "Movies & shows", ar: "أفلام ومسلسلات" },
  { value: "fitness", en: "Fitness", ar: "رياضة" },
  { value: "family", en: "Family", ar: "عائلة" },
  { value: "faith", en: "Faith", ar: "إيمان" },
  { value: "tech", en: "Tech", ar: "تكنولوجيا" },
  { value: "fashion", en: "Fashion", ar: "موضة" },
  { value: "growth", en: "Self-growth", ar: "تطوير الذات" },
];

export function ActivityBrowser() {
  const { t, lang } = useI18n();
  const [cost, setCost] = useState<CostFilter>("any");
  const [energy, setEnergy] = useState<EnergyFilter>("any");
  const [tags, setTags] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState("");

  useEffect(() => {
    fetch("/api/feedback?feature=activities&feedback_type=favorite")
      .then((r) => r.json())
      .then((j) =>
        setFavorites(
          new Set((j.feedback ?? []).map((x: { item_id: string }) => x.item_id)),
        ),
      )
      .catch(() => undefined);
  }, []);

  const filtered = ACTIVITIES.filter(
    (a) =>
      (cost === "any" || a.cost === cost) &&
      (energy === "any" || a.energy === energy) &&
      (tags.length === 0 || a.tags.some((g) => tags.includes(g))),
  );

  function note(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2000);
  }

  async function toggleFavorite(a: Activity) {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: "activities", item_id: a.id, feedback_type: "favorite" }),
    });
    if (!res.ok) return;
    const json = await res.json();
    const next = new Set(favorites);
    json.on ? next.add(a.id) : next.delete(a.id);
    setFavorites(next);
  }

  async function addTodo(a: Activity) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: a.text[lang] }),
    });
    note(t("act_todo_done"));
  }

  const favActivities = ACTIVITIES.filter((x) => favorites.has(x.id));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">{t("act_title")}</h1>
        <p className="sub mt-1">{t("act_sub")}</p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {COSTS.map((c) => (
          <button key={c.value} className={`chip ${cost === c.value ? "chip-on" : ""}`} onClick={() => setCost(c.value)}>
            {t(c.key)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ENERGIES.map((c) => (
          <button key={c.value} className={`chip ${energy === c.value ? "chip-on" : ""}`} onClick={() => setEnergy(c.value)}>
            {t(c.key)}
          </button>
        ))}
      </div>

      <div>
        <p className="label">{t("act_interests")}</p>
        <div className="flex flex-wrap gap-1.5">
          {INTERESTS.map((i) => {
            const on = tags.includes(i.value);
            return (
              <button
                key={i.value}
                className={`chip ${on ? "chip-on" : ""}`}
                onClick={() =>
                  setTags(on ? tags.filter((x) => x !== i.value) : [...tags, i.value])
                }
              >
                {lang === "ar" ? i.ar : i.en}
              </button>
            );
          })}
        </div>
      </div>

      {flash && <p className="text-sm text-primary">{flash}</p>}

      <ul className="space-y-2">
        {filtered.length === 0 && <li className="sub">{t("mem_empty")}</li>}
        {filtered.map((a) => (
          <li key={a.id} className="card flex items-start justify-between gap-3 p-4">
            <p className="text-[15px] leading-snug">{a.text[lang]}</p>
            <span className="flex shrink-0 gap-1.5">
              <button className="icon-btn" onClick={() => addTodo(a)} title={t("act_todo")}>
                <Icon name="clock" className="h-4 w-4" />
              </button>
              <button
                className="icon-btn"
                onClick={() => toggleFavorite(a)}
                title={favorites.has(a.id) ? t("act_unfav") : t("act_fav")}
              >
                <Icon name="heart" filled={favorites.has(a.id)} className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>

      <section>
        <h2 className="h-section">{t("act_favorites")}</h2>
        {favActivities.length === 0 ? (
          <p className="sub mt-1">{t("act_favorites_empty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {favActivities.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3">
                <span className="text-[15px]">{a.text[lang]}</span>
                <span className="flex shrink-0 gap-1.5">
                  <button className="icon-btn" onClick={() => addTodo(a)} title={t("act_todo")}>
                    <Icon name="clock" className="h-4 w-4" />
                  </button>
                  <button className="icon-btn" onClick={() => toggleFavorite(a)} title={t("act_unfav")}>
                    <Icon name="heart" filled className="h-4 w-4 text-primary" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
