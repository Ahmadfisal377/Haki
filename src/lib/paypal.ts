/**
 * PayPal Orders API v2 (one-time checkout).
 * Premium: $4.99 for 1 month. The server creates the order, and only the
 * server verifies + captures the payment, then grants premium via the
 * service-role client. The browser never receives anything sensitive.
 */

const API_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

export const PREMIUM_PRICE = "4.99";
export const PREMIUM_CURRENCY = "USD";
export const PREMIUM_DAYS = 30;

export function isPaypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/** Public client id (safe to expose to the browser for the SDK script). */
export function paypalClientId(): string {
  return process.env.PAYPAL_CLIENT_ID ?? "";
}

/** PayPal order ids are 17 alphanumeric characters. Validating before the
 *  value is interpolated into a URL path prevents path injection. */
const ORDER_ID_RE = /^[A-Za-z0-9]{17}$/;

export function isValidOrderId(orderId: unknown): orderId is string {
  return typeof orderId === "string" && ORDER_ID_RE.test(orderId);
}

type Token = { access_token: string; expires_in?: number };

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID!;
  const secret = process.env.PAYPAL_CLIENT_SECRET!;
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const token = (await res.json()) as Token;
  cachedToken = {
    value: token.access_token,
    expiresAt: Date.now() + Number(token.expires_in ?? 3600) * 1000,
  };
  return token.access_token;
}

export async function createOrder(): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: PREMIUM_CURRENCY, value: PREMIUM_PRICE },
          description: "Haki Premium - 1 month",
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`PayPal create order failed: ${res.status}`);
  const order = (await res.json()) as { id: string };
  return order.id;
}

export type CaptureResult = {
  status: string;
  captureStatus: string | null;
  captureId: string | null;
  amount: string | null;
  currency: string | null;
};

export async function captureOrder(orderId: string): Promise<CaptureResult> {
  // Defense in depth: the route validates too, but never build a PayPal URL
  // from an unchecked user-supplied value.
  if (!isValidOrderId(orderId)) {
    throw new Error("Invalid PayPal order ID");
  }

  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PayPal capture failed: ${res.status} ${detail.slice(0, 500)}`);
  }
  const body = (await res.json()) as {
    status: string;
    payer?: { payer_id?: string };
    purchase_units?: Array<{
      payments?: {
        captures?: Array<{
          status: string;
          id: string;
          amount?: { value: string; currency_code: string };
        }>;
      };
    }>;
  };
  const capture = body.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: body.status,
    captureStatus: capture?.status ?? null,
    captureId: capture?.id ?? null,
    amount: capture?.amount?.value ?? null,
    currency: capture?.amount?.currency_code ?? null,
  };
}
