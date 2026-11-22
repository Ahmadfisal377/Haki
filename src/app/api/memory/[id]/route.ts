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
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body?.content === "string" && body.content.trim()) {
    update.content = body.content.trim();
  }
  if (body?.confirmed === true) update.confirmed = true;
  if (typeof body?.category === "string") update.category = body.category;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memories")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memory: data });
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
    .from("memories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
