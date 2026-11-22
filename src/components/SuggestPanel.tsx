"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Icon } from "@/components/Icon";
import type { DictKey } from "@/lib/i18n/dict";
import type { Insight, Suggestion } from "@/lib/types";

type Tab = "replies" | "rescue" | "insights";

const STYLE_KEYS: Array<{ value: string; key: DictKey }> = [
  { value: "empathetic", key: "style_empathetic" },
  { value: "romantic", key: "style_romantic" },
  { value: "funny", key: "style_funny" },
  { value: "curious", key: "style_curious" },
  { value: "supportive", key: "style_supportive" },
  { value: "calm", key: "style_calm" },
  { value: "apologetic", key: "style_apologetic" },
  { value: "natural", key: "style_natural" },
];

/**
 * Live Companion panel — text-based MVP (PRD §5).
 * Smart Replies + Conversation Rescue + text-based Communication Insights.
 * Architecturally: same engines later serve the in-call experience, fed by
 * transcription instead of pasted text — the audio source stays separate.
 */
export function SuggestPanel({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("replies");
  const [context, setContext] = useState("");
  const [style, setStyle] = useState("natural");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [fallback, setFallback] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, "like" | "dislike">>({});

  async function run(mode: "reply" | "rescue" | "insight") {
    if (!context.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "insight") {
        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: context }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(res.status === 429 ? t("comp_limit_reached") : t("comp_error"));
        } else {
          setInsights(json.insights);
          setFallback(Boolean(json.fallback));
        }
      } else {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, context, style }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(res.status === 429 ? t("comp_limit_reached") : t("comp_error"));
        } else {
          setSuggestions(json.suggestions);
          setFallback(Boolean(json.fallback));
        }
      }
    } catch {
      setError(t("comp_error"));
    } finally {
      setBusy(false);
    }
  }

  function copy(s: Suggestion) {
    navigator.clipboard
      .writeText(s.text)
      .then(() => {
        setCopied(s.text);
        setTimeout(() => setCopied(null), 1500);
      })
      .catch(() => {
        // Copy may be blocked; user can select text manually.
      });
    void vote(s, "used");
  }

  async function vote(s: Suggestion, feedbackType: "like" | "dislike" | "used") {
    const key = s.text.slice(0, 60);
    const next = { ...voted };
    if (feedbackType === "like" || feedbackType === "dislike") next[key] = feedbackType;
    setVoted(next);
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature: "suggest",
        item_id: key,
        feedback_type: feedbackType,
      }),
    }).catch(() => undefined);
  }

  return (
    <div className="card border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="h-section">{t("comp_title")}</h2>
          <p className="sub mt-0.5">{t("comp_sub")}</p>
        </div>
        <button className="icon-btn shrink-0" onClick={onClose} aria-label={t("cancel")}>
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {(
          [
            ["replies", "comp_tab_replies"],
            ["rescue", "comp_tab_rescue"],
            ["insights", "comp_tab_insights"],
          ] as Array<[Tab, DictKey]>
        ).map(([value, key]) => (
          <button
            key={value}
            className={`chip ${tab === value ? "chip-on" : ""}`}
            onClick={() => {
              setTab(value);
              setSuggestions(null);
              setInsights(null);
              setError("");
            }}
          >
            {t(key)}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="label">{t("comp_context_label")}</label>
        <textarea
          className="input min-h-28"
          dir="auto"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={t("comp_context_ph")}
        />
      </div>

      {tab === "replies" && (
        <div className="mt-3">
          <label className="label">{t("comp_style_label")}</label>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_KEYS.map((s) => (
              <button
                key={s.value}
                className={`chip ${style === s.value ? "chip-on" : ""}`}
                onClick={() => setStyle(s.value)}
              >
                {t(s.key)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        {tab === "replies" && (
          <button className="btn" disabled={busy || !context.trim()} onClick={() => run("reply")}>
            {busy ? t("loading") : t("comp_get_replies")}
          </button>
        )}
        {tab === "rescue" && (
          <button className="btn" disabled={busy || !context.trim()} onClick={() => run("rescue")}>
            {busy ? t("loading") : t("comp_get_rescue")}
          </button>
        )}
        {tab === "insights" && (
          <button className="btn" disabled={busy || !context.trim()} onClick={() => run("insight")}>
            {busy ? t("loading") : t("comp_insights_get")}
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-rose">{error}</p>}
      {fallback && !error && (
        <p className="sub mt-3 text-xs">{t("comp_fallback_note")}</p>
      )}

      {tab !== "insights" && suggestions && suggestions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {suggestions.map((s) => (
            <li key={s.text} className="rounded-xl border border-line bg-sand/60 p-3">
              {s.style && s.style.length <= 20 && (
                <p className="sub mb-1 text-xs font-medium uppercase tracking-wide">
                  {s.style}
                </p>
              )}
              <p className="text-[15px] leading-relaxed" dir="auto">
                {s.text}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button className="btn-ghost small px-2.5 py-1 text-xs" onClick={() => copy(s)}>
                  {copied === s.text ? t("comp_copied") : t("comp_copy")}
                </button>
                {voted[s.text.slice(0, 60)] ? (
                  <span className="sub text-xs">{t("comp_thanks")}</span>
                ) : (
                  <>
                    <button
                      className="icon-btn h-7 w-7"
                      aria-label={t("comp_like")}
                      onClick={() => vote(s, "like")}
                    >
                      <Icon name="thumbsUp" className="h-4 w-4" />
                    </button>
                    <button
                      className="icon-btn h-7 w-7"
                      aria-label={t("comp_dislike")}
                      onClick={() => vote(s, "dislike")}
                    >
                      <Icon name="thumbsDown" className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "insights" && insights && insights.length > 0 && (
        <>
          <p className="mt-4 rounded-xl bg-rose-soft p-3 text-xs text-ink/80">
            {t("comp_insights_note")}
          </p>
          <ul className="mt-3 space-y-2">
            {insights.map((i) => (
              <li key={i.title} className="rounded-xl border border-line bg-sand/60 p-3">
                <p className="text-sm font-semibold">{i.title}</p>
                <p className="mt-1 text-sm leading-relaxed" dir="auto">
                  {i.text}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
