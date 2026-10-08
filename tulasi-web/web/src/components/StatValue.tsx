"use client";
// A statistic that counts up to its figure whenever it scrolls into view ("50,000+" climbs from 0 and
// settles on the figure). It always ends on exactly the figure it was given and never pretends to be a
// live feed. Words such as "NABH" are shown as they are. The real text is in the markup for screen
// readers and for people who prefer less motion, who see the final figure straight away.
import { useEffect, useRef, useState } from "react";

const FORMAT = new Intl.NumberFormat("en-IN");
const DURATION = 2800;

export function StatValue({ value }: { value: string }) {
  const m = value.match(/^([\d,]+)(\+?)$/);
  const target = m ? Number(m[1].replace(/,/g, "")) : null;
  const suffix = m ? m[2] : "";
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null); // null = show the final figure

  useEffect(() => {
    const el = ref.current;
    if (!el || target === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let raf = 0;
    const stop = () => cancelAnimationFrame(raf);
    const run = () => {
      stop();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(1 - t, 4); // fast at first, then slowing to the figure
        setShown(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
        else setShown(null);
      };
      setShown(0);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) run();
        else {
          stop();
          setShown(null);
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [target]);

  if (target === null) return <>{value}</>;
  return (
    <span ref={ref} className="tabular-nums">
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {shown === null ? FORMAT.format(target) : FORMAT.format(shown)}
        {suffix}
      </span>
    </span>
  );
}
