import { NextResponse, type NextRequest } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const title = body?.title?.trim();
  if (!title) return NextResponse.json({ error: "Empty title" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      description: typeof body?.description === "string" ? body.description : "",
      due_at: body?.due_at ? new Date(body.due_at).toISOString() : null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}

