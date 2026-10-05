"use client";
// Floating glass-pill navigation. Tightens on scroll; mega menus for the
// live menu's panels plus a Conditions panel (links to existing condition
// pages). Every menu link is in the server HTML (closed panels are hidden
// with CSS, not removed), so crawlers keep all of the live site's internal links.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Site } from "@/lib/content";
import { CONCERNS } from "@/lib/care";
import { Arrow, BrandIcon, Icon } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { AboutPanel, ConditionsPanel, ServicesPanel } from "./MegaMenus";

type Menu = Site["menu"];
type Item = Menu[number];

/** Clicking a link to the page you are on (logo / Home on the home page) scrolls back to the top. */
function scrollTopIfCurrent(e: React.MouseEvent<HTMLAnchorElement>, href: string | null, pathname: string | null) {
  if (!href || href !== pathname || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return false;
  e.preventDefault();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  document.getElementById("main")?.focus({ preventScroll: true });
  return true;
}

// The Conditions mega-menu: existing condition pages only (lib/care.ts).
const CONDITIONS: Item = {
  label: "Conditions",
  href: null,
  groups: [{ label: null, links: CONCERNS.map((c) => ({ label: c.label, href: c.href })) }],
};

// These panels are centred under the whole pill, so their <li> must not be the positioning parent.
const BIG_PANELS = new Set(["About Us", "Services", "Conditions"]);

export type TeamTeaser = { faces: string[]; count: number };

export function Header({ menu, phone, logo, team }: { menu: Menu; phone: { display: string; href: string }; logo: { src: string; alt: string }; team?: TeamTeaser }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Services first, then Conditions, then the rest of the live menu.
  const items: Item[] = (() => {
    const i = menu.findIndex((m) => m.label === "Services");
    return i < 0 ? [...menu, CONDITIONS] : [...menu.slice(0, i + 1), CONDITIONS, ...menu.slice(i + 1)];
  })();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setOpen(null);
    setMobile(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const enter = (i: number) => {
    clearTimeout(closeTimer.current);
    setOpen(i);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 180);
  };

  return (
    // Negative bottom margin: the page (dark hero) flows underneath the floating pill.
    <header className="sticky top-0 z-50 -mb-[78px] h-[78px] px-3 pt-3 sm:px-4">
      <div
        className={clsx(
          "glass relative mx-auto flex items-center justify-between gap-3 rounded-full pr-2 pl-3 transition-[max-width,height,box-shadow] duration-[700ms] ease-[var(--ease-calm)] sm:pl-4",
          scrolled ? "h-[58px] max-w-[1180px]" : "h-[66px] max-w-[1240px]"
        )}
      >
        <Link href="/" onClick={(e) => scrollTopIfCurrent(e, "/", pathname)} className="flex shrink-0 items-center gap-2.5 rounded-full" aria-label="Tulasi Healthcare home">
          <Image src={logo.src} alt={logo.alt || "Tulasi Healthcare"} width={44} height={44} priority className={clsx("h-auto transition-[width] duration-[700ms] ease-[var(--ease-calm)]", scrolled ? "w-9" : "w-11")} />
          <span className="flex flex-col leading-none xl:hidden 2xl:flex">
            <span className="font-display text-[0.98rem] font-bold tracking-[-0.02em] text-brand-900">Tulasi Healthcare</span>
            <span className="mt-1 hidden text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-soft sm:block">Mental health &amp; rehabilitation</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center">
            {items.map((item, i) => {
              const hasPanel = item.groups.some((g) => g.links.length);
              const active = item.href && (pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)));
              return (
                <li key={item.label} className={clsx(!BIG_PANELS.has(item.label) && "relative")} onMouseEnter={() => hasPanel && enter(i)} onMouseLeave={leave}>
                  <div className="flex items-center">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={(e) => scrollTopIfCurrent(e, item.href, pathname)}
                        className={clsx("whitespace-nowrap rounded-full px-3 py-2 text-[0.875rem] font-medium transition-colors duration-200", active ? "text-brand-700" : "text-ink/80 hover:text-ink")}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => setOpen(open === i ? null : i)} className="whitespace-nowrap rounded-full px-3 py-2 text-[0.875rem] font-medium text-ink/80 hover:text-ink" aria-expanded={open === i} aria-controls={`menu-panel-${i}`}>
                        {item.label}
                      </button>
                    )}
                    {hasPanel && item.href && (
                      <button
                        type="button"
                        className="-ml-2.5 grid size-7 place-items-center rounded-full text-ink-soft hover:text-brand-700"
                        aria-expanded={open === i}
                        aria-controls={`menu-panel-${i}`}
                        aria-label={`${item.label} submenu`}
                        onClick={() => setOpen(open === i ? null : i)}
                      >
                        <Icon name="chevron" className={clsx("size-3.5 rotate-90 transition-transform duration-300", open === i && "-rotate-90")} />
                      </button>
                    )}
                    {hasPanel && !item.href && <Icon name="chevron" className={clsx("-ml-2 size-3.5 rotate-90 text-ink-soft transition-transform duration-300", open === i && "-rotate-90")} />}
                  </div>
                  {hasPanel && <MegaPanel id={`menu-panel-${i}`} item={item} open={open === i} team={item.label === "Our Team" ? team : undefined} />}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <a href={phone.href} onClick={() => track("call_click", { location: "header" })} className="hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-semibold text-brand-900 hover:bg-brand-50 md:inline-flex xl:hidden">
            <Icon name="phone" className="size-4" /> {phone.display}
          </a>
          <Link
            href="/book-appointment/"
            className="group/btn hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-full bg-accent-600 px-5 text-[0.875rem] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_20px_-10px_rgb(215_20_31/0.8)] transition-[transform,background-color] duration-300 hover:-translate-y-px hover:bg-[#c8121c] sm:inline-flex"
          >
            Book Appointment <Arrow className="size-3.5" />
          </Link>
          <button type="button" className="grid size-11 place-items-center rounded-full text-brand-900 hover:bg-brand-50 xl:hidden" aria-expanded={mobile} aria-controls="mobile-menu" onClick={() => setMobile(true)}>
            <Icon name="menu" className="size-6" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      <MobileMenu open={mobile} onClose={() => setMobile(false)} items={items} phone={phone} pathname={pathname} />
    </header>
  );
}

