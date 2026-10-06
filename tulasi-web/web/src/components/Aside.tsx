// Sticky sidebar for content pages: a gentle booking card, an "on this page"
// outline, and sibling links from the same menu group.
import Link from "next/link";
import { getSite } from "@/lib/content";
import { Arrow, Icon } from "@/components/ui/primitives";
import { TrackedLink } from "@/components/layout/TrackedLink";

export function Aside({ path, toc }: { path: string; toc?: { id: string; text: string }[] }) {
  const site = getSite();
  const group = site.menu.flatMap((m) => m.groups).find((g) => g.links.some((l) => l.href === path));
  const related = group?.links.filter((l) => l.href && l.href !== path).slice(0, 8) ?? [];
  return (
    <aside className="space-y-5 lg:sticky lg:top-28" aria-label="Page tools">
      <div className="hidden rounded-[var(--radius-card)] bg-sage-50 p-6 shadow-[inset_0_0_0_1px_var(--color-sage-100)] lg:block">
        <span className="icon-tile size-11 !bg-white"><Icon name="calendar" className="size-5" /></span>
        <p className="mt-4 font-display text-xl font-semibold tracking-[-0.015em] text-ink">Speak to a specialist</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">Book a consultation with our psychiatrists and psychologists.</p>
        <Link href={`/book-appointment/?from=${encodeURIComponent(path)}`} className="group/btn mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white transition-colors hover:bg-brand-700">
          Book appointment <Arrow />
        </Link>
        <TrackedLink event="call_click" eventLocation="sidebar" href={site.contact.phoneHref} className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-full bg-white font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--color-brand-300)]">
          <Icon name="phone" className="size-4 text-sage-600" /> {site.contact.phoneDisplay}
        </TrackedLink>
      </div>

      {toc && toc.length > 2 && (
        <nav aria-label="On this page" className="hidden rounded-[var(--radius-card)] p-6 shadow-[inset_0_0_0_1px_var(--color-line)] lg:block">
          <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">On this page</p>
          <ol className="mt-4 space-y-1 border-l border-line">
            {toc.slice(0, 12).map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} className="-ml-px line-clamp-2 border-l border-transparent py-1 pl-4 text-sm leading-snug text-ink-soft transition-colors hover:border-brand-600 hover:text-brand-800">{h.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {related.length > 0 && (
        <nav aria-label={group?.label ?? "Related"} className="rounded-[var(--radius-card)] p-6 shadow-[inset_0_0_0_1px_var(--color-line)]">
          <p className="text-[0.7rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">{group?.label ?? "Related"}</p>
          <ul className="mt-3 space-y-0.5">
            {related.map((l) => (
              <li key={l.href}>
                <Link href={l.href!} className="group flex items-center justify-between gap-2 rounded-[var(--radius-tile)] px-2 py-2 text-sm text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-800">
                  {l.label} <Arrow className="size-3.5 opacity-40 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </aside>
  );
}
