"use client";
// "Learn with Tulasi": short educational videos, in a sideways carousel. The video in the middle is
// in focus, the others peek in from the sides, dimmed.
//
// Two kinds of video (lib/social.ts):
//  - SHORT_VIDEOS: the clinic's own files (public/videos/*.mp4). The one in focus plays by itself,
//    muted and without any controls, loops to the next when it ends, and a small button turns the
//    sound on. This is the version to use: only the video shows.
//  - INSTAGRAM_REELS: Instagram's own player, cropped to the video. Instagram does not allow a page to
//    start its player or hide its buttons, so a visitor taps play, and the player's own bar stays.
// Nothing loads until the section is near the screen.
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/primitives";
import { INSTAGRAM_HANDLE, INSTAGRAM_REELS, INSTAGRAM_URL, SHORT_VIDEOS } from "@/lib/social";

type Item = { kind: "mp4"; src: string; poster?: string; title?: string; duration?: string } | { kind: "ig"; code: string };

const codeOf = (url: string) => url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/)?.[1] ?? null;
const ITEMS: Item[] =
  SHORT_VIDEOS.length > 0
    ? SHORT_VIDEOS.slice(0, 8).map((v) => ({ kind: "mp4" as const, ...v }))
    : INSTAGRAM_REELS.map(codeOf).filter((c): c is string => !!c).slice(0, 6).map((code) => ({ kind: "ig" as const, code }));
const TINTS = ["#e4ddf6", "#d6e8f7", "#fbe3d2", "#d9efdd", "#fbf0c6", "#f9dedf", "#d3eeee", "#fbe3d2"];

