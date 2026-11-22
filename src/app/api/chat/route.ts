import { NextResponse, type NextRequest } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";
import { checkLimit, getPlan, recordUsage } from "@/lib/limits";
import { getLang, makeT } from "@/lib/i18n/server";
import { llmStream, llmComplete, isLlmConfigured, extractJson, type ChatMessage } from "@/lib/llm";
import {
  chatSystemPrompt,
  memoryExtractionMessages,
} from "@/lib/ai/prompts";
import type { SuggestedMemory } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Body = { conversationId?: string; message: string };

function sse(event: Record<string, unknown>) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const lang = await getLang();
  const t = makeT(lang);
  const supabase = await createClient();
  const plan = await getPlan(user.id);

  const usage = await checkLimit(user.id, "chat_message", plan);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "limit_reached", message: t("chat_limit_reached") },
      { status: 429 },
    );
  }

  // Resolve or create the conversation.
  let conversationId = body?.conversationId;
  if (conversationId) {
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();
    if (!conv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } else {
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: message.slice(0, 60) })
      .select("id")
      .single();
    if (error || !conv) {
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
    conversationId = conv.id;
  }

  // Persist the user message.
  await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role: "user", content: message });

  // Build context: partner profile, confirmed memories, recent history.
  const [{ data: profile }, { data: memories }, { data: history }] =
    await Promise.all([
      supabase
        .from("partner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("memories")
        .select("*")
        .eq("user_id", user.id)
        .eq("confirmed", true)
        .order("updated_at", { ascending: false })
        .limit(12),
      supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const recent: ChatMessage[] = (history ?? [])
    .reverse()
    .map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const systemPrompt = chatSystemPrompt(lang, profile, memories ?? []);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      const send = (s: string) => controller.enqueue(encoder.encode(s));

      send(sse({ type: "start", conversationId }));

      if (!isLlmConfigured()) {
        full =
          lang === "ar"
            ? "أنا شغال بوضع تجريبي دلوقتي — مفيش موديل متوصل لسه. كل حاجة تانية في حكي شغالة، وأول ما تضيف LLM_API_KEY هبقى موجود بجد. في الأثناء، جرب تبويب الحوار! 💛"
            : "I'm running in placeholder mode — no language model is connected yet. Everything else in Haki works, and once an LLM_API_KEY is added I'll be fully here. In the meantime, try the Talk tab! 💛";
        send(sse({ type: "delta", text: full }));
      } else {
        try {
          for await (const delta of llmStream([
            { role: "system", content: systemPrompt },
            ...recent,
          ])) {
            full += delta;
            send(sse({ type: "delta", text: delta }));
          }
        } catch {
          const fallback =
            lang === "ar"
              ? "معلش، حصلت مشكلة في التوليد. جرب تاني."
              : "Sorry — something went wrong generating a response. Please try again.";
          full = full || fallback;
          send(sse({ type: "delta", text: fallback }));
        }
      }

      // Memory extraction pass (separate engine, PRD §10).
      let suggested: SuggestedMemory[] = [];
      if (isLlmConfigured() && full) {
        try {
          const raw = await llmComplete(memoryExtractionMessages(message, full), {
            temperature: 0.1,
            maxTokens: 500,
          });
          const parsed = extractJson<SuggestedMemory[]>(raw);
          if (Array.isArray(parsed)) {
            suggested = parsed
              .filter(
                (m) =>
                  m &&
                  typeof m.content === "string" &&
                  m.content.trim().length > 3,
              )
              .slice(0, 4)
              .map((m) => ({
                category:
                  ([
                    "preference",
                    "date",
                    "event",
                    "conversation",
                    "experience",
                    "note",
                    "milestone",
                  ] as const).includes(m.category)
                    ? m.category
                    : "note",
                content: m.content.trim(),
                confidence: typeof m.confidence === "number" ? m.confidence : 0.7,
              }));
          }
        } catch {
          // Extraction is best-effort.
        }
      }

      // Persist the assistant reply and update state.
      await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: full,
        });
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
      await recordUsage(user.id, "chat_message");
      const post = await checkLimit(user.id, "chat_message", plan);

      send(
        sse({
          type: "done",
          conversationId,
          memories: suggested,
          usage: { used: post.used, limit: post.limit },
        }),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
