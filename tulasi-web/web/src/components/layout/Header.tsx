"use client";
// Site header: a plain white bar that stays at the top while you scroll. Calm
// dropdown panels on desktop (see MegaMenus.tsx), a clean full-screen menu on phones.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Site } from "@/lib/content";
import { CONCERNS } from "@/lib/care";
import { Icon } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { NavPanel, type TeamTeaser } from "./MegaMenus";

export type { TeamTeaser };
type Menu = Site["menu"];
type Item = Menu[number];

/** Clicking a link to the page you are on (logo) scrolls back to the top. */
function scrollTopIfCurrent(e: React.MouseEvent<HTMLAnchorElement>, href: string | null, pathname: string | null) {
  if (!href || href !== pathname || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return false;
  e.preventDefault();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  document.getElementById("main")?.focus({ preventScroll: true });
  return true;
}

// The Conditions menu: existing condition pages only (lib/care.ts).
const CONDITIONS: Item = {
  label: "Conditions",
  href: null,
  groups: [{ label: null, links: CONCERNS.map((c) => ({ label: c.label, href: c.href })) }],
};

// Home is the logo; the Employee Assistance Program lives inside Services.
const HIDDEN = new Set(["Home", "Employee Assistance Program"]);
const ORDER = ["About Us", "Services", "Conditions", "Our Team", "Blog", "Contact Us"];

export function Header({ menu, phone, logo, team }: { menu: Menu; phone: { display: string; href: string }; logo: { src: string; alt: string }; team?: TeamTeaser }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const items: Item[] = [...menu.filter((m) => !HIDDEN.has(m.label)), CONDITIONS].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Close the menus whenever the page changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // The dropdown panels hold about 70 KB of links. Render each one the first time it is opened, not on every page load.
  const [built, setBuilt] = useState<number[]>([]);
  if (open !== null && !built.includes(open)) setBuilt([...built, open]);

  const enter = (i: number) => {
    clearTimeout(closeTimer.current);
    setOpen(i);
  };
  const leave = () => {
    closeTimer.current = setTimeout(() => setOpen(null), 160);
  };

  // No backdrop-filter on the header: it would turn the fixed mobile menu into a header-sized box.
  // While the menu is open the header rises above the floating buttons (z-55).
  return (
    <header className={clsx("sticky top-0 border-b border-line bg-white transition-shadow duration-300", mobile ? "z-[80]" : "z-50", scrolled && "shadow-[0_6px_20px_-14px_rgb(23_34_44/0.25)]")}>
      <div className="container-page relative flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link href="/" onClick={(e) => scrollTopIfCurrent(e, "/", pathname)} className="flex shrink-0 items-center gap-3 rounded-xl" aria-label="Tulasi Healthcare home">
          <Image src={logo.src} alt={logo.alt || "Tulasi Healthcare"} width={44} height={44} priority className="h-10 w-10 object-contain" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.0625rem] font-semibold tracking-[-0.015em] text-ink">Tulasi Healthcare</span>
            <span className="mt-1 hidden text-[0.6875rem] font-medium tracking-[0.04em] text-ink-soft sm:block">Mental health &amp; rehabilitation</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden min-[1340px]:block">
          <ul className="flex items-center">
            {items.map((item, i) => {
              const hasPanel = item.groups.some((g) => g.links.length);
              const active = item.href && (pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)));
              const base = "whitespace-nowrap rounded-full px-3 py-2 2xl:px-3.5 text-[0.9375rem] font-medium transition-colors duration-200";
              return (
                <li key={item.label} onMouseEnter={() => hasPanel && enter(i)} onMouseLeave={leave}>
                  <div className="flex items-center">
                    {item.href ? (
                      <Link href={item.href} onClick={(e) => scrollTopIfCurrent(e, item.href, pathname)} className={clsx(base, active ? "text-brand-700" : "text-ink hover:text-brand-700")}>
                        {item.label}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => setOpen(open === i ? null : i)} className={clsx(base, open === i ? "text-brand-700" : "text-ink hover:text-brand-700")} aria-expanded={open === i} aria-controls={`menu-panel-${i}`}>
                        {item.label}
                      </button>
                    )}
                    {hasPanel && item.href && (
                      <button type="button" className="-ml-2 grid size-7 place-items-center rounded-full text-ink-soft hover:text-brand-700" aria-expanded={open === i} aria-controls={`menu-panel-${i}`} aria-label={`${item.label} submenu`} onClick={() => setOpen(open === i ? null : i)}>
                        <Icon name="chevron" className={clsx("size-3.5 rotate-90 transition-transform duration-300", open === i && "-rotate-90")} />
                      </button>
                    )}
                    {hasPanel && !item.href && <Icon name="chevron" className={clsx("-ml-2 size-3.5 rotate-90 text-ink-soft transition-transform duration-300", open === i && "-rotate-90")} />}
                  </div>
                  {hasPanel && (built.includes(i) || open === i) && <NavPanel id={`menu-panel-${i}`} item={item} open={open === i} team={item.label === "Our Team" ? team : undefined} />}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href={phone.href} onClick={() => track("call_click", { location: "header" })} className="hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm font-semibold text-ink hover:text-brand-700 md:inline-flex">
            <Icon name="phone" className="size-4 text-sage-600" /> <span className="hidden 2xl:inline">{phone.display}</span><span className="2xl:hidden">Call us</span>
          </a>
          <Link href="/book-appointment/" className="hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-full bg-brand-600 px-5 text-[0.9375rem] font-semibold text-white transition-colors duration-300 hover:bg-brand-700 sm:inline-flex">
            Book appointment
          </Link>
          <button type="button" className="grid size-11 place-items-center rounded-full text-ink hover:bg-mist min-[1340px]:hidden" aria-expanded={mobile} aria-controls="mobile-menu" onClick={() => setMobile(true)}>
            <Icon name="menu" className="size-6" />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      <MobileMenu open={mobile} onClose={() => setMobile(false)} items={items} phone={phone} pathname={pathname} logo={logo} />
    </header>
  );
}

function MobileMenu({ open, onClose, items, phone, pathname, logo }: { open: boolean; onClose: () => void; items: Item[]; phone: { display: string; href: string }; pathname: string | null; logo: { src: string; alt: string } }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const uid = useId();
  if (!open) return null;
  return (
    // fixed!: the menu must cover the whole screen and sit above the floating buttons (z-55).
    <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="menu-in fixed! inset-0 z-[80] flex h-dvh flex-col bg-white">
      <div className="container-page flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line">
        <Link href="/" onClick={onClose} className="flex items-center gap-3">
          <Image src={logo.src} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="font-display text-[1.0625rem] font-semibold text-ink">Tulasi Healthcare</span>
        </Link>
        <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full text-ink hover:bg-mist" autoFocus>
          <Icon name="close" className="size-6" />
          <span className="sr-only">Close menu</span>
        </button>
      </div>
      <nav aria-label="Mobile" className="container-page flex-1 overflow-y-auto overscroll-contain pb-6">
        <ul>
          {items.map((item, i) => {
            const hasPanel = item.groups.some((g) => g.links.length);
            const isOpen = expanded === i;
            return (
              <li key={item.label} className="border-b border-line">
                <div className="flex items-center justify-between">
                  {item.href && !hasPanel ? (
                    <Link href={item.href} onClick={onClose} className={clsx("block flex-1 py-4 font-display text-xl font-semibold", pathname === item.href ? "text-brand-700" : "text-ink")}>
                      {item.label}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => setExpanded(isOpen ? null : i)} className="flex flex-1 items-center justify-between py-4 text-left font-display text-xl font-semibold text-ink" aria-expanded={isOpen} aria-controls={`${uid}-sub-${i}`}>
                      {item.label}
                      <Icon name="plus" className={clsx("size-5 text-ink-soft transition-transform duration-300", isOpen && "rotate-45")} />
                    </button>
                  )}
                </div>
                {hasPanel && (
                  <div id={`${uid}-sub-${i}`} hidden={!isOpen} className="pb-4">
                    {item.href && (
                      <Link href={item.href} onClick={onClose} className="mb-1 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand-50 px-4 text-sm font-semibold text-brand-700">
                        All {item.label.toLowerCase()} <Icon name="arrow" className="size-4" />
                      </Link>
                    )}
                    {item.groups.map((g, gi) => (
                      <div key={gi} className="mt-3">
                        {g.label && <p className="mb-1 text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">{g.label}</p>}
                        <ul>
                          {g.links.map((l) => (
                            <li key={l.href ?? l.label}>
                              <Link href={l.href ?? "#"} onClick={onClose} className="block rounded-lg py-2.5 text-[0.9375rem] leading-snug text-ink-soft hover:text-brand-700">{l.label}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 grid gap-2">
          <Link href="/find-a-specialist/" onClick={onClose} className="flex min-h-12 items-center justify-between rounded-2xl bg-sage-50 px-4 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
            Find the right specialist <Icon name="arrow" className="size-4 text-sage-600" />
          </Link>
          <Link href="/mental-health-check/" onClick={onClose} className="flex min-h-12 items-center justify-between rounded-2xl bg-sage-50 px-4 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
            Free 2-minute check-in <Icon name="arrow" className="size-4 text-sage-600" />
          </Link>
        </div>
      </nav>
      <div className="container-page grid shrink-0 gap-3 border-t border-line bg-white pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* The crisis bar is hidden behind this full-screen menu, so help stays one tap away here. */}
        <a href="tel:14416" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-alert-50 text-sm font-semibold text-alert-700 shadow-[inset_0_0_0_1px_var(--color-alert-100)]">
          <Icon name="heart" className="size-4" /> In crisis? Call 14416 (free, 24×7)
        </a>
        <Link href="/book-appointment/" onClick={onClose} className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700">
          <Icon name="calendar" className="size-5" /> Book appointment
        </Link>
        <a href={phone.href} className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-full bg-white font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)]">
          <Icon name="phone" className="size-5 text-sage-600" /> {phone.display}
        </a>
      </div>
    </div>
  );
}
