/**
 * Swappable LLM abstraction.
 *
 * Targets any OpenAI-compatible /chat/completions endpoint (OpenAI by default,
 * configurable via LLM_BASE_URL — e.g. OpenRouter, Groq, a local model).
 * When LLM_API_KEY is empty the app runs in placeholder mode: routes return
 * friendly canned responses instead of failing.
 *
 * Future: the Live Companion engines (Reply, Rescue, Insights, Voice Pattern)
 * plug in here as separate modules — see src/lib/ai/prompts.ts.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmOptions = {
  temperature?: number;
  maxTokens?: number;
  /** Stop generating at these sequences. */
  stop?: string[];
};

export function isLlmConfigured(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

export function llmBaseUrl(): string {
  return (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
}

export function llmModel(): string {
  return process.env.LLM_MODEL || "gpt-4o-mini";
}

/**
 * Streams assistant text deltas from an OpenAI-compatible endpoint.
 * Throws on network/HTTP errors — callers must fall back gracefully.
 */
export async function* llmStream(
  messages: ChatMessage[],
  opts: LlmOptions = {},
): AsyncGenerator<string> {
  if (!isLlmConfigured()) {
    throw new Error("LLM_NOT_CONFIGURED");
  }

  const res = await fetch(`${llmBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: llmModel(),
      messages,
      stream: true,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 700,
      ...(opts.stop ? { stop: opts.stop } : {}),
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM_HTTP_${res.status}: ${detail.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Parse SSE lines: "data: {...}" / "data: [DONE]".
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Ignore malformed keep-alive lines.
      }
    }
  }
}

/** Collects the full text from llmStream. */
export async function llmComplete(
  messages: ChatMessage[],
  opts: LlmOptions = {},
): Promise<string> {
  let out = "";
  for await (const delta of llmStream(messages, opts)) out += delta;
  return out;
}

/** Extracts the first JSON array/object found in an LLM response. */
export function extractJson<T = unknown>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  for (let end = candidate.length; end > start; end--) {
    const slice = candidate.slice(start, end);
    try {
      return JSON.parse(slice) as T;
    } catch {
      // keep shrinking
    }
  }
  return null;
}
