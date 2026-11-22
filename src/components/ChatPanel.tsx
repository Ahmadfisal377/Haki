"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { SuggestPanel } from "@/components/SuggestPanel";
import { Icon } from "@/components/Icon";
import type { Conversation, SuggestedMemory } from "@/lib/types";

type Msg = { role: "user" | "assistant"; content: string };
type Usage = { used: number; limit: number } | null;

const MEMORY_CATEGORIES: SuggestedMemory["category"][] = [
  "preference",
  "date",
  "event",
  "conversation",
  "experience",
  "note",
  "milestone",
];

export function ChatPanel() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [usage, setUsage] = useState<Usage>(null);
  const [suggested, setSuggested] = useState<SuggestedMemory[]>([]);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) {
      const json = await res.json();
      setConversations(json.conversations ?? []);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => setLlmConfigured(Boolean(j.llmConfigured)))
      .catch(() => setLlmConfigured(false));
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openConversation(id: string) {
    if (sending) return;
    setError("");
    setSuggested([]);
    setActiveId(id);
    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) {
      const json = await res.json();
      setMessages(
        (json.messages ?? []).map((m: Msg) => ({ role: m.role, content: m.content })),
      );
    }
  }

  function newChat() {
    if (sending) return;
    setActiveId(null);
    setMessages([]);
    setSuggested([]);
    setError("");
  }

  async function deleteConversation(id: string) {
    if (!confirm(t("chat_delete_confirm"))) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeId === id) newChat();
    loadConversations();
  }

  async function saveMemory(m: SuggestedMemory) {
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: m.content,
        category: MEMORY_CATEGORIES.includes(m.category) ? m.category : "note",
        source: "chat",
      }),
    });
    setSuggested((prev) => prev.filter((x) => x !== m));
  }

  function send() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setError("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    const controller = new AbortController();
    abortRef.current = controller;

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, message }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 429) {
          const json = await res.json();
          setError(json.message ?? t("chat_limit_reached"));
          setSending(false);
          return;
        }
        if (!res.ok || !res.body) {
          setError(t("chat_error"));
          setSending(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const applyDelta = (text: string) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant") {
              return [...prev.slice(0, -1), { role: "assistant", content: last.content + text }];
            }
            return [...prev, { role: "assistant", content: text }];
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data:")) continue;
            let evt: Record<string, unknown>;
            try {
              evt = JSON.parse(line.slice(5));
            } catch {
              continue;
            }
            if (evt.type === "start" && typeof evt.conversationId === "string") {
              setActiveId(evt.conversationId);
            } else if (evt.type === "delta" && typeof evt.text === "string") {
              applyDelta(evt.text);
            } else if (evt.type === "done") {
              if (Array.isArray(evt.memories)) {
                setSuggested(evt.memories as SuggestedMemory[]);
              }
              if (evt.usage && typeof evt.usage === "object") {
                setUsage(evt.usage as Usage);
              }
              loadConversations();
            }
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(t("chat_error"));
      })
      .finally(() => {
        setSending(false);
        abortRef.current = null;
      });
  }

  function stop() {
    abortRef.current?.abort();
    setSending(false);
  }

  const usageLabel =
    usage && usage.limit !== Infinity
      ? t("chat_usage", { used: usage.used, limit: usage.limit })
      : null;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("nav_chat")}</h1>
          {usageLabel && <p className="sub mt-1">{usageLabel}</p>}
        </div>
        <button className="btn" onClick={() => setCompanionOpen((v) => !v)}>
          {t("chat_companion")}
        </button>
      </header>

      {companionOpen && <SuggestPanel onClose={() => setCompanionOpen(false)} />}

      {llmConfigured === false && (
        <p className="rounded-xl bg-rose-soft p-3 text-sm text-ink/80">{t("chat_ai_off")}</p>
      )}

      <div className="flex gap-3">
        {/* Conversation list */}
        <aside className="w-52 shrink-0 hidden sm:block">
          <button className="btn-ghost mb-3 w-full" onClick={newChat}>
            <Icon name="plus" className="h-4 w-4" />
            {t("chat_new")}
          </button>
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c.id} className="group flex items-center">
                <button
                  onClick={() => openConversation(c.id)}
                  className={`min-w-0 flex-1 truncate rounded-lg px-2.5 py-2 text-start text-sm ${
                    activeId === c.id
                      ? "bg-primary-soft font-medium text-primary-deep"
                      : "text-muted hover:bg-sand/60 hover:text-ink"
                  }`}
                  title={c.title}
                >
                  {c.title}
                </button>
                <button
                  className="ms-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => deleteConversation(c.id)}
                  aria-label={t("delete")}
                  title={t("delete")}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Conversation view */}
        <section className="min-w-0 flex-1">
          <div className="card min-h-[50vh] space-y-3">
            {messages.length === 0 && (
              <div className="py-10 text-center">
                <p className="font-display text-xl">{t("chat_empty_title")}</p>
                <p className="sub mx-auto mt-2 max-w-sm">{t("chat_empty_sub")}</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ms-auto max-w-[85%] rounded-2xl rounded-ee-md bg-primary px-4 py-2.5 text-[15px] text-white"
                    : "me-auto max-w-[85%] rounded-2xl rounded-es-md border border-line bg-sand/60 px-4 py-2.5 text-[15px]"
                }
                dir="auto"
              >
                {m.content}
              </div>
            ))}
            {sending && <p className="sub animate-pulse">…</p>}
            <div ref={bottomRef} />
          </div>

          {suggested.length > 0 && (
            <div className="card mt-3 border-rose/40 bg-rose-soft">
              <p className="text-sm font-medium">{t("chat_confirm_memories")}</p>
              <ul className="mt-2 space-y-2">
                {suggested.map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-xl bg-surface p-3">
                    <span className="text-sm" dir="auto">
                      {m.content}
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <button className="btn px-2.5 py-1 text-xs" onClick={() => saveMemory(m)}>
                        {t("chat_save")}
                      </button>
                      <button
                        className="btn-ghost px-2.5 py-1 text-xs"
                        onClick={() => setSuggested((prev) => prev.filter((x) => x !== m))}
                      >
                        {t("chat_dismiss")}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-rose">{error}</p>}

          <div className="mt-3 flex items-end gap-2">
            <button className="btn-ghost sm:hidden" onClick={newChat} title={t("chat_new")}>
              <Icon name="plus" className="h-4 w-4" />
            </button>
            <textarea
              className="input min-h-12"
              dir="auto"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={t("chat_placeholder")}
              rows={1}
            />
            {sending ? (
              <button className="btn" onClick={stop} aria-label="stop">
                <Icon name="stop" className="h-4 w-4" />
              </button>
            ) : (
              <button className="btn" onClick={send} disabled={!input.trim()}>
                {t("chat_send")}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
