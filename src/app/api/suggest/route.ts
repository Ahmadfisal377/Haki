import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { checkLimit, getPlan, recordUsage } from "@/lib/limits";
import { getLang } from "@/lib/i18n/server";
import { llmComplete, isLlmConfigured, extractJson } from "@/lib/llm";
import {
  replySuggestionsMessages,
  rescueMessages,
} from "@/lib/ai/prompts";
import { SITUATIONS } from "@/lib/data/situations";
import type { Lang, Suggestion } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const REPLY_STYLES = [
  "empathetic",
  "romantic",
  "funny",
  "curious",
  "supportive",
  "calm",
  "apologetic",
  "natural",
] as const;

/** Offline starter suggestions when no LLM is configured. */
function fallbackSuggestions(mode: "reply" | "rescue", lang: Lang): Suggestion[] {
  const sit =
    mode === "rescue"
      ? SITUATIONS.find((s) => s.id === "nothing")!
      : SITUATIONS[Math.floor(Math.random() * SITUATIONS.length)]!;
  return sit.lines.map((line, i) => ({
    style: `${i + 1}`,
    text: line[lang],
  }));
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const mode: "reply" | "rescue" = body?.mode === "rescue" ? "rescue" : "reply";
  const context = String(body?.context ?? "").slice(0, 8000).trim();
  const style = REPLY_STYLES.includes(body?.style) ? body.style : null;

  if (!context) {
    return NextResponse.json({ error: "Empty context" }, { status: 400 });
  }

  const plan = await getPlan(user.id);
  const usage = await checkLimit(user.id, "suggestion", plan);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "limit_reached", suggestions: [] },
      { status: 429 },
    );
  }

  const lang: Lang = (await getLang()) === "ar" ? "ar" : "en";

  let suggestions: Suggestion[] = [];
  let fallback = false;

  if (!isLlmConfigured()) {
    fallback = true;
    suggestions = fallbackSuggestions(mode, lang);
  } else {
    try {
      const styles =
        mode === "rescue"
          ? ["open question", "continue topic", "related subject"]
          : style
            ? [style, style, style]
            : ["empathetic", "natural", "curious"];

      const messages =
        mode === "rescue"
          ? rescueMessages(context, lang)
          : replySuggestionsMessages(context, styles, lang);

      const raw = await llmComplete(messages, { temperature: 0.8, maxTokens: 600 });
      const parsed = extractJson<Suggestion[]>(raw);
      suggestions = Array.isArray(parsed)
        ? parsed
            .filter((s) => s && typeof s.text === "string" && s.text.trim())
            .slice(0, 3)
            .map((s) => ({
              style: typeof s.style === "string" ? s.style : "reply",
              text: s.text.trim(),
            }))
        : [];
      if (!suggestions.length) {
        fallback = true;
        suggestions = fallbackSuggestions(mode, lang);
      } else {
        await recordUsage(user.id, "suggestion");
      }
    } catch {
      fallback = true;
      suggestions = fallbackSuggestions(mode, lang);
    }
  }

  return NextResponse.json({ suggestions, fallback });
}

