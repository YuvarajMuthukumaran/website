"use client";
// Dropdown panels for the main navigation. White cards with a hairline and a soft
// shadow, a quiet tinted intro column on the left and plain, readable link lists
// on the right. Every link stays in the HTML: closed panels are hidden with CSS.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Site } from "@/lib/content";
import { CONCERNS } from "@/lib/care";
import { Arrow, BrandIcon, Icon } from "@/components/ui/primitives";

type Item = Site["menu"][number];
export type TeamTeaser = { faces: string[]; count: number };

/** "i:name" uses a UI icon, anything else a brand icon. */
function Glyph({ name, className = "size-[1.1rem]" }: { name: string; className?: string }) {
  return name.startsWith("i:") ? <Icon name={name.slice(2)} className={className} /> : <BrandIcon name={name} className={className} />;
}

/** The floating white card. Centred under the header bar (its positioning parent). */
function Shell({ id, open, width, children, align = "center" }: { id: string; open: boolean; width: string; children: ReactNode; align?: "center" | "right" }) {
  return (
    <div
      id={id}
      className={clsx(
        "absolute top-full pt-2 transition-[opacity,transform,visibility] duration-300 ease-[var(--ease-calm)]",
        align === "center" ? "left-1/2 -translate-x-1/2" : "right-0",
        width,
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
      )}
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_0_0_1px_rgb(23_34_44/0.08),0_24px_60px_-24px_rgb(23_34_44/0.3)]">{children}</div>
    </div>
  );
}

