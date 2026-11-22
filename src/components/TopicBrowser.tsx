"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { TOPICS } from "@/lib/data/topics";
import { Icon } from "@/components/Icon";
import type { DictKey } from "@/lib/i18n/dict";
import type { Topic, TopicCategory } from "@/lib/types";

const CATS: Array<{ value: TopicCategory | "any"; key: DictKey }> = [
  { value: "any", key: "cat_any" },
  { value: "light", key: "cat_light" },
  { value: "medium", key: "cat_medium" },
  { value: "deep", key: "cat_deep" },
  { value: "flirty", key: "cat_flirty" },
];

export function TopicBrowser() {
  const { t, lang } = useI18n();
  const [category, setCategory] = useState<TopicCategory | "any">("any");
  const [order, setOrder] = useState<Topic[]>([]);
  const [pos, setPos] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [talked, setTalked] = useState<Set<string>>(new Set());
  const [interests, setInterests] = useState<string[]>([]);
  const [flash, setFlash] = useState("");

  // Interests come from the partner profile and bias the pool.
  useEffect(() => {
    fetch("/api/partner")
      .then((r) => r.json())
      .then((j) => setInterests(j.profile?.interests ?? []))
      .catch(() => undefined);
    fetch("/api/feedback?feature=talk")
      .then((r) => r.json())
      .then((j) => {
        const fb = j.feedback ?? [];
        setFavorites(new Set(fb.filter((x: { feedback_type: string }) => x.feedback_type === "favorite").map((x: { item_id: string }) => x.item_id)));
        setTalked(new Set(fb.filter((x: { feedback_type: string }) => x.feedback_type === "talked").map((x: { item_id: string }) => x.item_id)));
      })
      .catch(() => undefined);
  }, []);

  const current = order[pos];

  function reshuffle(cat: TopicCategory | "any") {
    setCategory(cat);
    const base = TOPICS.filter((x) => cat === "any" || x.category === cat);
    const weighted = [...base, ...base.filter((x) => x.tags.some((g) => interests.includes(g)))];
    for (let i = weighted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [weighted[i], weighted[j]] = [weighted[j]!, weighted[i]!];
    }
    // Dedupe while keeping the interest-weighted bias.
    const seen = new Set<string>();
    const unique = weighted.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
    setOrder(unique);
    setPos(0);
  }

  useEffect(() => {
    reshuffle("any");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interests.join(",")]);

  function nextTopic() {
    if (pos + 1 < order.length) {
      setPos(pos + 1);
    } else {
      reshuffle(category);
    }
  }

  function note(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2000);
  }

  async function toggleFeedback(type: "favorite" | "talked", topic: Topic) {
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feature: "talk", item_id: topic.id, feedback_type: type }),
    });
    if (!res.ok) return;
    const json = await res.json();
    const set = type === "favorite" ? favorites : talked;
    const next = new Set(set);
    json.on ? next.add(topic.id) : next.delete(topic.id);
    type === "favorite" ? setFavorites(next) : setTalked(next);
  }

  async function askLater(topic: Topic) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: lang === "ar" ? `أسأله/ا: ${topic.text[lang]}` : `Ask: ${topic.text[lang]}`,
      }),
    });
    note(t("talk_todo_done"));
  }

  const favTopics = TOPICS.filter((x) => favorites.has(x.id));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">{t("talk_title")}</h1>
        <p className="sub mt-1">{t("talk_sub")}</p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button
            key={c.value}
            className={`chip ${category === c.value ? "chip-on" : ""}`}
            onClick={() => reshuffle(c.value)}
          >
            {t(c.key)}
          </button>
        ))}
      </div>

      {interests.length > 0 && (
        <p className="sub text-xs">{t("talk_personal_note")}</p>
      )}

      {current && (
        <section className="card">
          <p className="font-display text-xl leading-snug">{current.text[lang]}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button className="btn" onClick={nextTopic}>
              {t("talk_another")}
            </button>
            <button
              className={`chip ${talked.has(current.id) ? "chip-on" : ""}`}
              onClick={() => toggleFeedback("talked", current)}
            >
              <Icon name="check" className="h-4 w-4" />
              {t("talk_talked")}
            </button>
            <button
              className={`chip ${favorites.has(current.id) ? "chip-on" : ""}`}
              onClick={() => toggleFeedback("favorite", current)}
              aria-label={favorites.has(current.id) ? t("talk_unfav") : t("talk_fav")}
            >
              <Icon name="heart" filled={favorites.has(current.id)} className="h-4 w-4" />
              {t("talk_fav")}
            </button>
            <button className="chip" onClick={() => askLater(current)}>
              <Icon name="clock" className="h-4 w-4" />
              {t("talk_todo")}
            </button>
          </div>
          {flash && <p className="mt-2 text-sm text-primary">{flash}</p>}
        </section>
      )}

      <section>
        <h2 className="h-section">{t("talk_favorites")}</h2>
        {favTopics.length === 0 ? (
          <p className="sub mt-1">{t("talk_favorites_empty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {favTopics.map((topic) => (
              <li key={topic.id} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3">
                <span className="text-[15px]">{topic.text[lang]}</span>
                <span className="flex shrink-0 gap-1.5">
                  <button
                    className="icon-btn"
                    onClick={() => askLater(topic)}
                    title={t("talk_todo")}
                  >
                    <Icon name="clock" className="h-4 w-4" />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => toggleFeedback("favorite", topic)}
                    title={t("talk_unfav")}
                  >
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
