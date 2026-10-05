"use client";
// Home hero visual: the logo's open hands (traced from the brand artwork), cradling a soft
// core of light and the logo's words. Server HTML is a static SVG (no JS
// needed, aria-hidden). On desktop with motion allowed, once the browser is
// idle, a canvas adds slowly orbiting light particles and the whole scene
// eases towards the pointer in depth layers. Nothing is fast or flashy.
import { useEffect, useRef, useState } from "react";

const WORDS: [string, number, number, number, number, boolean?][] = [
  // word, x, y, size, opacity, accent   (viewBox 600 x 600)
  ["mental health", 300, 262, 40, 1],
  ["hope", 196, 176, 21, 0.75],
  ["care", 404, 168, 19, 0.6],
  ["recovery", 196, 322, 25, 1, true],
  ["calm", 408, 322, 20, 0.65],
  ["balance", 300, 132, 15, 0.45],
  ["together", 300, 380, 17, 0.55],
  ["kindness", 450, 248, 14, 0.4],
  ["healing", 150, 250, 14, 0.4],
  ["wellbeing", 232, 420, 13, 0.35],
  ["support", 372, 422, 13, 0.35],
];

// The logo's cupped hands, traced from the brand artwork (viewBox 600 x 600).
const HAND_SHAPE = "M512.6 277.3L504.5 277.3L497.7 284.2L496.5 287.3L496.5 291.0L495.2 294.7L495.2 304.7L492.1 309.0L489.0 309.7L486.5 311.5L484.0 318.4L483.4 329.6L482.2 332.1L479.7 333.9L477.8 333.9L475.3 337.6L475.3 340.1L474.1 343.2L474.1 350.7L473.5 351.3L473.5 374.9L472.8 375.6L472.8 379.3L474.1 381.2L474.1 383.7L472.8 386.1L458.5 397.3L448.0 407.9L431.8 425.9L420.0 437.1L416.3 439.0L407.6 440.8L394.5 442.1L391.4 443.3L384.6 444.0L380.8 445.2L376.5 445.2L366.5 447.7L356.0 451.4L346.6 456.4L336.7 463.2L329.2 470.1L319.3 482.5L311.2 498.7L307.5 510.5L307.5 513.0L306.2 516.1L306.2 520.4L305.0 524.2L305.0 530.4L304.4 531.0L304.4 598.8L305.6 600.0L382.7 600.0L383.3 599.4L383.3 593.2L383.9 592.5L383.9 572.0L385.2 565.8L387.0 560.2L390.8 552.8L393.9 548.4L405.7 537.2L415.0 530.4L466.6 497.4L482.8 486.2L490.9 479.4L495.8 472.6L502.1 460.7L503.3 455.8L505.2 452.7L514.5 429.0L521.9 415.4L521.9 414.1L530.0 397.3L532.5 389.9L534.4 379.9L535.0 366.2L534.4 365.6L533.8 301.6L533.1 301.0L533.1 297.9L532.5 296.0L529.4 292.9L526.9 292.9L523.8 294.1L519.5 292.9L517.0 289.2L517.0 285.4L514.5 278.6Z M86.8 277.3L83.7 281.1L82.4 285.4L82.4 289.2L79.9 292.9L76.2 294.1L72.5 292.9L69.4 293.5L67.5 295.4L66.2 298.5L66.2 304.1L65.6 304.7L65.0 376.8L65.6 377.4L66.2 385.5L71.8 402.9L88.0 435.9L96.1 455.8L96.7 458.9L104.8 474.4L116.6 486.2L136.5 499.9L178.8 526.6L194.3 537.8L205.5 548.4L211.7 558.3L215.4 570.2L216.1 598.8L217.3 600.0L292.5 600.0L294.4 598.8L294.4 533.5L293.8 532.9L293.8 524.2L290.7 508.6L286.9 496.8L278.9 480.6L270.8 470.1L265.8 465.1L255.2 457.0L244.7 451.4L229.7 446.4L217.3 444.0L209.9 443.3L209.2 442.7L195.6 441.5L184.4 439.0L178.1 436.5L168.2 427.2L157.0 414.1L137.7 394.8L125.9 385.5L124.7 383.0L124.7 379.9L125.9 378.1L125.9 374.9L125.3 374.3L125.3 350.1L124.7 349.5L124.1 339.5L122.8 335.8L121.0 333.9L117.8 333.3L115.4 329.6L115.4 319.6L112.9 312.2L111.6 310.3L106.0 308.4L103.5 304.7L103.5 291.0L100.4 282.3L94.8 277.3L91.7 276.7Z";
const HAND_LINES = "M522.6 293.5L520.7 293.5L518.8 292.3L517.6 292.3L517.0 294.1L512.0 301.0L508.9 307.2L506.4 314.6L506.4 316.5L504.5 322.1L504.5 324.6L503.9 325.2L503.9 328.3L502.7 331.4L502.7 337.0L501.4 341.4L501.4 347.6L500.8 348.2L500.8 355.1L500.2 355.7L499.6 367.5L498.9 368.1L498.9 370.6L497.1 372.5L494.6 372.5L493.3 371.2L493.3 368.7L494.6 365.6L495.2 345.7L495.8 345.1L495.8 326.5L495.2 325.8L495.2 312.8L494.6 312.2L494.6 307.8L493.3 307.8L491.5 309.0L492.1 310.9L492.1 317.8L492.7 318.4L493.3 351.9L492.7 352.6L492.7 359.4L492.1 360.0L492.1 364.4L491.5 365.0L491.5 371.2L490.9 372.5L488.4 374.3L485.3 374.3L484.0 373.1L484.0 371.2L484.6 370.6L484.6 364.4L485.3 363.8L485.3 351.9L484.6 351.3L484.6 343.2L484.0 342.6L483.4 331.4L482.2 331.4L482.2 332.1L480.3 333.3L480.3 334.5L481.5 336.4L481.5 339.5L482.8 343.2L482.8 348.8L483.4 349.5L482.8 373.1L482.2 373.7L482.2 375.6L479.7 378.1L475.3 380.5L474.1 380.5L474.1 384.3L475.3 384.3L480.9 380.5L488.4 377.4L490.2 377.4L492.7 376.2L500.8 376.2L505.2 378.1L507.6 381.2L507.6 384.9L494.0 403.5L485.9 417.2L479.0 426.5L455.4 452.7L446.7 463.2L437.4 478.1L436.8 480.6L433.7 486.2L432.4 491.8L433.7 491.8L434.3 489.3L435.5 488.1L436.8 485.0L444.9 472.6L451.1 464.5L473.5 440.2L483.4 428.4L490.2 418.5L501.4 399.8L508.9 391.7L513.2 384.3L513.2 381.2L512.0 378.1L509.5 375.6L503.9 373.7L501.4 371.8L501.4 366.2L502.1 365.6L503.3 351.9L504.5 347.6L504.5 343.2L505.8 339.5L506.4 330.8L507.0 330.2L508.3 321.5L509.5 319.0L509.5 316.5L510.8 314.6L510.8 312.8L513.2 307.8L513.2 306.6L517.0 300.3L520.1 296.6L522.6 294.7Z M77.4 293.5L77.4 294.7L81.2 298.5L83.7 302.2L87.4 309.7L89.9 317.1L89.9 319.0L91.1 322.1L91.1 325.2L91.7 325.8L91.7 328.9L92.4 329.6L92.4 332.7L93.0 333.3L93.0 336.4L93.6 337.0L93.6 341.4L94.8 345.7L94.8 350.7L96.1 354.4L96.7 363.1L97.9 367.5L97.9 371.8L96.1 373.7L90.5 375.6L87.4 378.7L86.1 382.4L86.8 385.5L88.6 389.2L93.0 393.6L101.1 404.2L103.5 409.1L114.7 426.5L124.1 438.4L143.3 458.9L151.4 468.8L161.4 483.7L165.1 490.6L165.7 493.1L167.0 493.1L167.0 490.6L162.6 481.3L162.6 480.0L155.1 467.6L145.2 454.5L120.3 426.5L110.4 412.2L109.8 410.4L100.4 396.1L91.7 384.9L91.7 381.2L93.0 379.3L98.6 376.2L106.7 376.2L109.1 377.4L112.9 378.1L121.6 382.4L122.8 383.7L124.7 383.7L124.7 380.5L123.4 380.5L119.1 378.1L116.6 375.6L116.6 371.8L116.0 371.2L116.0 345.1L116.6 344.5L116.6 340.8L117.2 340.1L118.5 333.3L117.2 332.7L115.4 333.3L115.4 338.3L114.7 338.9L114.7 345.7L114.1 346.3L114.1 368.7L114.7 369.4L114.7 373.1L113.5 374.3L110.4 374.3L107.9 372.5L107.9 368.1L107.3 367.5L106.7 358.2L106.0 357.5L106.0 350.7L105.4 350.1L105.4 331.4L106.0 330.8L107.3 309.0L105.4 307.8L104.2 307.8L104.2 312.2L103.5 312.8L103.5 352.6L104.2 353.2L104.2 360.0L104.8 360.6L105.4 371.2L104.2 372.5L101.7 372.5L99.8 370.0L99.2 358.8L98.6 358.2L98.6 350.7L97.9 350.1L97.9 343.2L97.3 342.6L97.3 338.9L96.1 334.5L95.5 326.5L94.8 325.8L94.8 323.3L94.2 322.7L91.7 310.9L87.4 301.0L81.8 292.3Z";

