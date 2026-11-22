import type { ChatMessage } from "@/lib/llm";
import type { Lang, Memory, PartnerProfile } from "@/lib/types";

/**
 * Prompt builders for the independent AI engines (PRD §10):
 * Core chat, Memory extraction, Reply engine, Conversation Flow engine
 * (rescue), and Communication Insights engine. Each stays swappable.
 */

const RELATIONSHIP_VALUES = `You are Haki, a warm, empathetic, non-judgmental friend helping someone with their romantic relationship.
- Listen first, advise second. Ask a clarifying question when the situation is unclear.
- Never judge the user or their partner. Never claim to know the partner's intentions, feelings, or thoughts with certainty.
- Avoid unsupported assumptions; if you're inferring, say so tentatively ("it might be that...").
- Encourage healthy communication: expressing needs, listening, small consistent gestures.
- Keep responses conversational and human — short paragraphs, no lists unless asked, no markdown headers.
- Do not diagnose, pathologize, or use therapy-speak.
- If the user shares facts about their partner (preferences, dates, events), acknowledge them naturally using the memory context when relevant.`;

export function chatSystemPrompt(
  lang: Lang,
  profile?: PartnerProfile | null,
  memories?: Memory[],
): string {
  const parts: string[] = [RELATIONSHIP_VALUES];

  parts.push(
    lang === "ar"
      ? "Always reply in Arabic (Egyptian-friendly but understandable everywhere)."
      : "Always reply in English.",
  );

  if (profile && (profile.partner_name || profile.interests.length)) {
    const interests = profile.interests.join(", ");
    const extras = [
      profile.stress_pref && `under stress prefers: ${profile.stress_pref}`,
      profile.love_pref && `feels loved through: ${profile.love_pref}`,
      profile.energy_pref && `ideal evening: ${profile.energy_pref}`,
    ]
      .filter(Boolean)
      .join("; ");
    parts.push(
      `The user's partner is ${profile.partner_name || "unnamed"}` +
        (profile.relationship_type ? ` (${profile.relationship_type})` : "") +
        (interests ? `, interested in: ${interests}` : "") +
        (extras ? `. Notes: ${extras}` : "") +
        ".",
    );
  }

  if (memories && memories.length) {
    const lines = memories
      .slice(0, 12)
      .map((m) => `- ${m.content}`)
      .join("\n");
    parts.push(
      `Things the user previously saved about their relationship (treat as things the user told you; don't claim independent knowledge):\n${lines}`,
    );
  }

  return parts.join("\n\n");
}

export function memoryExtractionMessages(
  lastUserMessage: string,
  lastAssistantMessage: string,
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You extract relationship facts worth remembering from a conversation between a user and their AI companion.
Return a JSON array; each item: {"category": one of "preference"|"date"|"event"|"conversation"|"experience"|"note"|"milestone", "content": short third-person-neutral fact as stated by the user, "confidence": 0..1}.
Rules:
- Only extract clear facts the user stated (preferences, important dates, events, plans, notable moments).
- Rewrite in compact phrasing, e.g. "Partner's sister has an exam on March 12".
- No advice, no speculation, no duplicates. If nothing clear, return [].
- Keep the user's language: if the conversation is Arabic, write content in Arabic; if English, in English.
Return ONLY the JSON array, no prose.`,
    },
    {
      role: "user",
      content: `User said:\n${lastUserMessage}\n\nAssistant replied:\n${lastAssistantMessage.slice(0, 1200)}`,
    },
  ];
}

export function replySuggestionsMessages(
  context: string,
  styles: string[],
  lang: Lang,
  profile?: PartnerProfile | null,
): ChatMessage[] {
  const system = `You help someone reply in a text conversation with their romantic partner.
Write ${styles.length} suggested replies, one per requested tone, in this order: ${styles.join(", ")}.
Each reply: 1–2 short sentences, natural texting language (emojis ok if it fits the tone), something a real person would send.
${lang === "ar" ? "Write the replies in Arabic (Egyptian-friendly)." : "Write the replies in English."}
${profile?.partner_name ? `The partner's name is ${profile.partner_name}.` : ""}
${profile?.love_pref ? `The partner feels loved through: ${profile.love_pref}.` : ""}
Safety: suggestions must be honest and kind — never manipulative, never pressure, never tell the user to pretend.
Return ONLY a JSON array: [{"style": "<tone>", "text": "<reply>"}]`;
  return [
    { role: "system", content: system },
    { role: "user", content: `Conversation so far:\n${context}` },
  ];
}

export function rescueMessages(context: string, lang: Lang): ChatMessage[] {
  const system = `The conversation between the user and their partner has slowed down (pauses, short exchanges, or a topic that finished).
Suggest 3 ways to continue, mixing: an open-ended question, continuing the previous topic with a twist, and a light related subject or small shared activity.
Important: silence is not automatically boredom, conflict, or disinterest — never pressure the user to keep talking; make the suggestions low-stakes and easy to send or skip.
${lang === "ar" ? "Write in Arabic (Egyptian-friendly)." : "Write in English."}
Return ONLY a JSON array: [{"style": "<short label of the kind of move>", "text": "<suggested message>"}]`;
  return [
    { role: "system", content: system },
    { role: "user", content: `Conversation so far:\n${context}` },
  ];
}

export function insightsMessages(transcript: string, lang: Lang): ChatMessage[] {
  const system = `You analyze observable conversation patterns between two people: turn-taking, question exchange, participation balance, topic changes, repeated unresolved topics, response length shifts.
Produce 2–3 tentative observations. Each: {"title": "<short label>", "text": "<observation phrased tentatively, plus one gentle suggestion>"}.
Hard rules:
- No love score, loyalty score, attraction score, or partner-quality score.
- No claims about who is right, who loves whom, or anyone's intentions.
- Never claim to detect lying, anger, love, or attachment with certainty.
- Phrase as tentative observations ("It looked like...", "You could try...").
${lang === "ar" ? "Write in Arabic (Egyptian-friendly)." : "Write in English."}
Return ONLY the JSON array.`;
  return [
    { role: "system", content: system },
    { role: "user", content: `Transcript:\n${transcript.slice(0, 8000)}` },
  ];
}
