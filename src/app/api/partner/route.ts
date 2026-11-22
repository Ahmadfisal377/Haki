import { NextResponse, type NextRequest } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("partner_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json({ profile: data ?? null });
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);

  const supabase = await createClient();
  const values = {
    user_id: user.id,
    partner_name: String(body?.partner_name ?? "").slice(0, 120),
    relationship_type: String(body?.relationship_type ?? "").slice(0, 60),
    interests: Array.isArray(body?.interests) ? body.interests.slice(0, 20) : [],
    stress_pref: String(body?.stress_pref ?? "").slice(0, 30),
    love_pref: String(body?.love_pref ?? "").slice(0, 30),
    energy_pref: String(body?.energy_pref ?? "").slice(0, 30),
    notes: String(body?.notes ?? "").slice(0, 4000),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("partner_profiles")
    .upsert(values, { onConflict: "user_id" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

