"use client";
// /our-team/ explorer: filter the whole team by area of expertise; cards
// re-flow with layout animations. The server HTML contains every doctor
// (the initial filter is "All"), so crawlers and no-JS visitors see the
// full team with the same group headings, names and designations as today.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

export type TeamPerson = {
  slug: string | null;
  name: string;
  designation: string;
  src: string | null;
  alt: string;
  cutout: boolean;
  bg: string;
  tags: string[];
  experience: string | null;
  excerpt?: string | null;
};
export type TeamGroup = { heading: string; anchor: string; people: TeamPerson[] };

export function TeamExplorer({ groups, tags }: { groups: TeamGroup[]; tags: { tag: string; count: number }[] }) {
  const [tag, setTag] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const total = useMemo(() => groups.reduce((n, g) => n + g.people.filter((p) => !tag || p.tags.includes(tag)).length, 0), [groups, tag]);

  return (
    <LayoutGroup>
      {/* filter bar */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-5 bg-white px-5 py-3 shadow-[0_1px_0_var(--color-line)] sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10">
        <div className="flex items-center gap-3">
          <p className="hidden shrink-0 text-sm font-semibold text-ink-soft md:block">Find by expertise</p>
          <div role="group" aria-label="Filter the team by area of expertise" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[{ tag: null as string | null, count: groups.reduce((n, g) => n + g.people.length, 0) }, ...tags].map((t) => {
              const on = tag === t.tag;
              return (
                <button
                  key={t.tag ?? "all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTag(t.tag)}
                  className={clsx(
                    "relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-300",
                    on ? "text-white" : "bg-white text-ink-soft shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-brand-700 hover:shadow-[inset_0_0_0_1px_var(--color-brand-300)]"
                  )}
                >
                  {on && <motion.span layoutId="team-filter-pill" className="absolute inset-0 rounded-full bg-brand-600" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{t.tag ?? "All specialists"}</span>
                  <span className={clsx("relative rounded-full px-1.5 text-xs", on ? "bg-white/20" : "bg-white")}>{t.count}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{total} specialists shown</p>
      </div>

      {groups.map((g) => {
        const people = g.people.filter((p) => !tag || p.tags.includes(tag));
        return (
          <section key={g.heading} id={g.anchor} aria-labelledby={`${g.anchor}-h`} className="scroll-mt-40 pt-14 lg:pt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 id={`${g.anchor}-h`} className="font-display text-[length:var(--text-h2)] leading-[1.15] font-semibold tracking-[-0.02em] text-ink">{g.heading}</h2>
              <p className="text-sm font-semibold text-ink-soft">
                <motion.span key={people.length} initial={reduce ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="inline-block tabular-nums">{people.length}</motion.span> specialists
              </p>
            </div>
            {people.length === 0 ? (
              <p className="mt-8 rounded-[var(--radius-card)] bg-mist p-6 text-ink-soft">No {g.heading.toLowerCase()} listed for “{tag}”. <button type="button" onClick={() => setTag(null)} className="font-semibold text-brand-700 underline">Show everyone</button></p>
            ) : (
              <motion.ul layout={!reduce} className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {people.map((p) => (
                    <motion.li
                      key={p.slug ?? p.name}
                      layout={!reduce}
                      initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? undefined : { opacity: 0, scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    >
                      <MemberCard p={p} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </section>
        );
      })}
    </LayoutGroup>
  );
}

function MemberCard({ p }: { p: TeamPerson }) {
  const href = p.slug ? `/team/${p.slug}/` : "/our-team/";
  return (
    <article className="group relative">
      {/* the whole photo is a link to the profile */}
      <Link href={href} className="relative isolate block aspect-[4/5] overflow-hidden rounded-[1.25rem] ring-1 ring-black/[0.04] transition-all duration-300 ease-[var(--ease-calm)] group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lift)]" style={{ backgroundColor: p.bg }} aria-label={`View profile: ${p.name}`}>
        {p.src && (
          <Image
            src={p.src}
            alt={`${p.name}, ${p.designation}`}
            fill
            sizes="(min-width:1280px) 230px, (min-width:1024px) 22vw, (min-width:640px) 30vw, 46vw"
            className={clsx("object-cover transition-transform duration-500 ease-[var(--ease-calm)] group-hover:scale-[1.03]", p.cutout ? "object-bottom" : "object-[50%_30%]")}
          />
        )}
        {p.experience && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.7rem] font-semibold text-ink shadow-[0_1px_2px_rgb(23_34_44/0.1)]">{p.experience}</span>
        )}
      </Link>
      <h3 className="mt-3.5 font-display text-[1.0625rem] leading-snug font-semibold text-ink">
        <Link href={href} className="hover:text-brand-700">{p.name}</Link>
      </h3>
      <p className="mt-1 text-sm leading-snug text-ink-soft">{p.designation}</p>
      {p.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{p.excerpt}</p>}
      {p.tags.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Areas of expertise">
          {p.tags.slice(0, 3).map((t) => (
            <li key={t} className="rounded-full bg-sage-50 px-2 py-0.5 text-[0.7rem] font-medium text-sage-700">{t}</li>
          ))}
        </ul>
      )}
      {/* always visible, so it works on phones too */}
      <p className="mt-3 flex items-center gap-4 text-sm font-semibold">
        <Link href={href} className="text-brand-700 hover:text-brand-900">View profile</Link>
        {p.slug && <Link href={`/book-appointment/?doctor=${p.slug}&from=team`} className="text-ink-soft hover:text-brand-700">Book</Link>}
      </p>
    </article>
  );
}
