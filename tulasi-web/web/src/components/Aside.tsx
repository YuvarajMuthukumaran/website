// Sticky sidebar for content pages: book / call, and sibling links from the
// same menu group (keeps the live site's internal linking close at hand).
import Link from "next/link";
import { getSite } from "@/lib/content";
import { Icon } from "@/components/ui/primitives";
import { TrackedLink } from "@/components/layout/TrackedLink";

export function Aside({ path, toc }: { path: string; toc?: { id: string; text: string }[] }) {
  const site = getSite();
  const group = site.menu.flatMap((m) => m.groups).find((g) => g.links.some((l) => l.href === path));
  const related = group?.links.filter((l) => l.href && l.href !== path).slice(0, 8) ?? [];
  return (
    <aside className="space-y-6 lg:sticky lg:top-28" aria-label="Page tools">
      <div className="rounded-[var(--radius-card)] bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white shadow-[var(--shadow-lift)]">
        <p className="font-display text-lg font-bold">Speak to a specialist</p>
        <p className="mt-1 text-sm text-brand-100">Book a consultation with our psychiatrists and psychologists.</p>
        <Link href={`/book-appointment/?from=${encodeURIComponent(path)}`} className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold hover:bg-accent-700">
          <Icon name="calendar" /> Book Appointment
        </Link>
        <TrackedLink event="call_click" eventLocation="sidebar" href={site.contact.phoneHref} className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 font-semibold hover:bg-white/10">
          <Icon name="phone" /> {site.contact.phoneDisplay}
        </TrackedLink>
      </div>

      {toc && toc.length > 2 && (
        <nav aria-label="On this page" className="hidden rounded-[var(--radius-card)] border border-line bg-white p-6 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">On this page</p>
          <ol className="mt-3 space-y-2 text-sm">
            {toc.slice(0, 12).map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} className="line-clamp-2 text-ink-soft hover:text-brand-700">{h.text}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {related.length > 0 && (
        <nav aria-label={group?.label ?? "Related"} className="rounded-[var(--radius-card)] border border-line bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-600">{group?.label ?? "Related"}</p>
          <ul className="mt-3 space-y-1">
            {related.map((l) => (
              <li key={l.href}>
                <Link href={l.href!} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-ink-soft hover:bg-brand-50 hover:text-brand-700">
                  {l.label} <Icon name="chevron" className="size-4 shrink-0 opacity-50" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </aside>
  );
}
