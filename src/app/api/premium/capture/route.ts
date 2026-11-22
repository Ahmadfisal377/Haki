import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  captureOrder,
  isPaypalConfigured,
  isValidOrderId,
  PREMIUM_DAYS,
  PREMIUM_PRICE,
  type CaptureResult,
} from "@/lib/paypal";

export const dynamic = "force-dynamic";

/**
 * Verifies + captures the PayPal payment, then grants premium.
 * This is the ONLY place subscription_plan/premium_until are written,
 * and it writes with the service-role key after checking the capture.
 * A capture is only attempted for a pending ledger row belonging to the
 * authenticated user, so foreign, invalid, or replayed orders are rejected
 * before PayPal is ever called.
 */
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPaypalConfigured()) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { orderID?: unknown } | null;
  const orderID = body?.orderID;
  if (!isValidOrderId(orderID)) {
    return NextResponse.json({ error: "Invalid orderID" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Bind the order to this user BEFORE talking to PayPal. No matching pending
  // row means the order is foreign, already used, or was never created here.
  const { data: rows, error: lookupError } = await admin
    .from("payments")
    .select("id, status, amount, currency")
    .eq("provider_order_id", orderID)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (lookupError) {
    console.error("payment lookup failed:", lookupError.message);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  const payment = rows?.[0];
  if (!payment) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "Order already processed" }, { status: 409 });
  }
  if (Number(payment.amount) !== Number(PREMIUM_PRICE) || payment.currency !== "USD") {
    return NextResponse.json({ error: "Order amount mismatch" }, { status: 402 });
  }

  let capture: CaptureResult;
  try {
    capture = await captureOrder(orderID);
  } catch (err) {
    console.error("paypal capture failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Payment capture failed" }, { status: 502 });
  }

  // Verify the payment actually went through and matches our price.
  if (
    capture.status !== "COMPLETED" ||
    capture.captureStatus !== "COMPLETED" ||
    !capture.captureId ||
    capture.amount !== PREMIUM_PRICE ||
    capture.currency !== "USD"
  ) {
    return NextResponse.json(
      { error: "Payment not completed", status: capture.status },
      { status: 402 },
    );
  }

  // Premium extends from the later of "now" and the current expiry,
  // so buying again before expiry stacks the remaining days.
  const { data: profile } = await admin
    .from("profiles")
    .select("premium_until")
    .eq("id", user.id)
    .maybeSingle();

  const now = Date.now();
  const currentEnd = profile?.premium_until ? Date.parse(profile.premium_until) : 0;
  const base = Math.max(now, Number.isFinite(currentEnd) ? currentEnd : now);
  const premiumUntil = new Date(base + PREMIUM_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await admin
    .from("profiles")
    .update({ subscription_plan: "premium", premium_until: premiumUntil })
    .eq("id", user.id);

  if (updateError) {
    console.error("premium grant failed:", updateError.message);
    return NextResponse.json({ error: "Grant failed" }, { status: 500 });
  }

  // Update only the exact pending row we validated; the status guard prevents
  // a concurrent duplicate from overwriting a completed record.
  const { error: ledgerError } = await admin
    .from("payments")
    .update({
      status: "completed",
      provider_capture_id: capture.captureId,
      premium_until: premiumUntil,
    })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (ledgerError) {
    console.error("payment ledger update failed:", ledgerError.message);
    return NextResponse.json({ error: "Ledger update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: "premium", premiumUntil });
}
