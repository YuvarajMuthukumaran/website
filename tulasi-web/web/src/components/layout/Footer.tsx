// Footer: the live footer's text, link columns and contact details, unchanged.
import Image from "next/image";
import Link from "next/link";
import type { Site } from "@/lib/content";
import { Arrow, btnClass, Icon } from "@/components/ui/primitives";
import { WordField } from "@/components/WordField";
import { ConsentSettingsButton } from "./Consent";
import { TrackedLink } from "./TrackedLink";

const SOCIAL_LABEL: Record<string, string> = { facebook: "Facebook", linkedin: "LinkedIn", instagram: "Instagram", youtube: "YouTube", twitter: "X (Twitter)", "x.com": "X" };
const socialName = (url: string) => Object.entries(SOCIAL_LABEL).find(([k]) => url.includes(k))?.[1] ?? "Social";

// Simplified brand glyphs (single-colour, inherit currentColor).
const GLYPH: Record<string, string> = {
  Facebook: "M14 8h3V4.5h-3c-2.5 0-4 1.6-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.7c0-.4.2-.7.5-.7z",
  LinkedIn: "M5 9h3.5v11H5zM6.75 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10.5 9h3.3v1.6c.5-.9 1.7-1.9 3.6-1.9 3.6 0 4.1 2.3 4.1 5.3v6H18v-5.3c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V20h-3.6z",
  Instagram: "M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zM17.2 5.6a1.1 1.1 0 1 0 0 2.3 1.1 1.1 0 0 0 0-2.3zM12 3c-2.4 0-2.7 0-3.7.1-3.3.1-5.1 1.9-5.2 5.2C3 9.3 3 9.6 3 12s0 2.7.1 3.7c.1 3.3 1.9 5.1 5.2 5.2 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1c3.3-.1 5.1-1.9 5.2-5.2.1-1 .1-1.3.1-3.7s0-2.7-.1-3.7c-.1-3.3-1.9-5.1-5.2-5.2C14.7 3 14.4 3 12 3z",
  YouTube: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z",
};

export function Footer({ site }: { site: Site }) {
  const year = new Date().getFullYear();
  const linkCols = site.footerColumns.filter((c) => c.heading !== "Contact Us");
  return (
    <footer className="cv on-dark stage relative overflow-clip bg-hero text-brand-50">
      <div className="beam" aria-hidden="true" />
      {/* ── Closing stage ── */}
      <div className="relative">
        <WordField className="opacity-70" />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 hidden h-[360px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/40 blur-[110px] md:block" />
        <div className="container-page relative py-24 text-center lg:py-32">
          <p className="eyebrow !text-brand-200">You don’t have to do this alone</p>
          <p className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.5rem,1.4rem+4.6vw,5.5rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-white">
            Talk to someone <span className="text-glow">today.</span>
          </p>
          <p className="mx-auto mt-6 max-w-[48ch] text-[length:var(--text-lead)] text-brand-100/80">Book a consultation with our psychiatrists and psychologists, or call us.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/book-appointment/" className={btnClass("accent", "lg")}>
              Book Appointment <Arrow />
            </Link>
            <TrackedLink event="call_click" eventLocation="footer_cta" href={site.contact.phoneHref} className={btnClass("glass", "lg")}>
              <Icon name="phone" className="size-4" /> {site.contact.phoneDisplay}
            </TrackedLink>
          </div>
        </div>
      </div>

      <div className="container-page relative pb-10">
        {/* crisis help, given its own calm block */}
        <div className="glass-dark grid gap-6 rounded-[var(--radius-blob)] p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-start gap-4">
            <span className="icon-tile icon-tile-dark size-12 shrink-0"><Icon name="heart" className="size-5" /></span>
            <div>
              <p className="font-display text-lg font-semibold text-white">In crisis or thinking of harming yourself?</p>
              <p className="mt-1 text-sm text-brand-100/75">You are not alone. Help is available right now, any time of day.</p>
            </div>
          </div>
          <ul className="flex flex-wrap gap-2">
            <li><a href="tel:14416" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-brand-900">Tele-MANAS 14416 <span className="font-normal text-ink-soft">free, 24×7</span></a></li>
            <li><TrackedLink event="call_click" eventLocation="footer_crisis" href={site.contact.phoneHref} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]">Tulasi Healthcare {site.contact.phoneDisplay}</TrackedLink></li>
            <li><a href="tel:112" className="inline-flex min-h-11 items-center rounded-full bg-white/[0.08] px-4 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]">Emergency 112</a></li>
          </ul>
        </div>

        {/* sitemap */}
        <div className="mt-16 grid gap-12 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 rounded-xl">
              <span className="grid size-12 place-items-center rounded-[var(--radius-tile)] bg-white p-1">
                {site.logo && <Image src={site.logo.src} alt="" width={40} height={40} className="h-auto w-10" />}
              </span>
              <span className="font-display text-lg font-bold tracking-[-0.02em] text-white">Tulasi Healthcare</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-100/70">{site.footerAbout}</p>
            <ul className="mt-6 flex gap-2" aria-label="Social media">
              {site.social.map((s) => (
                <li key={s}>
                  <a href={s} target="_blank" rel="noopener" className="grid size-11 place-items-center rounded-full bg-white/[0.06] text-brand-100 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition hover:bg-white/[0.12] hover:text-white" aria-label={`Tulasi Healthcare on ${socialName(s)}`}>
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
                      <path d={GLYPH[socialName(s)] ?? GLYPH.Facebook} fillRule="evenodd" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {linkCols.map((col) => (
            <div key={col.heading}>
              <h2 className="text-[0.7rem] font-semibold tracking-[0.16em] text-brand-200 uppercase">{col.heading}</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.href ?? l.label}>
                    <Link href={l.href ?? "#"} className="link-underline text-brand-100/75 transition-colors hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="text-[0.7rem] font-semibold tracking-[0.16em] text-brand-200 uppercase">Contact Us</h2>
            <ul className="mt-5 space-y-4 text-sm">
              <li>
                <TrackedLink event="call_click" eventLocation="footer" href={site.contact.phoneHref} className="flex items-start gap-3 text-brand-100/80 hover:text-white">
                  <Icon name="phone" className="mt-0.5 size-4 shrink-0" /> {site.contact.phoneDisplay}
                </TrackedLink>
              </li>
              <li>
                <a href={`mailto:${site.contact.email}`} className="flex items-start gap-3 text-brand-100/80 hover:text-white">
                  <Icon name="mail" className="mt-0.5 size-4 shrink-0" /> {site.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-brand-100/80">
                <Icon name="pin" className="mt-0.5 size-4 shrink-0" />
                <address className="not-italic">{site.contact.address}</address>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-6 text-[0.8125rem] text-brand-100/60 md:flex-row md:items-center md:justify-between">
          <p>{site.copyright.replace(/\d{4}/, String(year))}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li><Link href="/privacy-policy/" className="link-underline hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms-of-use/" className="link-underline hover:text-white">Terms</Link></li>
            <li><Link href="/sitemap/" className="link-underline hover:text-white">Site Map</Link></li>
            <li><ConsentSettingsButton className="link-underline hover:text-white" /></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
