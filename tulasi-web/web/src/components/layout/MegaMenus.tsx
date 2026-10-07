"use client";
// Dropdown panels for the main navigation, in the style of McLean Hospital's: a flat, full-width
// white panel under the header with three calm zones.
//   left   what this section is, and one clear button
//   middle a short list of the main places to go (arrow links)
//   right  featured links, then "browse all"
// Every link stays in the HTML (a panel is built the first time it is opened and then only hidden
// with CSS), so nothing here depends on JavaScript to exist.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { Site } from "@/lib/content";
import { CONCERNS, roleInPlace, whatsappLink } from "@/lib/care";
import { LOCATIONS, locationSummary } from "@/lib/locations";
import { OpenChatButton } from "@/components/chat/OpenChatButton";

type Item = Site["menu"][number];
type Phone = { display: string; href: string };
const PhoneCtx = createContext<Phone | null>(null);
export type TeamTeaser = { faces: string[]; count: number };
type PanelProps = { id: string; item: Item; open: boolean; phone: Phone; team?: TeamTeaser; onEnter: () => void; onLeave: () => void };

// ───────────────────────── building blocks ─────────────────────────

/** The small solid arrowhead used as a bullet. */
function Head({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={clsx("size-3 shrink-0 text-brand-600", className)}>
      <path fill="currentColor" d="M1.5 1.6 14.6 8 1.5 14.4l2.2-6.4z" />
    </svg>
  );
}

const mainLink = "group flex items-start gap-3 rounded-lg py-2 text-[1.0625rem] leading-snug font-medium text-brand-700 transition-colors hover:text-brand-900";
const quietLink = "block rounded-md py-1.5 text-[0.9375rem] leading-snug text-brand-700 transition-colors hover:text-brand-900 hover:underline underline-offset-4";

