import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/server";
import { LANG_COOKIE } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Sets the language cookie and syncs the profile's preferred_language. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const lang = body?.lang === "ar" ? "ar" : "en";

  const user = await getUser();
  if (user) {
    const supabase = await createClient();
    await supabase
      .from("profiles")
      .update({ preferred_language: lang })
      .eq("id", user.id);
  }

  const res = NextResponse.json({ ok: true, lang });
  res.cookies.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
