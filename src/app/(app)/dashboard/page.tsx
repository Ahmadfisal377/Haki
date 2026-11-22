import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { getLang, makeT } from "@/lib/i18n/server";
import { TOPICS } from "@/lib/data/topics";
import { ACTIVITIES } from "@/lib/data/activities";
import type { DictKey } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

function dayIndex(): number {
  const day = Math.floor(Date.now() / 86_400_000);
  return day;
}

function pick<T>(pool: T[], salt: number): T {
  return pool[(((dayIndex() + salt) % pool.length) + pool.length) % pool.length]!;
}

export default async function DashboardPage() {
  const lang = await getLang();
  const t = makeT(lang);
  const user = await getUser();
  const supabase = await createClient();

  if (!user) return null;

  const [profileRes, partnerRes, tasksRes, memoriesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, timezone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("partner_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, due_at")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(4),
    supabase
      .from("memories")
      .select("id, content, category")
      .eq("user_id", user.id)
      .eq("confirmed", true)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const profile = profileRes.data;
  const partner = partnerRes.data;
  const tasks = tasksRes.data ?? [];
  const memories = memoriesRes.data ?? [];

  // Time-aware greeting (falls back to server time if no timezone set).
  let hour = new Date().getHours();
  try {
    const parts = new Intl.DateTimeFormat("en", {
      hour: "numeric",
      hour12: false,
      timeZone: profile?.timezone || undefined,
    }).format(new Date());
    hour = parseInt(parts, 10) % 24;
  } catch {
    // keep server hour
  }
  const greetKey: DictKey =
    hour < 12 ? "greet_morning" : hour < 18 ? "greet_afternoon" : "greet_evening";

  // Daily question leans toward the partner's interests.
  const interests: string[] = partner?.interests ?? [];
  const topicPool = TOPICS.filter((x) => !interests.length || x.tags.some((g) => interests.includes(g)));
  const dailyTopic = pick(topicPool.length ? topicPool : TOPICS, 0);
  const actPool = ACTIVITIES.filter((x) => !interests.length || x.tags.some((g) => interests.includes(g)));
  const dailyActivity = pick(actPool.length ? actPool : ACTIVITIES, 7);

  const name = profile?.display_name?.trim();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">
          {t(greetKey)}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="sub mt-1">{t("tagline")}</p>
      </header>

      {!partner && (
        <Link href="/partner" className="card block border-primary/40 bg-primary-soft transition hover:border-primary">
          <p className="font-medium text-primary-deep">{t("dash_partner_missing")}</p>
          <p className="mt-1 text-sm text-primary-deep/80 underline">{t("dash_partner_cta")} →</p>
        </Link>
      )}

      <section className="card">
        <p className="sub mb-1">{t("dash_daily_q")}</p>
        <p className="font-display text-xl leading-snug">{dailyTopic.text[lang]}</p>
        <p className="sub mt-2">{t("dash_daily_q_sub")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/chat" className="btn">
            {t("dash_open_chat")}
          </Link>
          <Link href="/talk" className="btn-ghost">
            {t("talk_another")}
          </Link>
        </div>
      </section>

      <section className="card">
        <p className="sub mb-1">{t("dash_activity")}</p>
        <p className="font-display text-lg leading-snug">{dailyActivity.text[lang]}</p>
        <Link href="/activities" className="sub mt-2 inline-block underline">
          {t("view_all")} →
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="h-section">{t("dash_tasks")}</h2>
            <Link href="/todo" className="sub underline">
              {t("view_all")}
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {tasks.length ? (
              tasks.map((task) => (
                <li key={task.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>
                    {task.title}
                    {task.due_at && (
                      <span className="ms-2 text-xs text-muted">
                        {new Date(task.due_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </span>
                </li>
              ))
            ) : (
              <li className="sub">{t("dash_empty_tasks")}</li>
            )}
          </ul>
        </section>

        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="h-section">{t("dash_memories")}</h2>
            <Link href="/memory" className="sub underline">
              {t("view_all")}
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {memories.length ? (
              memories.map((m) => (
                <li key={m.id} className="text-sm leading-snug">
                  {m.content}
                </li>
              ))
            ) : (
              <li className="sub">{t("dash_empty_memories")}</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