function MainLink({ href, children, sub }: { href: string; children: ReactNode; sub?: string }) {
  return (
    <Link href={href} className={mainLink}>
      <Head className="mt-[0.4rem] transition-transform group-hover:translate-x-0.5" />
      <span>
        {children}
        {sub && <span className="mt-0.5 block text-[0.8125rem] font-normal text-ink-soft">{sub}</span>}
      </span>
    </Link>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[0.9375rem] font-semibold text-ink">{children}</p>;
}

/** Apollo-style "Quick links" card at the right of every panel: the number and the main next steps. */
function QuickLinks() {
  const phone = useContext(PhoneCtx);
  const row = "group flex min-h-11 items-center justify-between gap-3 rounded-xl bg-white px-4 text-[0.9375rem] font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-brand-50 hover:text-brand-700";
  const arrow = <span aria-hidden="true" className="text-brand-600 transition-transform group-hover:translate-x-0.5">→</span>;
  return (
    <aside aria-label="Quick links" className="hidden rounded-2xl bg-sage-50 p-5 shadow-[inset_0_0_0_1px_var(--color-sage-100)] lg:block">
      <p className="text-[0.9375rem] font-semibold text-ink">Quick links</p>
      {phone && (
        <a href={phone.href} className="mt-3 block rounded-xl bg-white p-3 shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-brand-50">
          <span className="block text-xs text-ink-soft">Call our care team</span>
          <span className="block font-display text-[1.125rem] font-semibold text-brand-700">{phone.display}</span>
        </a>
      )}
      <ul className="mt-3 grid gap-2">
        <li><Link href="/book-appointment/" className={clsx(row, "!bg-brand-600 !text-white hover:!bg-brand-700 !shadow-none")}>Book appointment {arrow}</Link></li>
        <li><Link href="/find-a-specialist/" className={row}>Find a specialist {arrow}</Link></li>
        <li><Link href="/mental-health-check/" className={row}>Free 2-minute check-in {arrow}</Link></li>
        <li><Link href="/locations/" className={row}>Locations &amp; directions {arrow}</Link></li>
        {phone && <li><a href={whatsappLink(phone.href)} target="_blank" rel="noopener noreferrer" className={row}>Chat on WhatsApp {arrow}</a></li>}
      </ul>
    </aside>
  );
}

/** The frame: full-width white sheet under the header; `lead` is the left zone, children are the middle and right zones. */
function Frame({ id, open, onEnter, onLeave, title, text, cta, extra, cols = "lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]", children }: {
  id: string;
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
  title: string;
  text?: string;
  cta?: { href: string; label: string };
  extra?: ReactNode;
  cols?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={clsx(
        "absolute inset-x-0 top-full transition-[opacity,transform,visibility] duration-300 ease-[var(--ease-calm)]",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
      )}
    >
      <div className="border-t border-line bg-white shadow-[0_30px_40px_-30px_rgb(23_34_44/0.35)]">
        <div className="container-page grid max-h-[calc(100dvh-var(--header-h)-4rem)] gap-x-12 gap-y-6 overflow-y-auto py-9 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_15rem] lg:gap-x-10">
          <div className="lg:border-r lg:border-line lg:pr-10">
            <p className="font-display text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">{title}</p>
            {text && <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{text}</p>}
            {extra}
            {cta && (
              <Link href={cta.href} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-brand-700">
                {cta.label}
              </Link>
            )}
          </div>
          <div className={clsx("grid gap-x-10 gap-y-6", cols)}>{children}</div>
          <QuickLinks />
        </div>
      </div>
    </div>
  );
}

const linksOf = (item: Item) => item.groups.flatMap((g) => g.links).filter((l) => l.href);

// ───────────────────────── About Us ─────────────────────────

const ABOUT_MAIN: Record<string, string> = {
  "/mission-vision/": "Mission & Vision",
  "/admission/": "Admission",
  "/international-patient-services/": "International patients",
  "/gallery/": "Gallery",
};

function AboutPanel(p: PanelProps) {
  const links = linksOf(p.item);
  const main = Object.keys(ABOUT_MAIN).filter((h) => links.some((l) => l.href === h));
  const more = links.filter((l) => l.href && !ABOUT_MAIN[l.href]);
  return (
    <Frame id={p.id} open={p.open} onEnter={p.onEnter} onLeave={p.onLeave} title="About Us" text="Who we are, what we believe in and how to begin your care with us." cta={p.item.href ? { href: p.item.href, label: "About Tulasi Healthcare" } : undefined}>
      <ul>
        {main.map((h) => (
          <li key={h}><MainLink href={h}>{ABOUT_MAIN[h]}</MainLink></li>
        ))}
      </ul>
      <div>
        <Heading>More about us</Heading>
        <ul>
          {more.map((l, i) => (
            <li key={`${i}-${l.href}`}><Link href={l.href!} className={quietLink}>{l.label}</Link></li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

// ───────────────────────── Services ─────────────────────────

function ServicesPanel(p: PanelProps) {
  const [active, setActive] = useState(0);
  const groups = p.item.groups.filter((g) => g.links.length);
  const on = groups[active] ?? groups[0];
  return (
    <Frame id={p.id} open={p.open} onEnter={p.onEnter} onLeave={p.onLeave} title="Services & treatments" text="Psychiatry, therapy, rehabilitation and addiction care, from a first consultation onwards." cta={p.item.href ? { href: p.item.href, label: "All services" } : undefined} cols="lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <div>
        <div role="tablist" aria-orientation="vertical" aria-label="Service categories">
          {groups.map((g, gi) => (
            <button
              key={gi}
              type="button"
              role="tab"
              id={`${p.id}-tab-${gi}`}
              aria-selected={gi === active}
              aria-controls={`${p.id}-pane-${gi}`}
              onMouseEnter={() => setActive(gi)}
              onFocus={() => setActive(gi)}
              onClick={() => setActive(gi)}
              className={clsx(mainLink, "w-full text-left", gi === active && "text-brand-900")}
            >
              <Head className={clsx("mt-[0.4rem]", gi !== active && "opacity-40")} />
              <span className={clsx(gi === active && "underline decoration-brand-300 underline-offset-[6px]")}>{g.label}</span>
            </button>
          ))}
        </div>
        <Link href="/employee-assistance-program/" className={clsx(mainLink, "mt-2 border-t border-line pt-4")}>
          <Head className="mt-[0.4rem]" /> Employee Assistance Program
        </Link>
      </div>
      <div>
        {groups.map((g, gi) => (
          <div key={gi} role="tabpanel" id={`${p.id}-pane-${gi}`} aria-labelledby={`${p.id}-tab-${gi}`} hidden={g !== on}>
            <Heading>{g.label}</Heading>
            <ul className={clsx(g.links.length > 7 && "sm:columns-2 sm:gap-x-10")}>
              {g.links.map((l, i) => (
                <li key={`${i}-${l.href ?? l.label}`} className="break-inside-avoid">
                  <Link href={l.href ?? "#"} className={quietLink}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ───────────────────────── Conditions ─────────────────────────

function ConditionsPanel(p: PanelProps) {
  return (
    <Frame id={p.id} open={p.open} onEnter={p.onEnter} onLeave={p.onLeave} title="Conditions we treat" text="Not sure where to start? Tell us what is on your mind and we will point you to the right specialist." cta={{ href: "/find-a-specialist/", label: "Find the right specialist" }} cols="lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <ul>
        <li><MainLink href="/mental-health-check/">Free 2-minute check-in</MainLink></li>
        <li><MainLink href="/book-appointment/">Book a consultation</MainLink></li>
        <li>
          <OpenChatButton mascot={false} className={clsx(mainLink, "w-full text-left")}>
            <Head className="mt-[0.4rem]" /> Talk to Tulasi
          </OpenChatButton>
        </li>
        <li><MainLink href="/services-2/">All conditions &amp; treatments</MainLink></li>
      </ul>
      <div>
        <Heading>Common conditions</Heading>
        <ul className="sm:columns-2 sm:gap-x-10">
          {CONCERNS.map((c) => (
            <li key={c.href} className="break-inside-avoid">
              <Link href={c.href} className={quietLink}>{c.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

// ───────────────────────── Our Team ─────────────────────────

function TeamPanel(p: PanelProps) {
  const groups = p.item.groups.filter((g) => g.links.length);
  return (
    <Frame
      id={p.id}
      open={p.open}
      onEnter={p.onEnter}
      onLeave={p.onLeave}
      title="Our team"
      text="Psychiatrists and psychologists, with full profiles and areas of expertise."
      cta={p.item.href ? { href: p.item.href, label: "Meet the team" } : undefined}
      cols="lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]"
      extra={
        p.team && (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex -space-x-2.5" aria-hidden="true">
              {p.team.faces.slice(0, 4).map((f) => (
                <span key={f} className="relative size-10 overflow-hidden rounded-full bg-mist ring-2 ring-white">
                  <Image src={f} alt="" fill sizes="40px" className="object-cover object-[50%_12%]" />
                </span>
              ))}
            </div>
            <p className="text-sm text-ink-soft"><span className="font-display text-lg font-semibold text-ink">{p.team.count}</span> specialists</p>
          </div>
        )
      }
    >
      <ul>
        <li><MainLink href="/find-a-specialist/">Find the right specialist</MainLink></li>
        <li><MainLink href="/book-appointment/">Book an appointment</MainLink></li>
        <li><MainLink href={p.item.href ?? "/our-team/"}>Meet all specialists</MainLink></li>
      </ul>
      <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.label && <Heading>{g.label}s by city</Heading>}
            <ul>
              {g.links.map((l, i) => (
                <li key={`${i}-${l.href ?? l.label}`}><Link href={l.href ?? "#"} className={quietLink}>{roleInPlace(l.label)}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ───────────────────────── Locations ─────────────────────────

function LocationsPanel(p: PanelProps) {
  return (
    <Frame id={p.id} open={p.open} onEnter={p.onEnter} onLeave={p.onLeave} title="Our locations" text={`${locationSummary()}. Choose a centre for its address and directions.`} cta={{ href: p.item.href ?? "/locations/", label: "All locations" }}>
      <div>
        <Heading>Hospitals and clinics</Heading>
        <ul>
          {LOCATIONS.map((l) => (
            <li key={l.id}>
              <MainLink href={`/locations/#${l.id}`} sub={l.type === "hospital" ? "Hospital" : "Clinic"}>{l.title}</MainLink>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <Heading>Plan your visit</Heading>
        <ul>
          <li><Link href="/locations/" className={quietLink}>Map &amp; directions</Link></li>
          <li><Link href="/admission/" className={quietLink}>Admission</Link></li>
          <li><Link href="/international-patient-services/" className={quietLink}>International patients</Link></li>
          <li><Link href="/book-appointment/" className={quietLink}>Book an appointment</Link></li>
          <li><a href={p.phone.href} className={quietLink}>Call {p.phone.display}</a></li>
        </ul>
      </div>
    </Frame>
  );
}

// ───────────────────────── Anything else ─────────────────────────

function GenericPanel(p: PanelProps) {
  const links = linksOf(p.item);
  return (
    <Frame id={p.id} open={p.open} onEnter={p.onEnter} onLeave={p.onLeave} title={p.item.label} cta={p.item.href ? { href: p.item.href, label: `All ${p.item.label.toLowerCase()}` } : undefined}>
      <ul className="sm:columns-2 sm:gap-x-10 lg:col-span-2">
        {links.map((l, i) => (
          <li key={`${i}-${l.href}`} className="break-inside-avoid"><Link href={l.href!} className={quietLink}>{l.label}</Link></li>
        ))}
      </ul>
      <span />
    </Frame>
  );
}

function PanelFor(p: PanelProps) {
  if (p.item.label === "About Us") return <AboutPanel {...p} />;
  if (p.item.label === "Services") return <ServicesPanel {...p} />;
  if (p.item.label === "Conditions") return <ConditionsPanel {...p} />;
  if (p.item.label === "Our Team") return <TeamPanel {...p} />;
  if (p.item.label === "Locations") return <LocationsPanel {...p} />;
  return <GenericPanel {...p} />;
}

export function NavPanel(p: PanelProps) {
  return (
    <PhoneCtx.Provider value={p.phone}>
      <PanelFor {...p} />
    </PhoneCtx.Provider>
  );
}

