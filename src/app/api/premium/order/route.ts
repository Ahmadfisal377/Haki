import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder, isPaypalConfigured } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/** Creates a PayPal order for the premium upgrade and records it as pending. */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPaypalConfigured()) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const orderId = await createOrder();

  const admin = createAdminClient();
  const { error } = await admin.from("payments").insert({
    user_id: user.id,
    provider: "paypal",
    provider_order_id: orderId,
    amount: 4.99,
    currency: "USD",
    status: "pending",
  });
  if (error) {
    console.error("payment ledger insert failed:", error.message);
  }

  return NextResponse.json({ orderID: orderId });
}
