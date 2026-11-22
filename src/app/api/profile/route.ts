import { NextResponse } from "next/server";
import { getUser, createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, preferred_language, subscription_plan, premium_until, created_at")
    .eq("id", user.id)
    .maybeSingle();
  return NextResponse.json({
    profile: data ?? {
      display_name: null,
      preferred_language: "en",
      subscription_plan: "free",
      premium_until: null,
    },
    email: user.email,
  });
}

const unused = 0;
void unused;

