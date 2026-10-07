// GA4 + Google Ads conversion events. Nothing is sent until the visitor
// grants analytics consent (Consent Mode v2 defaults to "denied").
// Events never carry personal or health data: only which button was used where.
type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA4_ID ?? "";
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";
// Conversion labels from Google Ads (Tools → Conversions), e.g. "AbC-D_efG-h12_34-567".
const ADS_LABELS: Record<string, string | undefined> = {
  booking_complete: process.env.NEXT_PUBLIC_ADS_LABEL_BOOKING,
  call_click: process.env.NEXT_PUBLIC_ADS_LABEL_CALL,
  whatsapp_click: process.env.NEXT_PUBLIC_ADS_LABEL_WHATSAPP,
};

export type TrackEvent = "booking_complete" | "booking_start" | "call_click" | "whatsapp_click" | "chat_open" | "ebook_download" | "finder_complete" | "finder_residential" | "screener_complete";

export function track(event: TrackEvent, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", event, params);
  const label = ADS_LABELS[event];
  if (ADS_ID && label) window.gtag("event", "conversion", { send_to: `${ADS_ID}/${label}` });
}