export function InstagramVideos() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);
  const [active, setActive] = useState(0);
  const [sound, setSound] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the browser setting once on mount
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) {
      setNear(true);
      setSeen(true);
      return;
    }
    // load when close, play only while the section is really on screen
    const load = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), load.disconnect()), { rootMargin: "500px 0px" });
    const view = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    load.observe(el);
    view.observe(el);
    return () => {
      load.disconnect();
      view.disconnect();
    };
  }, []);

  const sync = useCallback(() => {
    const t = track.current;
    if (!t) return;
    const mid = t.scrollLeft + t.clientWidth / 2;
    let best = 0;
    let dist = Infinity;
    Array.from(t.children).forEach((c, i) => {
      const el = c as HTMLElement;
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };
    t.addEventListener("scroll", on, { passive: true });
    return () => {
      t.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, [sync]);

  // Only the video in focus plays, and only while the section is on screen.
  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      v.muted = !sound || i !== active;
      if (i === active && seen && near && !reduce) void v.play().catch(() => {});
      else v.pause();
    });
  }, [active, seen, near, sound, reduce]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restart the progress line for the new video
    setProgress(0);
  }, [active]);

  const go = (i: number) => {
    const t = track.current;
    const el = t?.children[Math.max(0, Math.min(ITEMS.length - 1, i))] as HTMLElement | undefined;
    if (!t || !el) return;
    t.scrollTo({ left: el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  };

  const hasMp4 = ITEMS.some((i) => i.kind === "mp4");

  return (
    <div ref={root}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Learn with Tulasi</p>
        <h2 className="mt-3 text-[length:var(--text-h2)] leading-tight font-semibold tracking-[-0.02em] text-ink">Short videos on mental health</h2>
        <p className="mt-3 text-[length:var(--text-lead)] leading-relaxed text-ink-soft">Our psychiatrists and psychologists explain conditions, treatment and everyday care in plain language.</p>
      </div>

      {ITEMS.length > 0 ? (
        <div className="relative mt-9">
          <ul
            ref={track}
            className="vid-track flex snap-x snap-mandatory items-center gap-6 overflow-x-auto px-[max(1.25rem,calc(50%-9rem))] py-6"
            aria-label="Short videos"
            tabIndex={0}
          >
            {ITEMS.map((it, i) => {
              const on = i === active;
              const load = near && Math.abs(i - active) <= 2;
              return (
                <li
                  key={it.kind === "mp4" ? it.src : it.code}
                  className={clsx("w-[18rem] shrink-0 snap-center transition-[opacity,transform,filter] duration-500 ease-[var(--ease-calm)]", on ? "scale-100 opacity-100" : "scale-[0.9] opacity-60 saturate-[0.8]")}
                  aria-label={`Video ${i + 1} of ${ITEMS.length}`}
                >
                  <div className={clsx("relative aspect-[9/16] overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-black/5", on ? "shadow-[0_40px_70px_-34px_rgb(23_34_44/0.55)]" : "shadow-[0_20px_40px_-30px_rgb(23_34_44/0.4)]")} style={{ backgroundColor: TINTS[i % TINTS.length] }}>
                    {it.kind === "mp4" ? (
                      load ? (
                        <video
                          ref={(el) => {
                            videos.current[i] = el;
                          }}
                          src={it.src}
                          poster={it.poster}
                          muted
                          playsInline
                          preload={Math.abs(i - active) <= 1 ? "auto" : "metadata"}
                          loop={ITEMS.length === 1}
                          onTimeUpdate={(e) => i === active && setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
                          onEnded={() => (i < ITEMS.length - 1 ? go(i + 1) : go(0))}
                          className="absolute inset-0 size-full object-cover"
                          aria-label={it.title ?? `Tulasi Healthcare video ${i + 1}`}
                        />
                      ) : null
                    ) : load ? (
                      // Instagram's embed is a 4:5 frame with the 9:16 video pillarboxed in it, plus a header and a likes bar.
                      // Widen it so the black side bars fall outside the card and shift it up so the header does too.
                      <iframe
                        src={`https://www.instagram.com/reel/${it.code}/embed/`}
                        title={`Tulasi Healthcare video ${i + 1}`}
                        loading="lazy"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        scrolling="no"
                        className="absolute border-0 bg-black"
                        style={{ top: "-3.9rem", left: "-25%", width: "150%", height: "calc(100% + 3.9rem + 18rem)" }}
                      />
                    ) : null}
                    {!on && (
                      <button type="button" onClick={() => go(i)} aria-label={`Go to video ${i + 1}`} className="absolute inset-0 z-10 cursor-pointer" />
                    )}
                    {on && it.kind === "mp4" && (
                      <button
                        type="button"
                        onClick={() => setSound((s) => !s)}
                        aria-pressed={sound}
                        aria-label={sound ? "Turn sound off" : "Turn sound on"}
                        className="absolute top-3 right-3 z-10 flex h-10 items-center gap-1.5 rounded-full bg-black/45 px-3 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-black/60"
                      >
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none" />
                          {sound ? <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
                        </svg>
                        {sound ? "Sound on" : "Tap for sound"}
                      </button>
                    )}
                    {on && it.kind === "mp4" && (
                      <span aria-hidden="true" className="absolute inset-x-4 bottom-4 z-10 h-1 overflow-hidden rounded-full bg-white/35">
                        <span className="block h-full rounded-full bg-white" style={{ width: `${Math.round(progress * 100)}%`, transition: "width 250ms linear" }} />
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-2 flex items-center justify-center gap-4">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous video" className="grid size-11 place-items-center rounded-full bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-brand-50 disabled:opacity-40">
              <Icon name="arrow" className="size-4 rotate-180" />
            </button>
            <div className={clsx("flex items-center", hasMp4 ? "gap-2.5" : "gap-2")} role="group" aria-label="Choose a video">
              {ITEMS.map((it, i) =>
                it.kind === "mp4" ? (
                  <button
                    key={it.src}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Video ${i + 1}${it.duration ? `, ${it.duration}` : ""}`}
                    aria-current={i === active}
                    className={clsx("relative aspect-[9/16] w-10 shrink-0 overflow-hidden rounded-lg bg-sage-50 bg-cover bg-center transition-all duration-300 sm:w-12", i === active ? "scale-110 opacity-100 ring-2 ring-brand-600 ring-offset-2" : "opacity-70 hover:opacity-100")}
                    style={it.poster ? { backgroundImage: `url(${it.poster})` } : undefined}
                  >
                    {it.duration && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-3 pb-0.5 text-center text-[0.625rem] font-semibold text-white">{it.duration}</span>}
                  </button>
                ) : (
                  <button key={it.code} type="button" onClick={() => go(i)} aria-label={`Video ${i + 1}`} aria-current={i === active} className={clsx("h-2 rounded-full transition-all duration-300", i === active ? "w-7 bg-brand-600" : "w-2 bg-ink/25 hover:bg-ink/40")} />
                ),
              )}
            </div>
            <button type="button" onClick={() => go(active + 1)} disabled={active === ITEMS.length - 1} aria-label="Next video" className="grid size-11 place-items-center rounded-full bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-brand-50 disabled:opacity-40">
              <Icon name="arrow" className="size-4" />
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-ink-soft">{hasMp4 ? `Video ${active + 1} of ${ITEMS.length}. Plays by itself, muted. Swipe or use the arrows for the next one.` : "Tap a video to play it."}</p>
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[0_0_0_1px_var(--color-line)]">
          {near && <iframe src={`${INSTAGRAM_URL}embed/`} title="Latest videos from Tulasi Healthcare on Instagram" loading="lazy" allow="autoplay; encrypted-media" className="block h-[32rem] w-full border-0" />}
        </div>
      )}

      <p className="mt-6 text-center">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-[0.9375rem] font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-brand-50">
          <Icon name="arrow" className="size-4 -rotate-45 text-brand-600" /> Follow {INSTAGRAM_HANDLE} for more
        </a>
      </p>
    </div>
  );
}
