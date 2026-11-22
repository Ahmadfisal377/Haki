"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";

export default function LoginPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function afterAuth() {
    router.replace("/dashboard");
    router.refresh();
  }

  async function signIn() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (error) setError(error.message);
    else await afterAuth();
  }

  async function signUp() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          preferred_language: lang,
        },
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) await afterAuth();
    else setNotice("Check your email to confirm your account.");
  }

  async function magicLink() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setNotice(t("magic_sent"));
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold whitespace-nowrap">
            Haki <span className="text-primary">حكي</span>
          </h1>
          <p className="sub mt-2">{t("login_sub")}</p>
        </div>

        <div className="card space-y-4">
          <div className="flex gap-2">
            <button
              className={`chip flex-1 justify-center ${mode === "signin" ? "chip-on" : ""}`}
              onClick={() => setMode("signin")}
            >
              {t("sign_in")}
            </button>
            <button
              className={`chip flex-1 justify-center ${mode === "signup" ? "chip-on" : ""}`}
              onClick={() => setMode("signup")}
            >
              {t("sign_up")}
            </button>
          </div>

          {mode === "signup" && (
            <div>
              <label className="label">{t("display_name")}</label>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="label">{t("email")}</label>
            <input
              className="input"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label">{t("password")}</label>
            <input
              className="input"
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) {
                  mode === "signin" ? signIn() : signUp();
                }
              }}
            />
          </div>

          <button
            className="btn w-full"
            disabled={busy || !email || !password}
            onClick={() => (mode === "signin" ? signIn() : signUp())}
          >
            {mode === "signin" ? t("sign_in") : t("sign_up")}
          </button>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {t("or")}
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            className="btn-ghost w-full"
            disabled={busy || !email}
            onClick={magicLink}
          >
            {t("magic_link")}
          </button>

          {notice && (
            <p className="text-sm text-primary" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="text-sm text-rose" role="alert">
              {error}
            </p>
          )}
        </div>

        <p className="sub mt-6 text-center text-xs">{t("auth_note")}</p>
        <p className="mt-2 text-center">
          <Link href="/login" className="text-xs text-muted underline">
            {mode === "signin" ? t("no_account_q") : t("have_account_q")}
          </Link>
        </p>
      </div>
    </main>
  );
}
