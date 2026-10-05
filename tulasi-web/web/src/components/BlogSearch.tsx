"use client";
// Instant blog search over a small title/excerpt index (/search-index.json),
// fetched the first time someone focuses the box. Supports /blog/?q=... links.
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/primitives";

type Item = { t: string; p: string; e: string; d: string };

export function BlogSearch() {
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Item[] | null>(null);
  const loading = useRef(false);

  const load = () => {
    if (index || loading.current) return;
    loading.current = true;
    fetch("/search-index.json").then((r) => r.json()).then(setIndex).catch(() => (loading.current = false));
  };
  // /blog/?q=... (the site search in Google results): read after hydration so
  // the search box is part of the server HTML.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      setQ(initial);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (!index || !terms.length) return [];
    return index
      .map((it) => {
        const hay = `${it.t} ${it.e}`.toLowerCase();
        const score = terms.reduce((s, t) => s + (it.t.toLowerCase().includes(t) ? 3 : hay.includes(t) ? 1 : 0), 0);
        return { it, score, all: terms.every((t) => hay.includes(t)) };
      })
      .filter((r) => r.all)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((r) => r.it);
  }, [q, index]);

  return (
    <div className="relative mt-8 max-w-2xl" role="search">
      <label htmlFor="blog-q" className="sr-only">Search articles</label>
      <div className="flex items-center gap-3 rounded-full bg-white/95 px-5 shadow-[var(--shadow-lift)] ring-1 ring-white/40 focus-within:ring-2 focus-within:ring-white">
        <Icon name="search" className="size-5 shrink-0 text-ink-soft" />
        <input
          id="blog-q"
          type="search"
          value={q}
          onFocus={load}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search articles: anxiety, OCD, therapy…"
          className="min-h-14 w-full bg-transparent text-base text-ink placeholder:text-ink-soft/80 focus:outline-none"
          autoComplete="off"
        />
      </div>
      {q.trim().length > 1 && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-[60vh] overflow-y-auto rounded-3xl bg-white p-2 text-ink shadow-[var(--shadow-lift)] ring-1 ring-line">
          {!index ? (
            <p className="p-4 text-sm text-ink-soft">Searching…</p>
          ) : results.length ? (
            <ul aria-live="polite">
              {results.map((r) => (
                <li key={r.p}>
                  <Link href={r.p} className="block rounded-2xl px-4 py-3 hover:bg-brand-50">
                    <span className="block font-semibold leading-snug">{r.t}</span>
                    <span className="mt-0.5 line-clamp-1 block text-sm text-ink-soft">{r.e}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-ink-soft" aria-live="polite">No articles match “{q}”.</p>
          )}
        </div>
      )}
    </div>
  );
}
