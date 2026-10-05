"use client";
// Phone → 6-digit code → signed in (httpOnly cookie set by the API).
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { requestOtp, verifyOtp } from "@/lib/api";
import { Icon } from "@/components/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
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

  const phoneOk = /^(?:\+?91|0)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""));

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (!phoneOk) return setError("Please enter a valid 10-digit mobile number.");
    setBusy(true);
    setError(null);
    try {
      const r = await requestOtp(phone);
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
      await verifyOtp(phone, code);
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
        <p role="alert" className="mb-5 rounded-2xl bg-accent-50 p-4 text-sm text-accent-700">{error}</p>
      )}
        {stage === "phone" ? (
          <form key="phone" onSubmit={sendCode}>
            <label htmlFor="l-phone" className="font-display text-xl font-bold text-ink">Mobile number</label>
            <div className="mt-4 flex items-center rounded-2xl border border-line focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-100">
              <span className="pl-4 font-semibold text-ink-soft">+91</span>
              <input id="l-phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className="min-h-14 w-full rounded-2xl bg-transparent px-3 text-lg text-ink focus:outline-none" autoFocus />
            </div>
            <button type="submit" disabled={busy || !phoneOk} className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
              {busy ? "Sending…" : <>Send code <Icon name="arrow" className="size-4" /></>}
            </button>
          </form>
        ) : (
          <form key="code" onSubmit={check} className="step-in">
            <label htmlFor="l-code" className="font-display text-xl font-bold text-ink">Enter the 6-digit code</label>
            <p className="mt-1 text-sm text-ink-soft">Sent to +91 {phone.replace(/\D/g, "").slice(-10)}. <button type="button" onClick={() => { setStage("phone"); setCode(""); }} className="font-semibold text-brand-700 underline">Change</button></p>
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
        <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-brand-600" /> Your session is stored in a secure, httpOnly cookie. We never store your number in plain text for login.
      </p>
    </div>
  );
}
