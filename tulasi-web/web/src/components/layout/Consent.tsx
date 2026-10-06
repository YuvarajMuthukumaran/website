"use client";
// DPDP Act 2023 consent banner + Google tag loader.
// - Essential storage only until the visitor chooses.
// - "Reject" is as easy as "Accept" (same size, same place).
// - The choice is kept on this device; "Cookie settings" in the footer reopens it.
import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ADS_ID, GA_ID } from "@/lib/analytics";

const KEY = "thc.consent.v1";
type Choice = "granted" | "denied";

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function Consent() {
  const [choice, setChoice] = useState<Choice | null | "unknown">("unknown");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved choice lives in localStorage, unknown on the server
    setChoice(readChoice());
    const reopen = () => setChoice(null);
    window.addEventListener("thc:open-consent", reopen);
    return () => window.removeEventListener("thc:open-consent", reopen);
  }, []);

  const decide = (c: Choice) => {
    try {
      localStorage.setItem(KEY, c);
    } catch {}
    setChoice(c);
    window.gtag?.("consent", "update", { analytics_storage: c, ad_storage: c, ad_user_data: c, ad_personalization: "denied" });
  };

  const tagId = GA_ID || ADS_ID;
  return (
    <>
      {tagId && choice === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'denied'});
gtag('js',new Date());
${GA_ID ? `gtag('config','${GA_ID}',{anonymize_ip:true});` : ""}
${ADS_ID ? `gtag('config','${ADS_ID}');` : ""}`}
          </Script>
        </>
      )}

      {choice === null && (
        <div role="region" aria-label="Cookie consent" className="fixed inset-x-2 bottom-2 z-[70] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-md">
          <div className="rounded-[var(--radius-card)] bg-white p-3.5 shadow-[var(--shadow-lift)] ring-1 ring-line sm:p-5">
            <p className="hidden font-display text-base font-semibold text-ink sm:block">Your privacy</p>
            {/* Phones: one short line and two buttons, so the page and its forms stay usable underneath. */}
            <p className="text-[0.8125rem] leading-snug text-ink-soft sm:hidden">
              We use essential storage, and analytics only if you allow it. No health information is recorded.{" "}
              <Link href="/privacy-policy/" className="font-medium text-brand-700 underline underline-offset-2">
                Privacy Policy
              </Link>
            </p>
            <p className="mt-1.5 hidden text-sm leading-relaxed text-ink-soft sm:block">
              We use essential storage to run this site. With your permission we also use analytics cookies to understand which pages help people. We never use them to record health information. Read our{" "}
              <Link href="/privacy-policy/" className="font-medium text-brand-700 underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-4">
              <button type="button" onClick={() => decide("denied")} className="min-h-11 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-brand-300">
                Reject
              </button>
              <button type="button" onClick={() => decide("granted")} className="min-h-11 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
                Accept analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ConsentSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("thc:open-consent"))}>
      Cookie settings
    </button>
  );
}
