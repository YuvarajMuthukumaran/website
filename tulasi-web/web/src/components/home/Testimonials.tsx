"use client";
// Draggable testimonial track: mouse drag, touch swipe, keyboard (arrow keys
// on the focused track) and previous/next buttons. Native scroll-snap does the
// physics; drag only moves scrollLeft, so all quotes stay in the HTML.
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

type T = { name: string; quote: string };

export function Testimonials({ items }: { items: T[] }) {
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const by = (dir: number) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 400) + 24), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <div>
      <ul
        ref={track}
        tabIndex={0}
        aria-label="Testimonials"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") by(1);
          if (e.key === "ArrowLeft") by(-1);
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !track.current) return;
          drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
          track.current.style.scrollSnapType = "none";
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || !track.current) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 4) d.moved = true;
          track.current.scrollLeft = d.left - dx;
        }}
        onPointerUp={() => {
          if (!track.current) return;
          drag.current = null;
          track.current.style.scrollSnapType = "";
        }}
        onPointerLeave={() => {
          if (drag.current && track.current) {
            drag.current = null;
            track.current.style.scrollSnapType = "";
          }
        }}
        className="-mx-4 flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 [scrollbar-width:none] active:cursor-grabbing sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t, i) => (
          <li key={t.name} className="w-[min(560px,86vw)] shrink-0 snap-start select-none">
            <figure className="spot-light h-full">
              <div className="spot-in flex h-full flex-col p-8 sm:p-10">
                <svg viewBox="0 0 40 32" className="h-8 w-10 text-brand-200" fill="currentColor" aria-hidden="true">
                  <path d="M0 32V19C0 8.5 5.6 2 16.5 0l1.5 4.4C11.6 6.3 8.7 10 8.4 15H16v17H0zm22 0V19C22 8.5 27.6 2 38.5 0L40 4.4C33.6 6.3 30.7 10 30.4 15H38v17H22z" />
                </svg>
                <blockquote className="mt-6 flex-1 font-display text-[clamp(1.25rem,1.05rem+0.8vw,1.75rem)] leading-[1.35] font-medium tracking-[-0.02em] text-ink">{t.quote}</blockquote>
                <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-6">
                  <span aria-hidden="true" className={clsx("grid size-11 place-items-center rounded-[var(--radius-tile)] font-display text-sm font-bold text-white", ["bg-brand-600", "bg-brand-900", "bg-brand-500"][i % 3])}>
                    {t.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  <span className="font-display font-semibold text-ink">{t.name}</span>
                </figcaption>
              </div>
            </figure>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-end gap-2">
        {[-1, 1].map((d) => (
          <button key={d} type="button" onClick={() => by(d)} disabled={d < 0 ? edge.start : edge.end} className="grid size-12 place-items-center rounded-full bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition hover:shadow-[inset_0_0_0_1px_var(--color-brand-200)] disabled:opacity-35">
            <svg viewBox="0 0 24 24" className={clsx("size-5", d < 0 && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <span className="sr-only">{d < 0 ? "Previous testimonial" : "Next testimonial"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
