import { NextResponse } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Full data export (PRD §4.6: "Users can export their information"). */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const [partner, conversations, memories, tasks, activities, feedback] =
    await Promise.all([
      supabase.from("partner_profiles").select("*").eq("user_id", user.id),
      supabase.from("conversations").select("*").eq("user_id", user.id),
      supabase.from("memories").select("*").eq("user_id", user.id),
      supabase.from("tasks").select("*").eq("user_id", user.id),
      supabase.from("activities").select("*").eq("user_id", user.id),
      supabase.from("user_feedback").select("*").eq("user_id", user.id),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    partner_profiles: partner.data ?? [],
    conversations: conversations.data ?? [],
    memories: memories.data ?? [],
    tasks: tasks.data ?? [],
    activities: activities.data ?? [],
    user_feedback: feedback.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="haki-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}