function Hands() {
  return (
    <g>
      <path d={HAND_SHAPE} fill="url(#hv-hand)" stroke="#bdccfb" strokeOpacity="0.35" strokeWidth="1" />
      <path d={HAND_LINES} fill="#e7edfe" fillOpacity="0.9" />
    </g>
  );
}

export function HeroVisual() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const layerA = useRef<HTMLDivElement>(null);
  const layerB = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (reduce || !desktop || (mem !== undefined && mem < 4)) return;

    let raf = 0;
    let stopped = false;
    let cleanup = () => {};
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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(box);

      // particles on tilted elliptical orbits around the core
      const ps = Array.from({ length: 90 }, (_, i) => ({
        a: Math.random() * Math.PI * 2,
        rx: 0.16 + Math.random() * 0.3,
        ry: 0.08 + Math.random() * 0.16,
        sp: (0.00018 + Math.random() * 0.00035) * (i % 2 ? 1 : -1),
        s: 0.6 + Math.random() * 1.6,
        o: 0.25 + Math.random() * 0.6,
        tilt: (Math.random() - 0.5) * 0.6,
      }));
      const target = { x: 0, y: 0 };
      const cur = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        target.x = e.clientX / window.innerWidth - 0.5;
        target.y = e.clientY / window.innerHeight - 0.5;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      let last = performance.now();
      const frame = (now: number) => {
        if (stopped) return;
        const dt = Math.min(48, now - last);
        last = now;
        cur.x += (target.x - cur.x) * 0.04;
        cur.y += (target.y - cur.y) * 0.04;
        if (layerA.current) layerA.current.style.transform = `translate3d(${(cur.x * -14).toFixed(2)}px, ${(cur.y * -10).toFixed(2)}px, 0)`;
        if (layerB.current) layerB.current.style.transform = `translate3d(${(cur.x * 22).toFixed(2)}px, ${(cur.y * 16).toFixed(2)}px, 0)`;
        ctx.clearRect(0, 0, W, H);
        const cx = W * 0.5 + cur.x * 30, cy = H * 0.44 + cur.y * 20;
        ctx.fillStyle = "#d0dbfd";
        for (const p of ps) {
          p.a += p.sp * dt;
          const x0 = Math.cos(p.a) * p.rx * W;
          const y0 = Math.sin(p.a) * p.ry * H;
          const x = cx + x0 * Math.cos(p.tilt) - y0 * Math.sin(p.tilt);
          const y = cy + x0 * Math.sin(p.tilt) + y0 * Math.cos(p.tilt);
          const front = Math.sin(p.a) > 0 ? 1 : 0.45;
          ctx.globalAlpha = p.o * front;
          ctx.beginPath();
          ctx.arc(x, y, p.s * front, 0, Math.PI * 2);
          ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      setLive(true);

      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !raf && !stopped) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
        if (!e.isIntersecting) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      });
      io.observe(box);
      cleanup = () => {
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
      };
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: object) => number }).requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 2500 }) : window.setTimeout(start, 1200);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      cleanup();
      if (!idle) clearTimeout(handle);
    };
  }, []);

  return (
    <div ref={wrap} className="relative mx-auto aspect-square w-full max-w-[600px]" aria-hidden="true">
      {/* core glow (decorative, never behind text blocks) */}
      <div className="absolute top-[14%] left-1/2 size-[64%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(185_200_255/0.55),rgb(47_85_224/0.25)_45%,transparent_70%)] blur-xl" />
      <div ref={layerA} className="absolute inset-0">
        <svg viewBox="0 0 600 600" className="h-full w-full">
          <defs>
            <linearGradient id="hv-hand" gradientUnits="userSpaceOnUse" x1="0" y1="277" x2="0" y2="600">
              <stop offset="0" stopColor="#4b76f6" />
              <stop offset="0.45" stopColor="#1f4dd6" />
              <stop offset="1" stopColor="#0a35b5" stopOpacity="0.85" />
            </linearGradient>
            <radialGradient id="hv-core">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="0.3" stopColor="#bdccfb" stopOpacity="0.55" />
              <stop offset="1" stopColor="#0a35b5" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="300" cy="266" rx="236" ry="150" fill="none" stroke="#90aaf9" strokeOpacity="0.18" strokeDasharray="2 7" />
          <ellipse cx="300" cy="266" rx="180" ry="112" fill="none" stroke="#90aaf9" strokeOpacity="0.12" />
          <circle cx="300" cy="262" r="92" fill="url(#hv-core)" />
          <Hands />
        </svg>
      </div>
      <div ref={layerB} className="absolute inset-0">
        <svg viewBox="0 0 600 600" className="h-full w-full">
          <g fontFamily="var(--font-jakarta), sans-serif" fontWeight="700" textAnchor="middle">
            {WORDS.map(([w, x, y, s, o, hot], i) => (
              <text key={w} x={x} y={y} fontSize={s} fill={hot ? "#ffb1b6" : "#e7edfe"} fillOpacity={o} letterSpacing="-0.02em" className="hv-float" style={{ animationDelay: `${i * -1.3}s` }}>
                {w}
              </text>
            ))}
          </g>
        </svg>
      </div>
      <canvas ref={canvas} className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${live ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
}