function MegaPanel({ id, item, open, team }: { id: string; item: Item; open: boolean; team?: TeamTeaser }) {
  if (team) return <TeamPanel id={id} item={item} open={open} team={team} />;
  if (item.label === "About Us") return <AboutPanel id={id} item={item} open={open} />;
  if (item.label === "Services") return <ServicesPanel id={id} item={item} open={open} />;
  if (item.label === "Conditions") return <ConditionsPanel id={id} open={open} />;
  const count = item.groups.reduce((n, g) => n + g.links.length, 0);
  const wide = count > 14;
  const conditions = item.label === "Conditions";
  return (
    <div
      id={id}
      className={clsx(
        "absolute top-full pt-4 transition-[opacity,transform,visibility] duration-[450ms] ease-[var(--ease-calm)]",
        wide ? "left-1/2 w-[min(1160px,94vw)] -translate-x-1/2" : conditions ? "left-1/2 w-[640px] -translate-x-1/2" : "left-0 w-[300px]",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
      )}
    >
      <div className="overflow-hidden rounded-[var(--radius-blob)] bg-white shadow-[0_0_0_1px_rgb(15_18_34/0.06),0_24px_64px_-24px_rgb(3_11_58/0.45)]">
        <div className={clsx(wide && "grid grid-cols-[280px_1fr]")}>
          {wide && (
            <div className="on-dark stage relative flex flex-col justify-between overflow-clip bg-hero p-7 text-white">
              <div>
                <span className="icon-tile icon-tile-dark size-11"><BrandIcon name="cradle" /></span>
                <p className="mt-5 font-display text-xl leading-snug font-bold">Not sure where to start?</p>
                <p className="mt-2 text-sm leading-relaxed text-brand-100/80">Tell us who the care is for and what’s going on. We’ll point you to the right specialist.</p>
              </div>
              <Link href="/book-appointment/" className="group/btn mt-8 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-white px-5 text-sm font-semibold text-brand-900">
                Book a consultation <Arrow className="size-3.5" />
              </Link>
            </div>
          )}
          <div className={clsx("max-h-[72vh] overflow-y-auto p-6", wide && "columns-3 gap-8", conditions && "grid grid-cols-2 gap-x-6")}>
            {item.groups.map((g, gi) => (
              <div key={gi} className={clsx("break-inside-avoid", wide && "mb-6", conditions && "contents")}>
                {g.label && <p className="mb-2 px-2 text-[0.7rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">{g.label}</p>}
                <ul className={clsx(conditions ? "contents" : "space-y-0.5")}>
                  {g.links.map((l) => (
                    <li key={l.href ?? l.label}>
                      <Link href={l.href ?? "#"} className="group flex items-center justify-between gap-3 rounded-[var(--radius-tile)] px-2 py-2 text-[0.875rem] leading-snug text-ink/80 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-800">
                        {l.label}
                        <Arrow className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Our Team: the specialists up front, then psychiatrists / psychologists by city. */
function TeamPanel({ id, item, open, team }: { id: string; item: Item; open: boolean; team: TeamTeaser }) {
  return (
    <div
      id={id}
      className={clsx(
        "absolute top-full right-[-4rem] w-[min(820px,94vw)] pt-4 transition-[opacity,transform,visibility] duration-[450ms] ease-[var(--ease-calm)]",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1.5 opacity-0"
      )}
    >
      <div className="grid grid-cols-[260px_1fr] overflow-hidden rounded-[var(--radius-blob)] bg-white shadow-[0_0_0_1px_rgb(15_18_34/0.06),0_0_0_1px_rgb(255_255_255/0.14),0_32px_80px_-24px_rgb(0_0_0/0.6)]">
        <div className="on-dark stage relative flex flex-col justify-between overflow-clip bg-hero p-7 text-white">
          <div className="beam" aria-hidden="true" />
          <div className="relative">
            <div className="flex -space-x-3" aria-hidden="true">
              {team.faces.slice(0, 5).map((f) => (
                <span key={f} className="relative size-12 overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_85%,#fff,#c9d5ff_50%,#85a2f9)] ring-2 ring-[#0e266e]">
                  <Image src={f} alt="" fill sizes="48px" className="object-cover object-[50%_10%]" />
                </span>
              ))}
            </div>
            <p className="mt-6 font-display text-[2.5rem] leading-none font-extrabold tracking-[-0.04em]">{team.count}</p>
            <p className="mt-1 text-sm font-semibold text-brand-100">specialists in one team</p>
            <p className="mt-4 text-sm leading-relaxed text-brand-100/75">Psychiatrists and psychologists, with full profiles and areas of expertise.</p>
          </div>
          {item.href && (
            <Link href={item.href} className="group/btn relative mt-8 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-white px-5 text-sm font-semibold text-brand-900">
              Meet the team <Arrow className="size-3.5" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6 p-6">
          {item.groups.map((g, gi) => (
            <div key={gi}>
              {g.label && (
                <p className="mb-3 flex items-center gap-2.5 px-2">
                  <span className="icon-tile size-9"><BrandIcon name={gi === 0 ? "psychiatry" : "therapy"} className="size-4" /></span>
                  <span className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">{g.label}</span>
                </p>
              )}
              <ul className="space-y-0.5">
                {g.links.map((l) => (
                  <li key={l.href ?? l.label}>
                    <Link href={l.href ?? "#"} className="group flex items-start gap-2.5 rounded-[var(--radius-tile)] px-2 py-2 text-[0.875rem] leading-snug text-ink/80 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-800">
                      <Icon name="pin" className="mt-0.5 size-3.5 shrink-0 text-brand-400 transition-colors group-hover:text-brand-600" />
                      <span className="flex-1">{l.label}</span>
                      <Arrow className="mt-0.5 size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ open, onClose, items, phone, pathname }: { open: boolean; onClose: () => void; items: Item[]; phone: { display: string; href: string }; pathname: string | null }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const uid = useId();
  if (!open) return null;
  return (
    <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="menu-in on-dark stage fixed inset-0 z-[60] flex flex-col overflow-clip bg-hero text-white">
      <div className="container-page flex h-20 items-center justify-between">
        <span className="font-display text-lg font-bold">Tulasi Healthcare</span>
        <button type="button" onClick={onClose} className="grid size-12 place-items-center rounded-full bg-white/[0.06] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] hover:bg-white/10" autoFocus>
          <Icon name="close" className="size-5" />
          <span className="sr-only">Close menu</span>
        </button>
      </div>
      <nav aria-label="Mobile" className="container-page flex-1 overflow-y-auto pb-8">
        <ul>
          {items.map((item, i) => {
            const hasPanel = item.groups.some((g) => g.links.length);
            return (
              <li key={item.label} className="menu-item-in border-b border-white/10" style={{ animationDelay: `${0.05 * i + 0.08}s` }}>
                <div className="flex items-center justify-between">
                  {item.href ? (
                    <Link href={item.href} onClick={(e) => scrollTopIfCurrent(e, item.href, pathname) && onClose()} className="block flex-1 py-4 font-display text-[1.75rem] font-semibold tracking-[-0.03em]">
                      {item.label}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => setExpanded(expanded === i ? null : i)} className="block flex-1 py-4 text-left font-display text-[1.75rem] font-semibold tracking-[-0.03em]">
                      {item.label}
                    </button>
                  )}
                  {hasPanel && (
                    <button type="button" className="grid size-12 place-items-center rounded-full hover:bg-white/10" aria-expanded={expanded === i} aria-controls={`${uid}-sub-${i}`} onClick={() => setExpanded(expanded === i ? null : i)}>
                      <Icon name="plus" className={clsx("size-5 transition-transform duration-300", expanded === i && "rotate-45")} />
                      <span className="sr-only">{item.label} submenu</span>
                    </button>
                  )}
                </div>
                <div id={`${uid}-sub-${i}`} hidden={expanded !== i} className="pb-4">
                  {item.groups.map((g, gi) => (
                    <div key={gi} className="mt-2">
                      {g.label && <p className="mb-1 text-[0.7rem] font-semibold tracking-[0.14em] text-brand-200 uppercase">{g.label}</p>}
                      <ul>
                        {g.links.map((l) => (
                          <li key={l.href ?? l.label}>
                            <Link href={l.href ?? "#"} className="block py-2 text-brand-50/85 hover:text-white">{l.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 grid gap-3">
          <Link href="/book-appointment/" className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold">
            <Icon name="calendar" /> Book Appointment
          </Link>
          <a href={phone.href} className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-white/[0.06] font-semibold shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]">
            <Icon name="phone" /> {phone.display}
          </a>
        </div>
      </nav>
    </div>
  );
}
