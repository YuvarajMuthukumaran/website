// 404: calm, helpful, and never a dead end.
import Link from "next/link";
import { getPosts, getSite } from "@/lib/content";
import { ButtonLink, Icon } from "@/components/ui/primitives";

export const metadata = { title: { absolute: "Page not found - Tulasi Healthcare" }, robots: { index: false } };

export default function NotFound() {
  const site = getSite();
  const services = site.menu.find((m) => m.label === "Services")?.groups.flatMap((g) => g.links).slice(0, 8) ?? [];
  return (
    <section className="container-page py-20 lg:py-28">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 max-w-2xl text-[length:var(--text-h1)] font-extrabold leading-tight text-ink">We couldn’t find that page.</h1>
      <p className="mt-4 max-w-xl text-[length:var(--text-lead)] text-ink-soft">It may have moved. These links can help, or you can call us and we’ll guide you.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/" variant="primary">Go to the home page</ButtonLink>
        <ButtonLink href="/book-appointment/" variant="accent"><Icon name="calendar" /> Book Appointment</ButtonLink>
        <ButtonLink href={site.contact.phoneHref} variant="ghost"><Icon name="phone" /> {site.contact.phoneDisplay}</ButtonLink>
      </div>
      <div className="mt-14 grid gap-10 md:grid-cols-2">
        <nav aria-label="Services">
          <h2 className="font-display text-lg font-bold text-ink">Services</h2>
          <ul className="mt-3 space-y-2">{services.map((l) => <li key={l.href}><Link href={l.href ?? "/"} className="text-brand-700 hover:underline">{l.label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Recent articles">
          <h2 className="font-display text-lg font-bold text-ink">Recent articles</h2>
          <ul className="mt-3 space-y-2">{getPosts().slice(0, 6).map((p) => <li key={p.id}><Link href={p.path} className="text-brand-700 hover:underline">{p.title}</Link></li>)}</ul>
        </nav>
      </div>
    </section>
  );
}
