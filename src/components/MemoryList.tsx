"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Icon } from "@/components/Icon";
import type { DictKey } from "@/lib/i18n/dict";
import type { Memory, MemoryCategory } from "@/lib/types";

const CATEGORIES: Array<{ value: MemoryCategory | "all"; key: DictKey }> = [
  { value: "all", key: "mem_all" },
  { value: "preference", key: "mem_preference" },
  { value: "date", key: "mem_date" },
  { value: "event", key: "mem_event" },
  { value: "conversation", key: "mem_conversation" },
  { value: "experience", key: "mem_experience" },
  { value: "note", key: "mem_note" },
  { value: "milestone", key: "mem_milestone" },
];

const CAT_KEYS: Record<MemoryCategory, DictKey> = {
  preference: "mem_preference",
  date: "mem_date",
  event: "mem_event",
  conversation: "mem_conversation",
  experience: "mem_experience",
  note: "mem_note",
  milestone: "mem_milestone",
};

export function MemoryList() {
  const { t } = useI18n();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<MemoryCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("note");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [flash, setFlash] = useState("");

  async function load() {
    const res = await fetch("/api/memory");
    if (res.ok) {
      const json = await res.json();
      setMemories(json.memories ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function note(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2000);
  }

  async function addMemory() {
    const content = newContent.trim();
    if (!content) return;
    setNewContent("");
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, category: newCategory, source: "user" }),
    });
    if (res.ok) {
      const json = await res.json();
      setMemories((m) => [json.memory, ...m]);
      note(t("mem_added"));
    }
  }

  async function saveEdit(id: string) {
    const content = editText.trim();
    if (!content) return;
    const res = await fetch(`/api/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const json = await res.json();
      setMemories((m) => m.map((x) => (x.id === id ? json.memory : x)));
    }
    setEditingId(null);
  }

  async function remove(id: string) {
    const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
    if (res.ok) setMemories((m) => m.filter((x) => x.id !== id));
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memories.filter(
      (m) =>
        (category === "all" || m.category === category) &&
        (!q || m.content.toLowerCase().includes(q)),
    );
  }, [memories, category, query]);

  const unconfirmed = memories.filter((m) => !m.confirmed);
  const confirmed = visible.filter((m) => m.confirmed);
  const visibleUnconfirmed = visible.filter((m) => !m.confirmed);

  if (loading) return <p className="sub">{t("loading")}</p>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">{t("mem_title")}</h1>
        <p className="sub mt-1">{t("mem_sub")}</p>
      </header>

      <div className="card space-y-3">
        <textarea
          className="input min-h-20"
          dir="auto"
          placeholder={t("mem_add_ph")}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addMemory();
          }}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.slice(1).map((c) => (
            <button
              key={c.value}
              className={`chip ${newCategory === c.value ? "chip-on" : ""}`}
              onClick={() => setNewCategory(c.value as MemoryCategory)}
            >
              {t(c.key)}
            </button>
          ))}
          <button className="btn ms-auto" onClick={addMemory} disabled={!newContent.trim()}>
            {t("add")}
          </button>
        </div>
      </div>

      <input
        className="input"
        type="search"
        placeholder={t("mem_search_ph")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`chip ${category === c.value ? "chip-on" : ""}`}
            onClick={() => setCategory(c.value)}
          >
            {t(c.key)}
          </button>
        ))}
      </div>

      {flash && <p className="text-sm text-primary">{flash}</p>}

      {visibleUnconfirmed.length > 0 && (
        <section className="rounded-2xl border border-rose/40 bg-rose-soft p-4">
          <p className="text-sm font-medium">{t("mem_confirm_needed")}</p>
          <ul className="mt-2 space-y-2">
            {visibleUnconfirmed.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface p-3">
                <span className="text-sm" dir="auto">
                  {m.content}
                </span>
                <span className="flex shrink-0 gap-1.5">
                  <button
                    className="btn px-2.5 py-1 text-xs"
                    onClick={async () => {
                      const res = await fetch(`/api/memory/${m.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ confirmed: true }),
                      });
                      if (res.ok) setMemories((prev) => prev.map((x) => (x.id === m.id ? { ...x, confirmed: true } : x)));
                    }}
                  >
                    {t("save")}
                  </button>
                  <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => remove(m.id)}>
                    {t("delete")}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ul className="space-y-2">
        {confirmed.length === 0 && <li className="sub">{t("mem_empty")}</li>}
        {confirmed.map((m) => (
          <li key={m.id} className="card flex items-start justify-between gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="sub text-xs">{t(CAT_KEYS[m.category])}</p>
              {editingId === m.id ? (
                <div className="mt-1 flex gap-2">
                  <input
                    className="input"
                    dir="auto"
                    value={editText}
                    autoFocus
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(m.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button className="btn px-3 py-1 text-xs" onClick={() => saveEdit(m.id)}>
                    {t("save")}
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-[15px] leading-relaxed" dir="auto">
                  {m.content}
                </p>
              )}
            </div>
            <span className="flex shrink-0 gap-1.5">
              <button
                className="icon-btn"
                title={t("edit")}
                onClick={() => {
                  setEditingId(m.id);
                  setEditText(m.content);
                }}
              >
                <Icon name="pencil" className="h-4 w-4" />
              </button>
              <button className="icon-btn" title={t("delete")} onClick={() => remove(m.id)}>
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
