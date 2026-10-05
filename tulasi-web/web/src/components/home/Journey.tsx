"use client";
// "Your journey to recovery": sticky side-by-side storytelling.
// Desktop: a single visual stays pinned (native CSS sticky, no scroll-jacking)
// and morphs between four scenes while the steps scroll past beside it; a
// progress rail fills with the step. Phones / no JS / reduced motion: a plain,
// fully readable list. All text is always in the HTML.
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { HeroScene, type Scene } from "@/components/HeroScene";
import { Logo3D } from "@/components/Logo3D";

export type Step = { title: string; text: string };
const SCENES: Scene[] = ["rings", "cradle", "sprout", "sunrise"];

export function Journey({ steps, heading, eyebrow, highlight }: { steps: Step[]; heading: string; eyebrow: string; highlight?: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const idx = highlight ? heading.indexOf(highlight) : -1;

  return (
    <section aria-labelledby="journey-title" className="on-dark stage relative bg-hero text-white">
      <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 hidden h-[520px] w-[620px] rounded-full bg-brand-600/30 blur-[120px] md:block" />
      <div className="container-page relative grid gap-12 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32">
        {/* sticky visual */}
        <div className="hidden lg:block">
          <div className="sticky top-[14vh] h-[72vh] max-h-[640px]">
            <div className="glass-dark relative h-full overflow-hidden rounded-[var(--radius-blob)]">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_35%,rgb(47_85_224/0.35),transparent_70%)]" />
              {SCENES.map((sc, i) => (
                <div
                  key={sc}
                  aria-hidden="true"
                  className={clsx("absolute inset-0 grid place-items-center p-10 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-calm)]", i === active ? "scale-100 opacity-100" : "scale-[0.96] opacity-0")}
                >
                  {sc === "cradle" ? <Logo3D className="max-w-[360px]" /> : <HeroScene scene={sc} className="h-auto w-full max-w-[520px]" />}
                </div>
              ))}
              <div className="absolute inset-x-8 bottom-8 flex items-center gap-4">
                <span className="font-display text-sm font-semibold tabular-nums tracking-[0.18em] text-brand-200">0{active + 1} / 0{steps.length}</span>
                <span aria-hidden="true" className="relative h-px flex-1 bg-white/15">
                  <span className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-300 to-white transition-[width] duration-[700ms] ease-[var(--ease-calm)]" style={{ width: `${((active + 1) / steps.length) * 100}%` }} />
                </span>
                <span className="font-display text-sm font-semibold text-white">{steps[active]?.title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* steps */}
        <div>
          <p className="eyebrow !text-brand-200">{eyebrow}</p>
          <h2 id="journey-title" className="mt-5 text-[length:var(--text-h2)] leading-[1.04] font-bold tracking-[-0.035em]">
            {idx >= 0 && highlight ? (
              <>
                {heading.slice(0, idx)}
                <span className="text-glow">{highlight}</span>
                {heading.slice(idx + highlight.length)}
              </>
            ) : (
              heading
            )}
          </h2>
          <ol className="mt-12 lg:mt-0">
            {steps.map((s, i) => (
              <li
                key={s.title}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                data-i={i}
                className="relative border-t border-white/10 py-10 lg:flex lg:min-h-[62vh] lg:flex-col lg:justify-center lg:py-0"
              >
                <p className={clsx("font-display text-sm font-semibold tracking-[0.18em] transition-colors duration-500", i === active ? "text-brand-200" : "text-brand-200/60")}>STEP 0{i + 1}</p>
                <h3 className={clsx("mt-3 font-display text-[clamp(2.25rem,1.6rem+2.6vw,4rem)] leading-none font-extrabold tracking-[-0.04em] transition-colors duration-500", i === active ? "text-white" : "lg:text-white/45")}>{s.title}</h3>
                <p className={clsx("mt-5 max-w-[40ch] text-[length:var(--text-lead)] leading-relaxed transition-colors duration-500", i === active ? "text-brand-100/90" : "text-brand-100/80 lg:text-brand-100/55")}>{s.text}</p>
                <span aria-hidden="true" className={clsx("absolute top-0 left-0 h-px bg-gradient-to-r from-brand-300 to-transparent transition-[width] duration-[900ms] ease-[var(--ease-calm)]", i <= active ? "w-1/2" : "w-0")} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
