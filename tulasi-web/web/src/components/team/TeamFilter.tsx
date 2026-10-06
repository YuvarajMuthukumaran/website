"use client";
// Filters the server-rendered doctor cards of a team location page by role and
// expertise. All cards are in the HTML (crawlers and no-JS visitors see every
// doctor); this only toggles `hidden` on cards in the browser.
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export function TeamFilter({ gridId, kinds, tags, total }: { gridId: string; kinds: { kind: string; count: number }[]; tags: { tag: string; count: number }[]; total: number }) {
  const [kind, setKind] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [shown, setShown] = useState(total);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const cards = document.querySelectorAll<HTMLElement>(`#${gridId} .dr-card`);
    let n = 0;
    cards.forEach((c) => {
      const ok = (!kind || c.dataset.kind === kind) && (!tag || (c.dataset.tags ?? "").split("|").includes(tag));
      c.hidden = !ok;
      if (ok) {
        n++;
        c.classList.remove("dr-in");
        void c.offsetWidth;
        c.classList.add("dr-in");
      }
    });
    setShown(n);
  }, [kind, tag, gridId]);

  const chip = (active: boolean) =>
    clsx(
      "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200",
      active ? "bg-brand-600 text-white" : "bg-white text-ink/80 shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-brand-800 hover:shadow-[inset_0_0_0_1px_var(--color-brand-200)]"
    );

  return (
    <div className="mt-10 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by role">
        {kinds.length > 1 && (
          <>
            <button type="button" aria-pressed={!kind} onClick={() => setKind(null)} className={chip(!kind)}>
              Everyone <span className="text-xs opacity-60">{total}</span>
            </button>
            {kinds.map((k) => (
              <button key={k.kind} type="button" aria-pressed={kind === k.kind} onClick={() => setKind(kind === k.kind ? null : k.kind)} className={chip(kind === k.kind)}>
                {k.kind}s <span className="text-xs opacity-60">{k.count}</span>
              </button>
            ))}
            <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-line sm:block" />
          </>
        )}
        <p className="text-sm text-ink-soft" aria-live="polite">
          Showing <b className="font-semibold text-ink">{shown}</b> of {total}
        </p>
      </div>
      {tags.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by expertise">
          {tags.map((t) => (
            <button key={t.tag} type="button" aria-pressed={tag === t.tag} onClick={() => setTag(tag === t.tag ? null : t.tag)} className={clsx(chip(tag === t.tag), "!min-h-9 !px-3.5 !text-[0.8125rem] !font-medium")}>
              {t.tag} <span className="text-xs opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
