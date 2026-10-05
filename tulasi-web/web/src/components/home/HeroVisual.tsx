"use client";
// Hero visual from the logo: open, cupped hands holding a brain made of words.
// - Server HTML: a static SVG (works everywhere, no JS needed, aria-hidden).
// - Desktop with motion allowed: a canvas takes over once the browser is idle;
//   words drift slowly, part gently around the pointer, and the scene eases
//   with scroll. Nothing flashes or moves fast: this is a calm space.
import { useEffect, useRef, useState } from "react";

const WORDS: [string, number, boolean][] = [
  // [word, relative size, accent]
  ["mental health", 1.9, true], ["hope", 1.25, false], ["care", 1.2, false], ["recovery", 1.35, true], ["healing", 1.2, false],
  ["resilience", 1.1, false], ["support", 1.15, false], ["therapy", 1.2, true], ["balance", 1.0, false], ["wellbeing", 1.05, false],
  ["compassion", 1.15, true], ["together", 1.05, false], ["understanding", 1.0, false], ["acceptance", 1.0, false], ["kindness", 1.05, false],
  ["stronger", 1.0, false], ["wellness", 1.15, true], ["awareness", 1.0, false], ["community", 0.95, false], ["self-care", 0.95, false],
  ["emotions", 1.05, true], ["counseling", 0.95, false], ["treatment", 1.0, false], ["happiness", 0.95, false], ["mind", 0.95, false],
];

// Brain silhouette: rows that widen then narrow, with the headline word on a
// row of its own in the middle. Deterministic, so server and client agree.
function layout() {
  const rows = [
    { y: 0.08, n: 3, w: 0.42 },
    { y: 0.2, n: 4, w: 0.64 },
    { y: 0.33, n: 5, w: 0.8 },
    { y: 0.48, n: 1, w: 0 }, // "mental health"
    { y: 0.63, n: 5, w: 0.8 },
    { y: 0.77, n: 4, w: 0.62 },
    { y: 0.9, n: 3, w: 0.4 },
  ];
  const slots: { x: number; y: number }[] = [];
  rows.forEach((r, ri) => {
    for (let k = 0; k < r.n; k++) {
      const t = r.n === 1 ? 0.5 : k / (r.n - 1);
      slots.push({ x: 0.5 + (t - 0.5) * r.w + (ri % 2 ? 0.015 : -0.015) * (r.n > 1 ? 1 : 0), y: r.y });
    }
  });
  // WORDS[0] ("mental health") takes the middle slot; the rest fill in order.
  const middle = slots.findIndex((p) => p.y === 0.48);
  const rest = slots.filter((_, i) => i !== middle);
  return [slots[middle], ...rest];
}
const POS = layout();

