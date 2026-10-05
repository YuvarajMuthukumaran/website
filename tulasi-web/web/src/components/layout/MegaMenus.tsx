"use client";
// Mega menus for About Us, Services and Conditions, in the same visual language
// as the Our Team panel: a midnight "stage" column on the left (icon, headline,
// call to action) and a white column of icon-led links on the right.
// Every link stays in the server HTML: closed panels are hidden with CSS, and
// the inactive Services categories use the `hidden` attribute (still in markup).
import clsx from "clsx";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { Site } from "@/lib/content";
import { CONCERNS } from "@/lib/care";
import { Arrow, BrandIcon, Icon } from "@/components/ui/primitives";

type Item = Site["menu"][number];

/** "i:name" uses a UI icon, anything else a brand icon. */
function Glyph({ name, className = "size-[1.15rem]" }: { name: string; className?: string }) {
  return name.startsWith("i:") ? <Icon name={name.slice(2) as never} className={className} /> : <BrandIcon name={name} className={className} />;
}

/** Panels are centred under the floating pill (the pill is their positioning parent). */
function Shell({ id, open, width, children }: { id: string; open: boolean; width: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      className={clsx(
        "absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-[opacity,transform,visibility] duration-[450ms] ease-[var(--ease-calm)]",
        width,
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
      )}
    >
      <div className="overflow-hidden rounded-[var(--radius-blob)] bg-white shadow-[0_0_0_1px_rgb(15_18_34/0.06),0_0_0_1px_rgb(255_255_255/0.14),0_32px_80px_-24px_rgb(0_0_0/0.6)]">{children}</div>
    </div>
  );
}

/** Staggered rise-in while the panel opens; instant when it closes. */
const rise = (open: boolean, i: number): CSSProperties => ({
  opacity: open ? 1 : 0,
  transform: open ? "none" : "translateY(6px)",
  transition: open ? `opacity 500ms var(--ease-calm) ${60 + i * 28}ms, transform 500ms var(--ease-calm) ${60 + i * 28}ms` : "none",
});

