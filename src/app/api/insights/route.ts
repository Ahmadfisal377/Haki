import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { checkLimit, getPlan, recordUsage } from "@/lib/limits";
import { getLang } from "@/lib/i18n/server";
import { llmComplete, isLlmConfigured, extractJson } from "@/lib/llm";
import { insightsMessages } from "@/lib/ai/prompts";
import type { Insight } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Communication Insights — text-based pattern observations only (PRD §5.3D).
 * Never scores love/loyalty; observations are tentative by prompt design.
 */
function fallbackInsights(lang: "en" | "ar"): Insight[] {
  return lang === "ar"
    ? [
        {
          title: "تبادل الكلام",
          text: "شوف مين اللي بدأ المواضيع أكتر في الحوار ده. لو حد بدأ أغلب الوقت، جرب تفتح الحوار الجاي بسؤال مفتوح.",
        },
        {
          title: "تبادل الأسئلة",
          text: "عُدّ الأسئلة اللي سألها كل واحد فيكم. التوازن بيخلي الاتنين يحسوا إنهم مسموعين — لو فيه اختلال، ادّي الطرف التاني مساحة أكتر يسأل.",
        },
        {
          title: "مواضيع مش متقفلة",
          text: "لو فيه موضوع بيظهر من غير ما يتقفل، ممكن يستاهل وقت هادي مخصوص ليه بدل إشارة سريعة.",
        },
      ]
    : [
        {
          title: "Turn-taking",
          text: "Look at who initiated more topics in this transcript. If one person did most of the starting, try opening the next conversation with an open-ended question.",
        },
        {
          title: "Question exchange",
          text: "Count the questions each of you asked. A balanced exchange usually leaves both people feeling heard — if it lopsided, give the other person more space to ask back.",
        },
        {
          title: "Unfinished threads",
          text: "If a topic keeps appearing without resolution, it might deserve a calm, dedicated moment rather than a passing mention.",
        },
      ];
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const transcript = String(body?.transcript ?? "").slice(0, 8000).trim();
  if (!transcript) {
    return NextResponse.json({ error: "Empty transcript" }, { status: 400 });
  }

  const plan = await getPlan(user.id);
  const usage = await checkLimit(user.id, "insight", plan);
  if (!usage.allowed) {
    return NextResponse.json({ error: "limit_reached", insights: [] }, { status: 429 });
  }

  const lang = await getLang();
  let insights: Insight[] = [];
  let fallback = false;

  if (!isLlmConfigured()) {
    fallback = true;
    insights = fallbackInsights(lang);
  } else {
    try {
      const raw = await llmComplete(insightsMessages(transcript, lang === "ar" ? "ar" : "en"), {
        temperature: 0.4,
        maxTokens: 600,
      });
      const parsed = extractJson<Insight[]>(raw);
      insights = Array.isArray(parsed)
        ? parsed
            .filter((i) => i && typeof i.text === "string")
            .slice(0, 3)
            .map((i) => ({
              title: typeof i.title === "string" ? i.title : "Observation",
              text: i.text.trim(),
            }))
        : [];
      if (!insights.length) {
        fallback = true;
        insights = fallbackInsights(lang);
      } else {
        await recordUsage(user.id, "insight");
      }
    } catch {
      fallback = true;
      insights = fallbackInsights(lang);
    }
  }

  return NextResponse.json({ insights, fallback });
}

