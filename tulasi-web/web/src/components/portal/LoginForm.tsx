"use client";
// E-mail → 6-digit code → signed in (httpOnly cookie set by the API).
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { requestOtp, verifyOtp } from "@/lib/api";
import { Icon } from "@/components/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!resendIn) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const emailOk = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!emailOk) return setError("Please enter a valid e-mail address.");
    setBusy(true);
    setError(null);
    try {
      const r = await requestOtp(email.trim());
      setDevCode(r.devCode ?? null);
      setStage("code");
      setResendIn(30);
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(email.trim(), code);
      // Non-sensitive routing hint for src/proxy.ts (the real session is the API's httpOnly cookie).
      document.cookie = "thc_signed_in=1; path=/; max-age=604800; SameSite=Lax";
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/portal") ? next : "/portal/");
    } catch (err) {
      setError((err as Error).message);
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-blob)] bg-white p-7 shadow-[var(--shadow-lift)] sm:p-10">
      {error && (
        <p role="alert" className="mb-5 rounded-2xl bg-alert-50 p-4 text-sm text-alert-700">{error}</p>
      )}
        {stage === "email" ? (
          <form key="email" onSubmit={sendCode}>
            <label htmlFor="l-email" className="font-display text-xl font-bold text-ink">Your e-mail address</label>
            <p className="mt-1 text-sm text-ink-soft">Use the e-mail you booked with. We’ll send you a 6-digit code.</p>
            <input id="l-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="mt-4 min-h-14 w-full rounded-2xl border border-line px-4 text-lg text-ink focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100" autoFocus />
            <button type="submit" disabled={busy || !emailOk} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
              {busy ? "Sending…" : <>Send code <Icon name="arrow" className="size-4" /></>}
            </button>
          </form>
        ) : (
          <form key="code" onSubmit={check} className="step-in">
            <label htmlFor="l-code" className="font-display text-xl font-bold text-ink">Enter the 6-digit code</label>
            <p className="mt-1 text-sm text-ink-soft">Sent to {email.trim()}. <button type="button" onClick={() => { setStage("email"); setCode(""); }} className="font-semibold text-brand-700 underline">Change</button></p>
            {devCode && <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Sandbox mode: your code is <strong>{devCode}</strong></p>}
            <input
              id="l-code"
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-4 min-h-16 w-full rounded-2xl border border-line text-center font-display text-3xl font-bold tracking-[0.5em] text-ink focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
            <button type="submit" disabled={busy || code.length !== 6} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
              {busy ? "Checking…" : "Sign in"}
            </button>
            <button type="button" disabled={resendIn > 0 || busy} onClick={() => sendCode()} className="mt-3 min-h-11 w-full text-sm font-semibold text-brand-700 disabled:text-ink-soft">
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
          </form>
        )}
      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
        <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-brand-600" /> Your session is stored in a secure, httpOnly cookie. We never store your e-mail address in plain text for login.
      </p>
    </div>
  );
}