function Stage({ icon, title, text, cta, children }: { icon: string; title: string; text: string; cta?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="on-dark stage relative flex flex-col overflow-clip bg-hero p-7 text-white">
      <div className="beam" aria-hidden="true" />
      <div className="relative">
        <span className="icon-tile icon-tile-dark size-11"><Glyph name={icon} className="size-5" /></span>
        <p className="mt-5 font-display text-xl leading-snug font-bold">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-brand-100/80">{text}</p>
      </div>
      {children}
      {cta && (
        <Link href={cta.href} className="group/btn relative mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-white px-5 text-sm font-semibold text-brand-900">
          {cta.label} <Arrow className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

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
const ABOUT_MAIN = Object.keys(ABOUT);

export function AboutPanel({ id, item, open }: { id: string; item: Item; open: boolean }) {
  const links = item.groups.flatMap((g) => g.links);
  const byHref = new Map(links.map((l) => [l.href, l]));
  const main = ABOUT_MAIN.filter((h) => byHref.has(h));
  const rest = links.filter((l) => l.href && !ABOUT[l.href]);
  return (
    <Shell id={id} open={open} width="w-[min(900px,94vw)]">
      <div className="grid grid-cols-[260px_1fr]">
        <Stage icon="cradle" title="About Tulasi Healthcare" text="Who we are, what we believe in, and how to begin your care with us." cta={item.href ? { href: item.href, label: "About us" } : undefined} />
        <div className="flex flex-col p-6">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
            {main.map((h, i) => {
              const m = ABOUT[h];
              return (
                <li key={h} style={rise(open, i)}>
                  <Link href={h} className="group flex items-center gap-3.5 rounded-[var(--radius-tile)] p-2.5 transition-colors duration-200 hover:bg-brand-50">
                    <span className="icon-tile size-11 shrink-0 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white"><Glyph name={m.icon} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9rem] leading-tight font-semibold text-ink group-hover:text-brand-800">{m.label}</span>
                      <span className="mt-0.5 block text-[0.8rem] leading-snug text-ink-soft">{m.text}</span>
                    </span>
                    <Arrow className="size-3.5 -translate-x-1 text-brand-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul className="mt-auto flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-line pt-4">
            <li className="mr-2 text-[0.7rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">Legal</li>
            {[...rest, ...(byHref.has("/terms-of-use/") ? [byHref.get("/terms-of-use/")!] : []), ...(byHref.has("/privacy-policy/") ? [byHref.get("/privacy-policy/")!] : [])]
              .filter((l, i, a) => a.indexOf(l) === i)
              .map((l) => (
                <li key={l.href ?? l.label}>
                  <Link href={l.href ?? "#"} className="rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-ink/75 transition-colors hover:bg-brand-50 hover:text-brand-800">{l.label}</Link>
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

export function ServicesPanel({ id, item, open }: { id: string; item: Item; open: boolean }) {
  const [active, setActive] = useState(0);
  const groups = item.groups.filter((g) => g.links.length);
  return (
    <Shell id={id} open={open} width="w-[min(1020px,94vw)]">
      <div className="grid grid-cols-[300px_1fr]">
        <Stage icon="psychiatry" title="Our services" text="Treatment, hospital care, rehabilitation, de-addiction and therapies." cta={item.href ? { href: item.href, label: "View all services" } : undefined}>
          <div role="tablist" aria-orientation="vertical" aria-label="Service categories" className="relative mt-6 mb-8 space-y-1">
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
                  style={rise(open, gi)}
                  className={clsx("group flex w-full items-center gap-3 rounded-[var(--radius-tile)] px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-300", on ? "bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]" : "text-brand-100/75 hover:bg-white/[0.06] hover:text-white")}
                >
                  <span className={clsx("grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-300", on ? "bg-white text-brand-700" : "bg-white/[0.06] text-brand-100")}><Glyph name={SERVICE_ICON[g.label ?? ""] ?? "cradle"} className="size-4" /></span>
                  <span className="flex-1 leading-tight">{g.label}</span>
                  <Icon name="chevron" className={clsx("size-3.5 transition-all duration-300", on ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0")} />
                </button>
              );
            })}
          </div>
        </Stage>
        <div className="max-h-[72vh] min-h-[430px] overflow-y-auto p-6">
          {groups.map((g, gi) => (
            <div key={gi} role="tabpanel" id={`${id}-pane-${gi}`} aria-labelledby={`${id}-tab-${gi}`} hidden={gi !== active} className={gi === active ? "step-in" : undefined}>
              <p className="mb-4 flex items-center gap-3 px-2">
                <span className="icon-tile size-10"><Glyph name={SERVICE_ICON[g.label ?? ""] ?? "cradle"} /></span>
                <span>
                  <span className="block font-display text-lg leading-tight font-bold text-ink">{g.label}</span>
                  <span className="text-xs text-ink-soft">{g.links.length} {g.links.length === 1 ? "page" : "pages"}</span>
                </span>
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {g.links.map((l) => (
                  <li key={l.href ?? l.label}>
                    <Link href={l.href ?? "#"} className="group flex items-start gap-2.5 rounded-[var(--radius-tile)] px-2 py-2 text-[0.875rem] leading-snug text-ink/80 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-800">
                      <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-brand-200 transition-colors group-hover:bg-brand-600" aria-hidden="true" />
                      <span className="flex-1">{l.label}</span>
                      <Arrow className="mt-0.5 size-3.5 -translate-x-1 text-brand-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
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

const CONDITION_GROUPS: { label: string; icon: string; items: string[] }[] = [
  { label: "Mood & anxiety", icon: "breath", items: ["Anxiety", "Depression", "OCD", "Bipolar disorder", "Stress & burnout"] },
  { label: "Mind & relationships", icon: "therapy", items: ["Schizophrenia & psychosis", "Personality disorders", "Relationships & marriage", "Sexual health"] },
  { label: "Addiction", icon: "sprout", items: ["Alcohol addiction", "Drug addiction", "Gaming & digital addiction"] },
  { label: "Children & elders", icon: "child", items: ["ADHD", "Autism", "Dementia & memory"] },
];
const CONDITION_ICON: Record<string, string> = {
  Anxiety: "breath",
  Depression: "moon",
  OCD: "link",
  "Bipolar disorder": "balance",
  "Stress & burnout": "sunrise",
  "Schizophrenia & psychosis": "waves",
  "Personality disorders": "therapy",
  "Relationships & marriage": "family",
  "Sexual health": "i:heart",
  "Alcohol addiction": "sprout",
  "Drug addiction": "sprout",
  "Gaming & digital addiction": "sprout",
  ADHD: "i:spark",
  Autism: "child",
  "Dementia & memory": "memory",
};

export function ConditionsPanel({ id, open }: { id: string; open: boolean }) {
  const byLabel = new Map(CONCERNS.map((c) => [c.label, c]));
  const known = new Set(CONDITION_GROUPS.flatMap((g) => g.items));
  const extra = CONCERNS.filter((c) => !known.has(c.label));
  const groups = extra.length ? [...CONDITION_GROUPS, { label: "More", icon: "cradle", items: extra.map((c) => c.label) }] : CONDITION_GROUPS;
  let n = 0;
  return (
    <Shell id={id} open={open} width="w-[min(940px,94vw)]">
      <div className="grid grid-cols-[260px_1fr]">
        <Stage icon="cradle" title="Not sure where to start?" text="Tell us who the care is for and what’s going on. We’ll point you to the right specialist." cta={{ href: "/book-appointment/", label: "Book a consultation" }} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-6">
          {groups.map((g) => (
            <div key={g.label}>
              {/* A label, not a control: no icon tile, no hover, a rule underneath. */}
              <p className="mb-2 flex items-center gap-2.5 border-b border-line px-2 pb-2 select-none" role="presentation">
                <span className="h-3.5 w-1 rounded-full bg-accent-600" aria-hidden="true" />
                <span className="text-[0.7rem] font-bold tracking-[0.16em] text-ink uppercase">{g.label}</span>
                <span className="ml-auto text-[0.7rem] font-medium text-ink-soft">{g.items.length}</span>
              </p>
              <ul className="space-y-0.5">
                {g.items.map((label) => {
                  const c = byLabel.get(label);
                  if (!c) return null;
                  return (
                    <li key={c.href + label} style={rise(open, n++)}>
                      <Link href={c.href} className="group flex items-center gap-3 rounded-[var(--radius-tile)] px-2 py-1.5 text-[0.875rem] leading-snug font-medium text-ink/85 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-800">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 transition-colors duration-300 group-hover:bg-brand-600 group-hover:text-white"><Glyph name={CONDITION_ICON[label] ?? "cradle"} className="size-4" /></span>
                        <span className="flex-1">{label}</span>
                        <Arrow className="size-3.5 -translate-x-1 text-brand-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
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
