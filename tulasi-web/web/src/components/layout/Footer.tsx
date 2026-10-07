// Footer: light and quiet. Brand + contact, two short link lists, a crisis note
// and the legal row.
import Image from "next/image";
import Link from "next/link";
import type { Site } from "@/lib/content";
import { Icon } from "@/components/ui/primitives";
import { whatsappLink } from "@/lib/care";
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

const CARE = [
  { label: "Psychiatry", href: "/best-psychiatrist-in-delhi/" },
  { label: "Therapy & counselling", href: "/psychologist-in-delhi/" },
  { label: "Inpatient & rehabilitation", href: "/rehabilitation-centre/" },
  { label: "De-addiction", href: "/deaddiction-centre/" },
  { label: "Child & adolescent", href: "/child-psychiatry-hospital-services/" },
  { label: "Dementia & elderly care", href: "/treatment-of-dementia/" },
  { label: "Deep TMS", href: "/deep-tms-treatment/" },
];
const COMPANY = [
  { label: "About us", href: "/about-us/" },
  { label: "Our team", href: "/our-team/" },
  { label: "Admission", href: "/admission/" },
  { label: "International patients", href: "/international-patient-services/" },
  { label: "Blog", href: "/blog/" },
  { label: "Careers", href: "/careers/" },
  { label: "Employee Assistance Program", href: "/employee-assistance-program/" },
  { label: "Find a specialist", href: "/find-a-specialist/" },
  { label: "Free check-in", href: "/mental-health-check/" },
  { label: "Locations", href: "/locations/" },
];


const colHead = "text-[0.8125rem] font-semibold tracking-[0.08em] text-white uppercase";
const colLink = "text-[0.9375rem] text-white/72 transition-colors hover:text-white";

export function Footer({ site }: { site: Site }) {
  const year = new Date().getFullYear();
  return (
    <footer className="cv mt-6 rounded-t-[2rem] bg-[#173f2e] text-white">
      <div className="container-page pt-12 pb-8 lg:pt-16">
        {/* brand */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="grid size-16 place-items-center rounded-full bg-white" aria-label="Tulasi Healthcare home">
            {site.logo && <Image src={site.logo.src} alt="" width={44} height={44} className="size-11 object-contain" />}
          </Link>
          <p className="mt-4 font-display text-[1.75rem] leading-none font-semibold tracking-[-0.02em] sm:text-3xl">Tulasi Healthcare</p>
          <p className="mt-2 text-[0.9375rem] text-white/72">Psychiatric hospital &amp; mental health care</p>
          <ul className="mt-6 flex gap-3" aria-label="Social media">
            {site.social.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener" className="grid size-10 place-items-center rounded-md border border-white/55 text-white transition-colors hover:bg-white hover:text-[#173f2e]" aria-label={`Tulasi Healthcare on ${socialName(s)}`}>
                  <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden="true">
                    <path d={GLYPH[socialName(s)] ?? GLYPH.Facebook} fillRule="evenodd" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* links */}
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-10">
          <div>
            <h2 className={colHead}>Care</h2>
            <ul className="mt-4 space-y-2.5">
              {CARE.map((l) => (
                <li key={l.href}><Link href={l.href} className={colLink}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={colHead}>Important links</h2>
            <ul className="mt-4 space-y-2.5">
              {COMPANY.map((l) => (
                <li key={l.href}><Link href={l.href} className={colLink}>{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className={colHead}>Legal</h2>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/privacy-policy/" className={colLink}>Privacy Policy</Link></li>
              <li><Link href="/terms-of-use/" className={colLink}>Terms &amp; Conditions</Link></li>
              <li><Link href="/sitemap/" className={colLink}>Site map</Link></li>
              <li><ConsentSettingsButton className={colLink} /></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h2 className={colHead}>Visit &amp; contact</h2>
            <ul className="mt-4 space-y-3 text-[0.9375rem]">
              <li>
                <TrackedLink event="call_click" eventLocation="footer" href={site.contact.phoneHref} className="flex items-start gap-3 text-white hover:underline">
                  <Icon name="phone" className="mt-0.5 size-4 shrink-0 text-white/70" /> {site.contact.phoneDisplay}
                </TrackedLink>
              </li>
              <li>
                <TrackedLink event="whatsapp_click" eventLocation="footer" href={whatsappLink(site.contact.phoneHref)} target="_blank" rel="noopener" className={`flex items-start gap-3 ${colLink}`}>
                  <Icon name="chat" className="mt-0.5 size-4 shrink-0 text-white/70" /> WhatsApp us
                </TrackedLink>
              </li>
              <li>
                <a href={`mailto:${site.contact.email}`} className={`flex items-start gap-3 break-all ${colLink}`}>
                  <Icon name="mail" className="mt-0.5 size-4 shrink-0 text-white/70" /> {site.contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/72">
                <Icon name="pin" className="mt-0.5 size-4 shrink-0 text-white/70" />
                <address className="not-italic">{site.contact.address}</address>
              </li>
              <li><Link href="/locations/" className="inline-flex items-center gap-1.5 font-semibold text-white hover:underline">All locations <Icon name="arrow" className="size-4" /></Link></li>
            </ul>
          </div>
        </div>

        {/* crisis help: gentle, but always there */}
        <div className="mx-auto mt-12 flex max-w-5xl flex-col gap-3 rounded-2xl bg-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-[0.9375rem]">
            <Icon name="heart" className="mt-0.5 size-5 shrink-0 text-white/80" />
            <span><strong className="font-semibold">In crisis or thinking of harming yourself?</strong> You are not alone. Help is available right now.</span>
          </p>
          <a href={site.contact.phoneHref} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#173f2e] hover:bg-white/90">
            <Icon name="phone" className="size-4" /> Call {site.contact.phoneDisplay}
          </a>
        </div>

        <p className="mt-10 text-center text-[0.8125rem] text-white/60">{site.copyright.replace(/\d{4}/, String(year))}</p>
      </div>
    </footer>
  );
}
