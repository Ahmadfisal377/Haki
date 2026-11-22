import { createClient } from "@/lib/supabase/server";

/**
 * Basic freemium limits (PRD §14: "Basic usage limits are enforced").
 * Counted from usage_events; premium users bypass all limits.
 */
export const FREE_LIMITS: Record<string, number> = {
  chat_message: 20,
  suggestion: 10,
  insight: 5,
};

export type UsageStatus = {
  allowed: boolean;
  used: number;
  limit: number;
};

export async function checkLimit(
  userId: string,
  kind: string,
  plan: string,
): Promise<UsageStatus> {
  const limit = FREE_LIMITS[kind] ?? Infinity;
  if (plan === "premium" || limit === Infinity) {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", startOfDay.toISOString());

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}

export async function recordUsage(userId: string, kind: string) {
  const supabase = await createClient();
  await supabase.from("usage_events").insert({ user_id: userId, kind });
}

/** Reads the user's plan, defaulting to free. An expired premium window reads as free. */
export async function getPlan(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("subscription_plan, premium_until")
    .eq("id", userId)
    .single();
  if (data?.subscription_plan === "premium") {
    const until = data.premium_until ? Date.parse(data.premium_until) : 0;
    if (Number.isFinite(until) && until > Date.now()) return "premium";
    return "free";
  }
  return data?.subscription_plan ?? "free";
}
