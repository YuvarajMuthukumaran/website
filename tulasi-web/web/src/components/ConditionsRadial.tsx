"use client";
// "What would you like help with?" as a hub and spokes. The centre circle is the hub. Touch or click it
// (or point at it with a mouse, or simply scroll it into view) and the condition circles spread out around
// it like spokes; touch it again to fold them back in. While folded it takes little room. People who prefer
// reduced motion get the spokes already open and no animation. Keyboard: the hub is a button (Enter or Space
// toggles it, Escape folds it).
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/primitives";

export type RadialItem = { label: string; href: string; photo: string | null };

// The spokes sit on a true circle, evenly spaced, starting from the top.
const RADIUS = 176; // px from the hub to the middle of each spoke

export function ConditionsRadial({ items }: { items: RadialItem[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [reduce, setReduce] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the browser setting once on mount
    setReduce(r);
    if (r) {
      setOpen(true);
      return;
    }
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) {
      setOpen(true);
      return;
    }
    // scrolling the hub into view opens it once, unless the visitor has already used it
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !touched.current) {
          window.setTimeout(() => !touched.current && setOpen(true), 350);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    touched.current = true;
    setOpen((o) => !o);
  };

  return (
    <div
      ref={root}
      className="relative mx-auto h-[32rem] w-full max-w-[34rem]"
      onKeyDown={(e) => e.key === "Escape" && open && toggle()}
    >
      <div aria-hidden="true" className={clsx("absolute left-1/2 size-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-brand-200 transition-opacity duration-700", open ? "opacity-100" : "opacity-0")} style={{ top: "46%" }} />

      {/* the spokes */}
      <ul>
        {items.map((c, i) => {
          const a = ((-90 + (i * 360) / items.length) * Math.PI) / 180;
          const dx = open ? Math.round(RADIUS * Math.cos(a)) : 0;
          const dy = open ? Math.round(RADIUS * Math.sin(a)) : 0;
          return (
            <li
              key={c.href}
              className="absolute"
              style={{
                left: `calc(50% + ${dx}px)`,
                top: `calc(46% + ${dy}px)`,
                transform: `translate(-50%, -50%) scale(${open ? 1 : 0.25})`,
                opacity: open ? 1 : 0,
                pointerEvents: open ? "auto" : "none",
                transition: reduce ? "none" : `left 650ms cubic-bezier(0.22,1,0.36,1) ${i * 45}ms, top 650ms cubic-bezier(0.22,1,0.36,1) ${i * 45}ms, transform 650ms cubic-bezier(0.22,1,0.36,1) ${i * 45}ms, opacity 450ms ease ${i * 45}ms`,
              }}
            >
              <Link href={c.href} tabIndex={open ? 0 : -1} className="bubble group flex flex-col items-center gap-3 text-center">
                <span className="bubble-ring relative grid size-[6.25rem] place-items-center rounded-full bg-sage-50 text-ink/75 shadow-[0_0_0_4px_#fff,0_0_0_5px_var(--color-line)] group-hover:shadow-[0_0_0_4px_#fff,0_0_0_5px_var(--color-brand-300),0_18px_32px_-14px_rgb(23_34_44/0.5)]">
                  <span className="absolute inset-0 overflow-hidden rounded-full">
                    {c.photo ? <Image src={c.photo} alt="" fill sizes="110px" className="bubble-img object-cover" /> : <Icon name="heart" className="m-auto size-9" />}
                  </span>
                </span>
                <span className="bubble-label max-w-[12ch] text-[0.9375rem] leading-snug font-semibold text-ink group-hover:text-brand-700">{c.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* the hub */}
      <div className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2" style={{ top: "46%" }}>
        <button
          type="button"
          onClick={toggle}
          onMouseEnter={() => {
            if (!touched.current && window.matchMedia("(hover: hover)").matches) setOpen(true);
          }}
          aria-expanded={open}
          aria-label={open ? "Fold the conditions away" : "Show the conditions we help with"}
          className={clsx("bubble bubble-ring bubble-pulse relative grid size-40 place-items-center rounded-full bg-brand-600 text-white shadow-[0_0_0_5px_#fff,0_0_0_6px_var(--color-brand-200)] outline-none hover:bg-brand-700 focus-visible:ring-4 focus-visible:ring-brand-200", !open && "animate-[hub-nudge_2.6s_ease-in-out_infinite]")}
        >
          <span className="grid justify-items-center gap-1">
            <span className="font-display text-3xl font-semibold tracking-[-0.02em]">{open ? "A–Z" : "Start here"}</span>
            <span className="max-w-[11ch] text-xs leading-tight text-white/85">{open ? "Tap to fold" : "Touch to open"}</span>
          </span>
        </button>
      </div>

      <Link
        href="/conditions/"
        tabIndex={open ? 0 : -1}
        className={clsx("absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-700 shadow-[inset_0_0_0_1px_var(--color-brand-200)] transition-all duration-500 hover:bg-brand-50", open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0")}
      >
        See all conditions A–Z →
      </Link>
    </div>
  );
}
