"use client";
// Conditions A to Z: a search box and A-Z letters over a list of conditions. Picking a letter shows that
// letter's conditions, typing searches names and everyday words ("daaru", "cannot sleep"). A condition
// without its own page leads to the specialist finder, and an empty search offers a person to talk to.
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { Arrow, Icon } from "@/components/ui/primitives";
import { AZ_CONDITIONS, LETTERS, firstLetter } from "@/lib/conditions-az";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

export function ConditionsAZ({ phone }: { phone: { display: string; href: string } }) {
  const [q, setQ] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  const sorted = useMemo(() => [...AZ_CONDITIONS].sort((a, b) => a.label.localeCompare(b.label)), []);
  const present = useMemo(() => new Set(sorted.map((c) => firstLetter(c.label))), [sorted]);

  const list = useMemo(() => {
    const t = norm(q);
    if (t) {
      const words = t.split(" ");
      return sorted.filter((c) => {
        const hay = norm(`${c.label} ${(c.also ?? []).join(" ")}`);
        return words.every((w) => hay.includes(w));
      });
    }
    return letter ? sorted.filter((c) => firstLetter(c.label) === letter) : sorted;
  }, [q, letter, sorted]);

  // group by letter for the "all" view
  const groups = useMemo(() => {
    const m = new Map<string, typeof list>();
    list.forEach((c) => {
      const k = firstLetter(c.label);
      m.set(k, [...(m.get(k) ?? []), c]);
    });
    return [...m.entries()];
  }, [list]);

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div>
          <h2 className="text-lg font-semibold text-ink">Find conditions by first letter</h2>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose a letter">
            {LETTERS.map((l) => {
              const has = present.has(l);
              const on = letter === l && !q;
              return (
                <button
                  key={l}
                  type="button"
                  disabled={!has}
                  aria-pressed={on}
                  onClick={() => {
                    setQ("");
                    setLetter(on ? null : l);
                  }}
                  className={clsx(
                    "grid size-10 place-items-center rounded-full text-sm font-semibold transition-colors",
                    on ? "bg-brand-600 text-white" : has ? "bg-white text-ink shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:text-brand-700 hover:shadow-[inset_0_0_0_1.5px_var(--color-brand-300)]" : "bg-transparent text-ink/25 shadow-[inset_0_0_0_1.5px_var(--color-line)]",
                  )}
                >
                  {l}
                </button>
              );
            })}
            {(letter || q) && (
              <button type="button" onClick={() => (setLetter(null), setQ(""))} className="ml-1 inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                Show all
              </button>
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] bg-sage-50 p-5 shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
          <h2 className="text-lg font-semibold text-ink">Search conditions</h2>
          <p className="mt-1 text-sm text-ink-soft">Type a name or how it feels, for example “panic”, “daaru” or “cannot sleep”.</p>
          <label className="mt-3 flex items-center gap-3 rounded-full bg-white px-4 shadow-[inset_0_0_0_1px_var(--color-line)] focus-within:shadow-[inset_0_0_0_2px_var(--color-brand-500)]">
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <span className="sr-only">Search conditions</span>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLetter(null);
              }}
              type="search"
              placeholder="Search"
              className="h-12 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-soft"
            />
          </label>
        </div>
      </div>

      <p className="mt-10 text-sm text-ink-soft" aria-live="polite">
        {q ? `${list.length} ${list.length === 1 ? "condition" : "conditions"} found` : letter ? `Conditions starting with ${letter}` : `${list.length} conditions, A to Z`}
      </p>

      {list.length === 0 ? (
        <div className="mt-4 rounded-[var(--radius-card)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line)]">
          <p className="font-display text-lg font-semibold text-ink">We couldn’t find “{q}”, but we can still help.</p>
          <p className="mt-2 max-w-[60ch] text-[0.9375rem] leading-relaxed text-ink-soft">The list does not cover every illness. Tell us what you or your family member is going through, and we’ll point you to the right specialist.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/find-a-specialist/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">Find the right specialist <Arrow /></Link>
            <a href={phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50"><Icon name="phone" className="size-4" /> Call {phone.display}</a>
            <OpenChatButton className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 font-semibold text-brand-700 hover:bg-brand-50">Ask Tulasi</OpenChatButton>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          {groups.map(([l, items]) => (
            <section key={l} aria-label={`Conditions starting with ${l}`}>
              <h3 className="mb-3 flex items-center gap-3 font-display text-2xl font-semibold text-brand-700">
                <span className="grid size-10 place-items-center rounded-full bg-brand-50">{l}</span>
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((c) => (
                  <li key={c.label}>
                    <Link
                      href={c.href ?? "/find-a-specialist/"}
                      className="group flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-card)] bg-white px-4 py-3 shadow-[0_0_0_1px_var(--color-line)] transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_0_1px_var(--color-brand-300),0_14px_28px_-20px_rgb(23_34_44/0.4)]"
                    >
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink group-hover:text-brand-700">{c.label}</span>
                        <span className="block text-xs text-ink-soft">{c.href ? "Read about treatment" : "Find the right specialist"}</span>
                      </span>
                      <Icon name="arrow" className="size-4 shrink-0 text-brand-600 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-[var(--radius-card)] bg-sage-50 p-6 text-center shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
        <p className="font-display text-lg font-semibold text-ink">Not sure what to look for?</p>
        <p className="mx-auto mt-1 max-w-[52ch] text-[0.9375rem] text-ink-soft">Three quick questions will suggest who to see first. No sign-up needed.</p>
        <Link href="/find-a-specialist/" className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700">Find the right specialist <Arrow /></Link>
      </div>
    </div>
  );
}
