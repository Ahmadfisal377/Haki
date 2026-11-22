"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { DictKey } from "@/lib/i18n/dict";
import type { PartnerProfile } from "@/lib/types";

const REL_OPTIONS: Array<{ value: string; key: DictKey }> = [
  { value: "dating", key: "rel_dating" },
  { value: "married", key: "rel_married" },
  { value: "engaged", key: "rel_engaged" },
  { value: "other", key: "rel_other" },
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

const STRESS: Array<{ value: string; key: DictKey; tip: { en: string; ar: string } }> = [
  { value: "space", key: "stress_space", tip: { en: "Needs time alone first. Offer to talk later instead of pushing.", ar: "محتاج وقت لوحده الأول. اعرض إنكم تتكلموا بعدين بدل ما تضغط." } },
  { value: "talk", key: "stress_talk", tip: { en: "Wants to talk it through right away. Ask, then listen without fixing.", ar: "عايز يتكلم فيها فوراً. اسأل وبعدين اسمع من غير ما تحل." } },
  { value: "comfort", key: "stress_comfort", tip: { en: "Wants closeness more than words. Sit nearby or hug before asking anything.", ar: "محتاج قرب أكتر من الكلام. اقعد جنبه أو احضنه قبل ما تسأل." } },
];

const LOVE: Array<{ value: string; key: DictKey; tip: { en: string; ar: string } }> = [
  { value: "words", key: "love_words", tip: { en: "Say it out loud. Short, specific compliments work well.", ar: "قولها بصوت عالي. مجاملات قصيرة ومحددة بتأثر." } },
  { value: "time", key: "love_time", tip: { en: "Give full attention. Phones away matters more than the activity.", ar: "اديله انتباهك كله. الموبايل بعيد أهم من النشاط نفسه." } },
  { value: "gifts", key: "love_gifts", tip: { en: "Small, thoughtful things that show you remembered.", ar: "حاجات صغيرة بتثبت إنك فاكر." } },
  { value: "acts", key: "love_acts", tip: { en: "Take something off their plate without being asked.", ar: "شيل عنه حاجة من غير ما يطلب." } },
  { value: "touch", key: "love_touch", tip: { en: "Hand-holding and hugs say a lot.", ar: "مسك الإيد والحضن بيقولوا كتير." } },
];

const ENERGY: Array<{ value: string; key: DictKey; tip: { en: string; ar: string } }> = [
  { value: "calm", key: "p_energy_calm", tip: { en: "Suggest cozy evenings and slow plans.", ar: "اقترح سهرات هادية وخطط مريحة." } },
  { value: "out", key: "p_energy_out", tip: { en: "Suggest outings. They recharge around people and places.", ar: "اقترح خروجات. بيشحن طاقته وسط الناس والأماكن." } },
];

const EMPTY: PartnerProfile = {
  partner_name: "",
  relationship_type: "",
  interests: [],
  stress_pref: "",
  love_pref: "",
  energy_pref: "",
  notes: "",
};

export function PartnerForm() {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<PartnerProfile>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/partner")
      .then((r) => r.json())
      .then((j) => {
        if (j.profile) setForm({ ...EMPTY, ...j.profile });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function set<K extends keyof PartnerProfile>(key: K, value: PartnerProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function toggleInterest(value: string) {
    const on = form.interests.includes(value as PartnerProfile["interests"][number]);
    set(
      "interests",
      on
        ? form.interests.filter((x) => x !== value)
        : ([...form.interests, value] as PartnerProfile["interests"]),
    );
  }

  async function save() {
    setSaving(true);
    await fetch("/api/partner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
  }

  const anyAnswer =
    form.partner_name || form.relationship_type || form.interests.length ||
    form.stress_pref || form.love_pref || form.energy_pref || form.notes;

  const summary = [...STRESS, ...LOVE, ...ENERGY].filter((o) =>
    [form.stress_pref, form.love_pref, form.energy_pref].includes(o.value),
  );

  if (!loaded) return <p className="sub">{t("loading")}</p>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">{t("partner_title")}</h1>
        <p className="sub mt-1">{t("partner_sub")}</p>
      </header>

      <div className="card space-y-5">
        <div>
          <label className="label">{t("partner_name")}</label>
          <input
            className="input"
            dir="auto"
            value={form.partner_name}
            onChange={(e) => set("partner_name", e.target.value)}
          />
        </div>

        <div>
          <label className="label">{t("partner_rel")}</label>
          <div className="flex flex-wrap gap-1.5">
            {REL_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`chip ${form.relationship_type === o.value ? "chip-on" : ""}`}
                onClick={() => set("relationship_type", o.value)}
              >
                {t(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t("partner_interests")}</label>
          <p className="sub mb-2 text-xs">{t("partner_interests_sub")}</p>
          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map((i) => (
              <button
                key={i.value}
                className={`chip ${form.interests.includes(i.value as never) ? "chip-on" : ""}`}
                onClick={() => toggleInterest(i.value)}
              >
                {lang === "ar" ? i.ar : i.en}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t("stress_q")}</label>
          <div className="flex flex-wrap gap-1.5">
            {STRESS.map((o) => (
              <button
                key={o.value}
                className={`chip ${form.stress_pref === o.value ? "chip-on" : ""}`}
                onClick={() => set("stress_pref", o.value)}
              >
                {t(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t("love_q")}</label>
          <div className="flex flex-wrap gap-1.5">
            {LOVE.map((o) => (
              <button
                key={o.value}
                className={`chip ${form.love_pref === o.value ? "chip-on" : ""}`}
                onClick={() => set("love_pref", o.value)}
              >
                {t(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t("energy_q")}</label>
          <div className="flex flex-wrap gap-1.5">
            {ENERGY.map((o) => (
              <button
                key={o.value}
                className={`chip ${form.energy_pref === o.value ? "chip-on" : ""}`}
                onClick={() => set("energy_pref", o.value)}
              >
                {t(o.key)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">{t("partner_notes")}</label>
          <textarea
            className="input min-h-20"
            dir="auto"
            placeholder={t("partner_notes_ph")}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? t("loading") : t("save")}
          </button>
          {saved && <span className="text-sm text-primary">✓ {t("partner_saved")}</span>}
        </div>
      </div>

      {anyAnswer ? (
        <section className="card">
          <h2 className="h-section">{t("partner_summary")}</h2>
          <ul className="mt-3 space-y-2">
            {summary.map((o) => (
              <li key={o.value} className="text-sm">
                <strong className="font-medium">{t(o.key)}</strong>
                <span className="text-muted"> — {o.tip[lang]}</span>
              </li>
            ))}
            {form.notes && (
              <li className="text-sm">
                <strong className="font-medium">{t("partner_notes")}</strong>
                <span className="text-muted"> — {form.notes}</span>
              </li>
            )}
          </ul>
        </section>
      ) : (
        <p className="sub">{t("partner_summary_empty")}</p>
      )}
    </div>
  );
}
