"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Icon } from "@/components/Icon";

declare global {
  interface Window {
    // Loaded lazily from https://www.paypal.com/sdk/js
    paypal?: {
      Buttons: (options: {
        style?: Record<string, string>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: unknown) => void;
      }) => { render: (selector: HTMLElement) => Promise<void> };
    };
  }
}

type PlanFeature = { text: string; included: boolean };

type PlanCardProps = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  recommended?: boolean;
  current?: boolean;
  badge?: string;
  action: ReactNode;
  footer?: ReactNode;
};

function PlanCard({
  name,
  price,
  period,
  description,
  features,
  recommended = false,
  current = false,
  badge,
  action,
  footer,
}: PlanCardProps) {
  const { t } = useI18n();

  return (
    <article
      className={`plan-card ${recommended ? "plan-card-recommended" : ""}`}
      aria-label={name}
    >
      {badge && (
        <span className="plan-badge absolute -top-3 start-6">
          <span className="plan-dot" />
          {badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold leading-tight text-ink">{name}</h3>
        {current && (
          <span className="chip chip-on shrink-0 !px-2.5 !py-1 text-[11px]">
            {t("prem_current")}
          </span>
        )}
      </div>

      <p className="sub mt-1 min-h-10">{description}</p>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span
          className={`font-display text-4xl font-bold leading-none ${
            recommended ? "plan-price-glow" : "text-ink"
          }`}
        >
          {price}
        </span>
        <span className="sub text-sm">{period}</span>
      </div>

      <div className="my-5 h-px w-full bg-line/70" />

      <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">
        {t("prem_includes")}
      </p>
      <ul className="mt-3 space-y-2.5">
        {features.map((feature) => (
          <li
            key={feature.text}
            className={`flex items-start gap-2 text-sm ${
              feature.included ? "text-ink/85" : "text-muted/60"
            }`}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                feature.included ? "bg-primary-soft text-primary" : "bg-ink/5 text-muted/60"
              }`}
            >
              <Icon name={feature.included ? "check" : "x"} className="h-2.5 w-2.5" />
            </span>
            <span>{feature.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        {action}
        {footer && <div className="sub mt-2 text-center text-xs">{footer}</div>}
      </div>
    </article>
  );
}

export function PremiumSection() {
  const { t, lang } = useI18n();
  const [plan, setPlan] = useState<string>("free");
  const [premiumUntil, setPremiumUntil] = useState<string | null>(null);
  const [paypalConfigured, setPaypalConfigured] = useState<boolean | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const buttonsHostRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);

  const loadProfile = useCallback(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => {
        setPlan(j.profile?.subscription_plan ?? "free");
        setPremiumUntil(j.profile?.premium_until ?? null);
      })
      .catch(() => undefined)
      .finally(() => setProfileLoaded(true));
  }, []);

  useEffect(() => {
    loadProfile();
    fetch("/api/config")
      .then((r) => r.json())
      .then((j) => {
        setPaypalConfigured(Boolean(j.paypalConfigured));
        setClientId(j.paypalClientId ?? null);
      })
      .catch(() => setPaypalConfigured(false));
  }, [loadProfile]);

  const isPremium = plan === "premium";

  const renderButtons = useCallback(() => {
    if (!window.paypal || !buttonsHostRef.current || renderedRef.current) return;
    renderedRef.current = true;
    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "paypal" },
        createOrder: async () => {
          const r = await fetch("/api/premium/order", { method: "POST" });
          if (!r.ok) {
            setStatus("error");
            throw new Error("order failed");
          }
          const j = (await r.json()) as { orderID: string };
          return j.orderID;
        },
        onApprove: async (data) => {
          setStatus("pending");
          const r = await fetch("/api/premium/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          });
          if (r.ok) {
            setStatus("success");
            loadProfile();
          } else {
            setStatus("error");
          }
        },
        onError: () => setStatus("error"),
      })
      .render(buttonsHostRef.current)
      // The SDK can reject if React removes the host (e.g. plan changes);
      // swallow it so it isn't logged as an unhandled exception.
      .catch(() => {
        renderedRef.current = false;
      });
  }, [loadProfile]);

  // Load the PayPal SDK only after the plan is known: loading while the
  // default "free" plan is showing makes the SDK render into a host that
  // React removes once the real (premium) plan arrives.
  useEffect(() => {
    if (
      !profileLoaded ||
      paypalConfigured === null ||
      !clientId ||
      isPremium ||
      status === "success"
    )
      return;
    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      renderButtons();
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId,
    )}&currency=USD&intent=capture&components=buttons&disable-funding=credit`;
    script.async = true;
    script.onload = () => renderButtons();
    document.head.appendChild(script);
  }, [profileLoaded, paypalConfigured, clientId, isPremium, status, renderButtons]);

  const untilText = premiumUntil
    ? new Date(premiumUntil).toLocaleDateString(lang === "ar" ? "ar" : "en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const freeFeatures: PlanFeature[] = [
    { text: t("prem_limit_chat"), included: true },
    { text: t("prem_limit_suggest"), included: true },
    { text: t("prem_limit_insight"), included: true },
    { text: t("prem_no_caps"), included: false },
  ];
  const premiumFeatures: PlanFeature[] = [
    { text: t("prem_unlim_chat"), included: true },
    { text: t("prem_unlim_suggest"), included: true },
    { text: t("prem_unlim_insight"), included: true },
    { text: t("prem_no_caps"), included: true },
  ];

  return (
    <section className="card p-5 md:p-6" aria-labelledby="premium-heading">
      <div className="flex items-center gap-2">
        <span className="text-primary">
          <Icon name="sparkles" className="h-5 w-5" />
        </span>
        <h2 id="premium-heading" className="font-display text-xl font-bold">
          {t("prem_title")}
        </h2>
      </div>
      <p className="sub mt-1">{t("prem_plans_sub")}</p>

      <div className="mt-6 grid items-stretch gap-5 md:grid-cols-2 md:gap-6">
        <PlanCard
          name={t("set_plan_free")}
          price={t("prem_free_price")}
          period={t("prem_free_period")}
          description={t("prem_free_desc")}
          features={freeFeatures}
          current={!isPremium}
          action={
            <button
              className="btn-ghost w-full cursor-default justify-center opacity-75"
              disabled
              aria-current={!isPremium ? "true" : undefined}
            >
              {!isPremium ? t("prem_current") : t("prem_free_action")}
            </button>
          }
        />

        <PlanCard
          name={t("set_plan_premium")}
          price={t("prem_price_amount")}
          period={t("prem_period")}
          description={t("prem_sub")}
          features={premiumFeatures}
          recommended
          current={isPremium}
          badge={t("prem_rec")}
          action={
            <>
              {/* Keep the host mounted so the PayPal SDK never sees it removed
                  from the DOM when the plan changes from free to premium. */}
              <div
                ref={buttonsHostRef}
                className={isPremium || paypalConfigured === false ? "hidden" : "min-h-11"}
                dir="ltr"
              />
              {isPremium ? (
                <div className="btn plan-btn-glow w-full justify-center" role="status">
                  {t("set_plan_premium")}
                </div>
              ) : paypalConfigured === false ? (
                <button className="btn w-full justify-center" disabled>
                  {t("prem_unavailable")}
                </button>
              ) : null}
            </>
          }
          footer={
            isPremium
              ? untilText
                ? t("prem_until", { date: untilText })
                : null
              : paypalConfigured
                ? t("prem_pay_note")
                : null
          }
        />
      </div>

      <div aria-live="polite" className="min-h-0">
        {status === "success" && (
          <p className="mt-4 rounded-xl bg-primary-soft p-3 text-sm font-medium text-primary-deep">
            {t("prem_success")}
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 rounded-xl bg-rose-soft p-3 text-sm text-rose">{t("prem_error")}</p>
        )}
        {status === "pending" && <p className="sub mt-4">{t("prem_pending")}</p>}
      </div>
    </section>
  );
}