function Hands({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 230" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8aa3ff" />
          <stop offset="1" stopColor="#2f55e0" />
        </linearGradient>
      </defs>
      {[1, -1].map((dir) => (
        <g key={dir} transform={dir === -1 ? "translate(400 0) scale(-1 1)" : undefined}>
          {/* palm cradling inward */}
          <path d="M196 226 C 150 224 92 206 62 150 C 48 124 42 96 40 70 C 39 58 56 55 59 68 C 66 104 80 150 118 176 C 144 194 172 200 196 200 Z" fill="url(#hand)" opacity="0.95" />
          {/* fingers */}
          <rect x="22" y="40" width="15" height="74" rx="7.5" fill="url(#hand)" transform="rotate(-12 30 77)" opacity="0.9" />
          <rect x="6" y="64" width="14" height="70" rx="7" fill="url(#hand)" transform="rotate(-18 13 99)" opacity="0.8" />
          <rect x="-4" y="94" width="13" height="58" rx="6.5" fill="url(#hand)" transform="rotate(-24 3 123)" opacity="0.7" />
          {/* highlight line, like the logo */}
          <path d="M70 120 C 86 160 120 186 168 194" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function StaticWords() {
  return (
    <svg viewBox="0 0 600 420" className="absolute inset-0 h-full w-full" aria-hidden="true">
      {WORDS.map(([w, s, accent], i) => (
        <text
          key={w}
          x={POS[i].x * 600}
          y={POS[i].y * 420 + 6}
          textAnchor="middle"
          fontFamily="var(--font-jakarta), sans-serif"
          fontWeight={accent ? 800 : 600}
          fontSize={14 * s * (i === 0 ? 1.5 : 1)}
          fill={accent ? "#ff8a90" : "#ffffff"}
          fillOpacity={accent ? 0.95 : 0.55 + (i % 4) * 0.1}
        >
          {w}
        </text>
      ))}
    </svg>
  );
}

export function HeroVisual() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
    const lowPower = (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! < 4;
    if (reduce || !desktop || lowPower) return;

    let raf = 0;
    let stopped = false;
    const start = () => {
      const c = canvas.current;
      const box = wrap.current;
      if (!c || !box || stopped) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0, H = 0;
      const resize = () => {
        const r = box.getBoundingClientRect();
        W = r.width; H = r.height;
        c.width = W * dpr; c.height = H * dpr;
        c.style.width = `${W}px`; c.style.height = `${H}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(box);

      const words = WORDS.map(([text, size, accent], i) => ({
        text, size, accent,
        hx: POS[i].x, hy: POS[i].y,
        ox: 0, oy: 0, vx: 0, vy: 0,
        phase: i * 1.7, speed: 0.25 + (i % 5) * 0.05,
        alpha: accent ? 0.95 : 0.55 + (i % 4) * 0.1,
        weight: accent ? 800 : 600,
        big: i === 0,
      }));
      const mouse = { x: -9999, y: -9999 };
      const onMove = (e: PointerEvent) => {
        const r = box.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      };
      const onLeave = () => { mouse.x = mouse.y = -9999; };
      box.addEventListener("pointermove", onMove);
      box.addEventListener("pointerleave", onLeave);

      const t0 = performance.now();
      const frame = (now: number) => {
        if (stopped) return;
        const t = (now - t0) / 1000;
        ctx.clearRect(0, 0, W, H);
        const scale = Math.min(W / 600, H / 420);
        const offY = H * 0.02;
        for (const w of words) {
          const bx = w.hx * W, by = w.hy * H * 0.96 + offY;
          // slow breathing drift
          const dx = Math.sin(t * w.speed + w.phase) * 6;
          const dy = Math.cos(t * w.speed * 0.8 + w.phase) * 5;
          // gentle parting around the pointer
          const px = bx + w.ox - mouse.x, py = by + w.oy - mouse.y;
          const d2 = px * px + py * py, R = 110;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 1.4;
            w.vx += (px / d) * f; w.vy += (py / d) * f;
          }
          w.vx += -w.ox * 0.02; w.vy += -w.oy * 0.02; // spring home
          w.vx *= 0.86; w.vy *= 0.86;
          w.ox += w.vx; w.oy += w.vy;

          const fs = 14 * w.size * (w.big ? 1.5 : 1) * scale;
          ctx.font = `${w.weight} ${fs}px ${getComputedStyle(document.body).getPropertyValue("--font-jakarta") || "sans-serif"}, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = w.accent ? `rgba(255,138,144,${w.alpha})` : `rgba(255,255,255,${w.alpha})`;
          if (w.accent) { ctx.shadowColor = "rgba(255,90,99,0.45)"; ctx.shadowBlur = 18; } else ctx.shadowBlur = 0;
          ctx.fillText(w.text, bx + dx + w.ox, by + dy + w.oy);
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      setLive(true);

      // Pause when the hero is off screen (saves battery).
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && stopped === false && !raf) raf = requestAnimationFrame(frame);
        if (!e.isIntersecting) { cancelAnimationFrame(raf); raf = 0; }
      });
      io.observe(box);
      cleanup = () => { ro.disconnect(); io.disconnect(); box.removeEventListener("pointermove", onMove); box.removeEventListener("pointerleave", onLeave); };
    };
    let cleanup = () => {};
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const handle = idle ? idle(start) : window.setTimeout(start, 600);

    // Scroll parallax: the visual eases down and fades slightly as you scroll past.
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const y = Math.min(window.scrollY, 800);
      el.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      cleanup();
      window.removeEventListener("scroll", onScroll);
      if (!idle) clearTimeout(handle);
    };
  }, []);

  return (
    <div ref={wrap} className="relative mx-auto aspect-[600/560] w-full max-w-[600px] will-change-transform" aria-hidden="true">
      {/* soft glow behind the brain */}
      <div className="orb absolute top-[4%] left-1/2 size-[78%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(138_163_255/0.45),transparent_65%)] blur-2xl" />
      <div className="absolute inset-x-[13%] top-0 h-[62%]">
        <div className={live ? "opacity-0 transition-opacity duration-1000" : "opacity-100"}>
          <div className="absolute inset-0"><StaticWords /></div>
        </div>
        <canvas ref={canvas} className={`absolute inset-0 transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`} />
      </div>
      <Hands className="absolute bottom-0 left-1/2 h-auto w-[86%] -translate-x-1/2 md:drop-shadow-[0_30px_40px_rgb(4_15_69/0.5)]" />
    </div>
  );
}
