import { NextResponse } from "next/server";
import { isLlmConfigured } from "@/lib/llm";
import { isPaypalConfigured, paypalClientId } from "@/lib/paypal";

export const dynamic = "force-dynamic";

/** Non-secret capability flags for the UI. */
export async function GET() {
  return NextResponse.json({
    llmConfigured: isLlmConfigured(),
    paypalConfigured: isPaypalConfigured(),
    paypalClientId: paypalClientId() || null,
  });
}
