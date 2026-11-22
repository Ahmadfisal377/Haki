import { NextResponse, type NextRequest } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  "preference",
  "date",
  "event",
  "conversation",
  "experience",
  "note",
  "milestone",
] as const;

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memories: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const content = body?.content?.trim();
  if (!content) return NextResponse.json({ error: "Empty content" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memories")
    .insert({
      user_id: user.id,
      content,
      category: CATEGORIES.includes(body?.category) ? body.category : "note",
      source: body?.source === "chat" ? "chat" : "user",
      confidence: typeof body?.confidence === "number" ? body.confidence : 1,
      confirmed: body?.confirmed === false ? false : true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memory: data }, { status: 201 });
}

