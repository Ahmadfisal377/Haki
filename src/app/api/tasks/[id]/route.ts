import { NextResponse, type NextRequest } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const update: Record<string, unknown> = {};
  if (typeof body?.title === "string" && body.title.trim()) update.title = body.title.trim();
  if (typeof body?.description === "string") update.description = body.description;
  if (body?.completed === true) update.completed_at = new Date().toISOString();
  if (body?.completed === false) update.completed_at = null;
  if (body?.due_at !== undefined) {
    update.due_at = body.due_at ? new Date(body.due_at).toISOString() : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
