"use client";
// Sticky glass header that shrinks on scroll, a mega menu on desktop and a
// full-screen staggered menu on mobile. Every menu link is in the server HTML
// (closed panels are hidden with CSS, not removed), so crawlers keep the same
// internal links the live QuadMenu provides today.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Site } from "@/lib/content";
import { Icon } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";

type Menu = Site["menu"];

/**
 * Clicking a link to the page you are already on (the logo or "Home" on the
 * home page) scrolls smoothly back to the top instead of doing nothing.
 */
function scrollTopIfCurrent(e: React.MouseEvent<HTMLAnchorElement>, href: string | null, pathname: string | null) {
  if (!href || href !== pathname || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return false;
  e.preventDefault();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  document.getElementById("main")?.focus({ preventScroll: true });
  return true;
}

export function Header({ menu, phone, logo }: { menu: Menu; phone: { display: string; href: string }; logo: { src: string; alt: string } }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    closeTimer.current = setTimeout(() => setOpen(null), 160);
  };

  return (
    <header className="sticky top-0 z-50">
      <div
        className={clsx(
          "transition-all duration-500 ease-[var(--ease-calm)]",
          scrolled ? "glass shadow-[var(--shadow-soft)]" : "bg-white/95 backdrop-blur-sm border-b border-transparent"
        )}
      >
        <div className={clsx("container-page flex items-center justify-between gap-4 transition-[height] duration-500 ease-[var(--ease-calm)]", scrolled ? "h-16" : "h-20")}>
          <Link href="/" onClick={(e) => scrollTopIfCurrent(e, "/", pathname)} className="flex shrink-0 items-center gap-3 rounded-xl" aria-label="Tulasi Healthcare home">
            <Image src={logo.src} alt={logo.alt || "Tulasi Healthcare"} width={56} height={56} priority className={clsx("h-auto transition-all duration-500", scrolled ? "w-11" : "w-14")} />
            <span className="hidden flex-col leading-tight sm:flex xl:hidden">
              <span className="font-display text-[1.05rem] font-bold tracking-tight text-brand-900">Tulasi Healthcare</span>
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-soft">Mental health &amp; rehabilitation</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {menu.map((item, i) => {
                const hasPanel = item.groups.some((g) => g.links.length);
                return (
                  <li key={item.label} className="relative" onMouseEnter={() => hasPanel && enter(i)} onMouseLeave={leave}>
                    <div className="flex items-center">
                      <Link
                        href={item.href ?? "#"}
                        onClick={(e) => scrollTopIfCurrent(e, item.href, pathname)}
                        className={clsx("whitespace-nowrap rounded-full px-2.5 py-2 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-brand-50 hover:text-brand-700", pathname === item.href && "text-brand-700")}
                      >
                        {item.label}
                      </Link>
                      {hasPanel && (
                        <button
                          type="button"
                          className="-ml-2 grid size-8 place-items-center rounded-full text-ink-soft hover:text-brand-700"
                          aria-expanded={open === i}
                          aria-controls={`menu-panel-${i}`}
                          aria-label={`${item.label} submenu`}
                          onClick={() => setOpen(open === i ? null : i)}
                        >
                          <Icon name="chevron" className={clsx("size-4 rotate-90 transition-transform", open === i && "-rotate-90")} />
                        </button>
                      )}
                    </div>
                    {hasPanel && <MegaPanel id={`menu-panel-${i}`} item={item} open={open === i} wide={item.groups.reduce((n, g) => n + g.links.length, 0) > 14} />}
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={phone.href}
              onClick={() => track("call_click", { location: "header" })}
              className="hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50 md:inline-flex xl:hidden"
            >
              <Icon name="phone" className="size-4" />
              {phone.display}
            </a>
            <Link
              href="/book-appointment/"
              className="hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-full bg-accent-600 px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgb(215_20_31/0.7)] transition hover:-translate-y-0.5 hover:bg-accent-700 sm:inline-flex"
            >
              <Icon name="calendar" className="size-4" />
              Book Appointment
            </Link>
            <button
              type="button"
              className="grid size-12 place-items-center rounded-full text-brand-900 hover:bg-brand-50 xl:hidden"
              aria-expanded={mobile}
              aria-controls="mobile-menu"
              onClick={() => setMobile(true)}
            >
              <Icon name="menu" className="size-6" />
              <span className="sr-only">Open menu</span>
            </button>
          </div>
        </div>
      </div>

      <MobileMenu open={mobile} onClose={() => setMobile(false)} menu={menu} phone={phone} pathname={pathname} />
    </header>
  );
}

function MegaPanel({ id, item, open, wide }: { id: string; item: Menu[number]; open: boolean; wide: boolean }) {
  return (
    <div
      id={id}
      className={clsx(
        "absolute top-full pt-3 transition-all duration-300 ease-[var(--ease-calm)]",
        wide ? "left-1/2 w-[min(1100px,92vw)] -translate-x-1/2" : "left-0 w-80",
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
      )}
    >
      <div className={clsx("glass rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-lift)]", wide && "max-h-[75vh] overflow-y-auto")}>
        <div className={clsx(wide ? "columns-2 gap-8 lg:columns-4" : "")}>
          {item.groups.map((g, gi) => (
            <div key={gi} className="mb-5 break-inside-avoid">
              {g.label && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent-600">{g.label}</p>}
              <ul className="space-y-0.5">
                {g.links.map((l) => (
                  <li key={l.href ?? l.label}>
                    <Link href={l.href ?? "#"} className="block rounded-lg px-2 py-1.5 text-[0.9rem] leading-snug text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-700">
                      {l.label}
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

function MobileMenu({ open, onClose, menu, phone, pathname }: { open: boolean; onClose: () => void; menu: Menu; phone: { display: string; href: string }; pathname: string | null }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const uid = useId();
  return (
    <>
      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" className="menu-in on-dark fixed inset-0 z-[60] flex flex-col bg-hero text-white">
          <div className="container-page flex h-20 items-center justify-between">
            <span className="font-display text-lg font-bold">Tulasi Healthcare</span>
            <button type="button" onClick={onClose} className="grid size-12 place-items-center rounded-full hover:bg-white/10" autoFocus>
              <Icon name="close" className="size-6" />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Mobile" className="container-page flex-1 overflow-y-auto pb-8">
            <ul>
              {menu.map((item, i) => (
                <li key={item.label} className="menu-item-in border-b border-white/10" style={{ animationDelay: `${0.06 * i + 0.1}s` }}>
                  <div className="flex items-center justify-between">
                    <Link href={item.href ?? "#"} onClick={(e) => scrollTopIfCurrent(e, item.href, pathname) && onClose()} className="block flex-1 py-4 font-display text-2xl font-semibold">
                      {item.label}
                    </Link>
                    {item.groups.some((g) => g.links.length) && (
                      <button
                        type="button"
                        className="grid size-12 place-items-center rounded-full hover:bg-white/10"
                        aria-expanded={expanded === i}
                        aria-controls={`${uid}-sub-${i}`}
                        onClick={() => setExpanded(expanded === i ? null : i)}
                      >
                        <Icon name="plus" className={clsx("size-5 transition-transform", expanded === i && "rotate-45")} />
                        <span className="sr-only">{item.label} submenu</span>
                      </button>
                    )}
                  </div>
                  <div id={`${uid}-sub-${i}`} hidden={expanded !== i} className="pb-4">
                    {item.groups.map((g, gi) => (
                      <div key={gi} className="mt-2">
                        {g.label && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-200">{g.label}</p>}
                        <ul>
                          {g.links.map((l) => (
                            <li key={l.href ?? l.label}>
                              <Link href={l.href ?? "#"} className="block py-2 text-brand-50/90 hover:text-white">
                                {l.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-3">
              <Link href="/book-appointment/" className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold">
                <Icon name="calendar" /> Book Appointment
              </Link>
              <a href={phone.href} className="flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/30 font-semibold">
                <Icon name="phone" /> {phone.display}
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