function Intro({ title, text, cta, children }: { title: string; text: string; cta?: { href: string; label: string }; children?: ReactNode }) {
  return (
    <div className="flex flex-col bg-mist p-6">
      {children}
      <p className="font-display text-lg leading-snug font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{text}</p>
      {cta && (
        <Link href={cta.href} className="group/btn mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-brand-700 hover:text-brand-900">
          {cta.label} <Arrow className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

const rowLink = "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9rem] leading-snug text-ink transition-colors hover:bg-brand-50 hover:text-brand-800";

// ───────────────────────── About Us ─────────────────────────

const ABOUT: Record<string, { label: string; text: string; icon: string }> = {
  "/mission-vision/": { label: "Mission & Vision", text: "What we stand for", icon: "i:heart" },
  "/admission/": { label: "Admission", text: "How admission works", icon: "inpatient" },
  "/international-patient-services/": { label: "International patients", text: "Care for patients from abroad", icon: "i:globe" },
  "/gallery/": { label: "Gallery", text: "Our centre in pictures", icon: "sunrise" },
  "/videos/": { label: "Videos", text: "Watch and listen", icon: "i:play" },
  "/publications/": { label: "Publications", text: "Papers and writing", icon: "order" },
  "/internship/": { label: "Internships", text: "Train with our team", icon: "i:award" },
};

function AboutPanel({ id, item, open }: { id: string; item: Item; open: boolean }) {
  const links = item.groups.flatMap((g) => g.links);
  const byHref = new Map(links.map((l) => [l.href, l]));
  const main = Object.keys(ABOUT).filter((h) => byHref.has(h));
  const rest = links.filter((l) => l.href && !ABOUT[l.href]);
  return (
    <Shell id={id} open={open} width="w-[min(860px,calc(100vw-2.5rem))]">
      <div className="grid grid-cols-[250px_1fr]">
        <Intro title="About Tulasi Healthcare" text="Who we are, what we believe in, and how to begin your care with us." cta={item.href ? { href: item.href, label: "About us" } : undefined} />
        <div className="p-4">
          <ul className="grid grid-cols-2 gap-1">
            {main.map((h) => {
              const m = ABOUT[h];
              return (
                <li key={h}>
                  <Link href={h} className={clsx(rowLink, "items-start py-3")}>
                    <span className="icon-tile mt-0.5 size-10 shrink-0"><Glyph name={m.icon} /></span>
                    <span>
                      <span className="block font-semibold">{m.label}</span>
                      <span className="mt-0.5 block text-[0.8125rem] text-ink-soft">{m.text}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul className="mt-3 flex flex-wrap items-center gap-1 border-t border-line pt-3">
            {rest.map((l) => (
              <li key={l.href ?? l.label}>
                <Link href={l.href ?? "#"} className="rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-ink-soft transition-colors hover:bg-mist hover:text-brand-700">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Shell>
  );
}

// ───────────────────────── Services ─────────────────────────

const SERVICE_ICON: Record<string, string> = {
  Treatment: "psychiatry",
  "Sexual Disorder Treatment": "family",
  "Mental Hospital": "inpatient",
  "Rehabilitation Services": "sunrise",
  "Addiction Treatment": "sprout",
  Therapies: "therapy",
};

function ServicesPanel({ id, item, open }: { id: string; item: Item; open: boolean }) {
  const [active, setActive] = useState(0);
  const groups = item.groups.filter((g) => g.links.length);
  return (
    <Shell id={id} open={open} width="w-[min(960px,calc(100vw-2.5rem))]">
      <div className="grid grid-cols-[270px_1fr]">
        <div className="flex flex-col bg-mist p-4">
          <p className="px-3 pt-2 pb-2 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">Our services</p>
          <div role="tablist" aria-orientation="vertical" aria-label="Service categories" className="space-y-0.5">
            {groups.map((g, gi) => {
              const on = gi === active;
              return (
                <button
                  key={gi}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${gi}`}
                  aria-selected={on}
                  aria-controls={`${id}-pane-${gi}`}
                  onMouseEnter={() => setActive(gi)}
                  onFocus={() => setActive(gi)}
                  onClick={() => setActive(gi)}
                  className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-200", on ? "bg-white text-brand-800 shadow-[0_0_0_1px_var(--color-line)]" : "text-ink hover:bg-white/70")}
                >
                  <span className={clsx("grid size-8 shrink-0 place-items-center rounded-lg transition-colors", on ? "bg-brand-50 text-brand-700" : "bg-white text-ink-soft")}><Glyph name={SERVICE_ICON[g.label ?? ""] ?? "cradle"} className="size-4" /></span>
                  <span className="flex-1 leading-tight">{g.label}</span>
                  <Icon name="chevron" className={clsx("size-3.5 transition-opacity", on ? "opacity-70" : "opacity-0")} />
                </button>
              );
            })}
          </div>
          <div className="mt-auto space-y-1 pt-4">
            <Link href="/employee-assistance-program/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink hover:bg-white/70"><span className="grid size-8 place-items-center rounded-lg bg-white text-ink-soft"><Glyph name="workplace" className="size-4" /></span>Employee Assistance Program</Link>
            {item.href && <Link href={item.href} className="group/btn flex items-center gap-1.5 px-3 pt-2 text-sm font-semibold text-brand-700 hover:text-brand-900">View all services <Arrow className="size-3.5" /></Link>}
          </div>
        </div>
        <div className="max-h-[70vh] min-h-[400px] overflow-y-auto p-5">
          {groups.map((g, gi) => (
            <div key={gi} role="tabpanel" id={`${id}-pane-${gi}`} aria-labelledby={`${id}-tab-${gi}`} hidden={gi !== active} className={gi === active ? "step-in" : undefined}>
              <p className="mb-2 flex items-baseline gap-2 px-3">
                <span className="font-display text-base font-semibold text-ink">{g.label}</span>
                <span className="text-xs text-ink-soft">{g.links.length} {g.links.length === 1 ? "page" : "pages"}</span>
              </p>
              <ul className="grid grid-cols-2 gap-x-2">
                {g.links.map((l) => (
                  <li key={l.href ?? l.label}>
                    <Link href={l.href ?? "#"} className={clsx(rowLink, "items-start")}>
                      <span className="mt-[0.5rem] size-1.5 shrink-0 rounded-full bg-sage-300 transition-colors group-hover:bg-brand-500" aria-hidden="true" />
                      <span className="flex-1">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ───────────────────────── Conditions ─────────────────────────

const CONDITION_GROUPS: { label: string; items: string[] }[] = [
  { label: "Mood & anxiety", items: ["Anxiety", "Depression", "OCD", "Bipolar disorder", "Stress & burnout"] },
  { label: "Mind & relationships", items: ["Schizophrenia & psychosis", "Personality disorders", "Relationships & marriage", "Sexual health"] },
  { label: "Addiction", items: ["Alcohol addiction", "Drug addiction", "Gaming & digital addiction"] },
  { label: "Children & elders", items: ["ADHD", "Autism", "Dementia & memory"] },
];

function ConditionsPanel({ id, open }: { id: string; open: boolean }) {
  const byLabel = new Map(CONCERNS.map((c) => [c.label, c]));
  const known = new Set(CONDITION_GROUPS.flatMap((g) => g.items));
  const extra = CONCERNS.filter((c) => !known.has(c.label));
  const groups = extra.length ? [...CONDITION_GROUPS, { label: "More", items: extra.map((c) => c.label) }] : CONDITION_GROUPS;
  return (
    <Shell id={id} open={open} width="w-[min(860px,calc(100vw-2.5rem))]">
      <div className="grid grid-cols-[250px_1fr]">
        <Intro title="Not sure where to start?" text="Tell us what’s on your mind and we’ll point you to the right specialist." cta={{ href: "/book-appointment/", label: "Book a consultation" }} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-5">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-1 flex items-center justify-between border-b border-line px-3 pb-2 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase select-none">
                {g.label}
              </p>
              <ul>
                {g.items.map((label) => {
                  const c = byLabel.get(label);
                  if (!c) return null;
                  return (
                    <li key={c.href + label}>
                      <Link href={c.href} className={clsx(rowLink, "py-2")}>
                        <span className="flex-1">{label}</span>
                        <Arrow className="size-3.5 text-brand-600 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ───────────────────────── Our Team ─────────────────────────

function TeamPanel({ id, item, open, team }: { id: string; item: Item; open: boolean; team?: TeamTeaser }) {
  return (
    <Shell id={id} open={open} width="w-[min(860px,calc(100vw-2.5rem))]">
      <div className="grid grid-cols-[250px_1fr]">
        <Intro title="Our team" text="Psychiatrists and psychologists, with full profiles and areas of expertise." cta={item.href ? { href: item.href, label: "Meet the team" } : undefined}>
          <Link href="/find-a-specialist/" className="mb-5 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-brand-700 shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-brand-900">
            <Icon name="search" className="size-4" /> Not sure who to see? Find the right specialist
          </Link>
          {team && (
            <div className="mb-5">
              <div className="flex -space-x-3" aria-hidden="true">
                {team.faces.slice(0, 5).map((f) => (
                  <span key={f} className="relative size-11 overflow-hidden rounded-full bg-sage-100 ring-2 ring-mist">
                    <Image src={f} alt="" fill sizes="44px" className="object-cover object-[50%_10%]" />
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-ink-soft"><span className="font-display text-2xl font-semibold text-ink">{team.count}</span> specialists in one team</p>
            </div>
          )}
        </Intro>
        <div className="grid max-h-[70vh] grid-cols-2 gap-x-4 overflow-y-auto p-5">
          {item.groups.map((g, gi) => (
            <div key={gi}>
              {g.label && <p className="mb-1 border-b border-line px-3 pb-2 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase select-none">{g.label}</p>}
              <ul>
                {g.links.map((l) => (
                  <li key={l.href ?? l.label}>
                    <Link href={l.href ?? "#"} className={clsx(rowLink, "items-start py-2")}>
                      <Icon name="pin" className="mt-0.5 size-3.5 shrink-0 text-sage-500" />
                      <span className="flex-1">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ───────────────────────── Anything else (Contact Us) ─────────────────────────

function SimplePanel({ id, item, open }: { id: string; item: Item; open: boolean }) {
  return (
    <Shell id={id} open={open} width="w-[300px]" align="right">
      <ul className="p-2">
        {item.groups.flatMap((g) => g.links).map((l) => (
          <li key={l.href ?? l.label}>
            <Link href={l.href ?? "#"} className={rowLink}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function NavPanel({ id, item, open, team }: { id: string; item: Item; open: boolean; team?: TeamTeaser }) {
  if (item.label === "About Us") return <AboutPanel id={id} item={item} open={open} />;
  if (item.label === "Services") return <ServicesPanel id={id} item={item} open={open} />;
  if (item.label === "Conditions") return <ConditionsPanel id={id} open={open} />;
  if (item.label === "Our Team") return <TeamPanel id={id} item={item} open={open} team={team} />;
  return <SimplePanel id={id} item={item} open={open} />;
}
