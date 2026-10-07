"use client";
// Site search: a round button in the header (or press "/" or Ctrl/Cmd+K) opens a small search box over
// the page. It searches the menu pages, conditions, services, locations and team members, all listed
// by the layout, so it works without a server. Arrow keys and Enter work; Escape closes.
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/primitives";

export type SearchItem = { label: string; href: string; group: string; hint?: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export function SiteSearch({ items, popular }: { items: SearchItem[]; popular: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  const results = useMemo(() => {
    const t = norm(q);
    if (!t) return popular;
    const words = t.split(" ");
    return items
      .map((it) => {
        const hay = norm(`${it.label} ${it.hint ?? ""} ${it.group}`);
        const label = norm(it.label);
        if (!words.every((w) => hay.includes(w))) return null;
        return { it, score: (label.startsWith(t) ? 0 : label.includes(t) ? 1 : 2) + (it.group === "Team" ? 0.5 : 0) };
      })
      .filter((x): x is { it: SearchItem; score: number } => !!x)
      .sort((a, b) => a.score - b.score)
      .slice(0, 9)
      .map((x) => x.it);
  }, [q, items, popular]);

  const close = () => {
    setOpen(false);
    setQ("");
    setSel(0);
    opener.current?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName ?? "") || (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the site"
        aria-haspopup="dialog"
        className="grid size-10 place-items-center rounded-full text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-brand-50 hover:text-brand-700 xl:size-11"
      >
        <svg viewBox="0 0 24 24" className="size-[1.15rem]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] grid items-start justify-items-center bg-ink/40 px-4 pt-[10vh] backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-xl overflow-hidden rounded-[1.25rem] bg-white shadow-[0_30px_80px_-20px_rgb(23_34_44/0.5)]">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4.5 4.5" />
              </svg>
              <input
                ref={input}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                  else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSel((s) => Math.min(results.length - 1, s + 1));
                  }
                  else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSel((s) => Math.max(0, s - 1));
                  }
                  else if (e.key === "Enter" && results[sel]) {
                    window.location.assign(results[sel].href);
                    close();
                  }
                }}
                placeholder="Search conditions, services, doctors, locations"
                aria-label="Search"
                role="combobox"
                aria-expanded="true"
                aria-controls="site-search-list"
                aria-activedescendant={results[sel] ? `site-search-${sel}` : undefined}
                className="h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-soft"
              />
              <button type="button" onClick={close} className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-ink">
                Esc
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {!q && <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-ink-soft uppercase">Popular</p>}
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-[0.9375rem] text-ink-soft">
                  Nothing found for “{q}”. Try “anxiety”, “psychometric” or a doctor’s name, or{" "}
                  <Link href="/find-a-specialist/" onClick={close} className="font-semibold text-brand-700 underline underline-offset-2">find a specialist</Link>.
                </p>
              ) : (
                <ul id="site-search-list" role="listbox">
                  {results.map((r, i) => (
                    <li key={`${r.href}|${r.label}`} id={`site-search-${i}`} role="option" aria-selected={i === sel}>
                      <Link
                        href={r.href}
                        onClick={close}
                        onMouseEnter={() => setSel(i)}
                        className={clsx("flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem]", i === sel ? "bg-brand-50 text-brand-800" : "text-ink")}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{r.label}</span>
                          {r.hint && <span className="block truncate text-xs text-ink-soft">{r.hint}</span>}
                        </span>
                        <span className="shrink-0 rounded-full bg-sage-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-sage-700">{r.group}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="hidden border-t border-line px-4 py-2 text-xs text-ink-soft sm:block">
              <Icon name="check" className="mr-1 inline size-3" /> Use ↑ ↓ and Enter. Press “/” anywhere to search.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
