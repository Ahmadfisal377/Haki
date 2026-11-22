import { NextResponse, type NextRequest } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPES = ["favorite", "talked", "like", "dislike", "dismiss"] as const;

/** Feedback on AI suggestions + favorites + "we talked about it". */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const feature = String(body?.feature ?? "").slice(0, 40);
  const feedbackType = body?.feedback_type;
  if (!feature || !TYPES.includes(feedbackType)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const supabase = await createClient();
  const itemId = body?.item_id ? String(body.item_id).slice(0, 120) : null;

  // Favorites and "talked" are toggles: second submission removes the first.
  if (feedbackType === "favorite" || feedbackType === "talked") {
    const { data: existing } = await supabase
      .from("user_feedback")
      .select("id")
      .eq("user_id", user.id)
      .eq("feature", feature)
      .eq("feedback_type", feedbackType)
      .eq("item_id", itemId ?? "")
      .maybeSingle();

    if (existing) {
      await supabase.from("user_feedback").delete().eq("id", existing.id);
      return NextResponse.json({ on: false });
    }
    const { error } = await supabase
      .from("user_feedback")
      .insert({ user_id: user.id, feature, item_id: itemId, feedback_type: feedbackType });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ on: true });
  }

  // like / dislike / dismiss: record (replacing a previous like/dislike pair).
  if (feedbackType === "like" || feedbackType === "dislike") {
    await supabase
      .from("user_feedback")
      .delete()
      .eq("user_id", user.id)
      .eq("feature", feature)
      .eq("item_id", itemId)
      .in("feedback_type", ["like", "dislike"]);
  }
  const { error } = await supabase
    .from("user_feedback")
    .insert({ user_id: user.id, feature, item_id: itemId, feedback_type: feedbackType });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** List feedback, optionally filtered — used for favorites and "talked" sets. */
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const feature = searchParams.get("feature");
  const feedbackType = searchParams.get("feedback_type");

  const supabase = await createClient();
  let query = supabase
    .from("user_feedback")
    .select("feature, item_id, feedback_type")
    .eq("user_id", user.id);
  if (feature) query = query.eq("feature", feature);
  if (feedbackType) query = query.eq("feedback_type", feedbackType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data ?? [] });
}

