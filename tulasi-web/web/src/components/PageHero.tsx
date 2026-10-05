// Header band for inner pages: breadcrumbs + the page's H1 (the live H1 text).
import type { ReactNode } from "react";
import { Breadcrumbs, JsonLd } from "@/components/ui/primitives";
import { breadcrumbSchema } from "@/lib/seo";

export function PageHero({ title, crumbs, lead, kicker, children, compact }: { title: string; crumbs: { name: string; path: string }[]; lead?: string | null; kicker?: string | null; children?: ReactNode; compact?: boolean }) {
  return (
    <section className="on-dark relative isolate overflow-clip bg-hero text-white">
      <div aria-hidden="true" className="orb pointer-events-none absolute hidden md:block -top-24 right-[-6rem] size-[24rem] rounded-full bg-brand-300/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className={`container-page relative ${compact ? "py-12 lg:py-14" : "py-14 lg:py-20"}`}>
        <Breadcrumbs items={crumbs} dark />
        {kicker && <p className="mt-5 max-w-4xl font-display text-lg font-semibold text-brand-100">{kicker}</p>}
        <h1 className={`${kicker ? "mt-2" : "mt-5"} max-w-4xl text-[length:var(--text-h1)] font-extrabold leading-[1.1]`}>{title}</h1>
        {lead && <p className="mt-5 max-w-2xl text-[length:var(--text-lead)] leading-relaxed text-brand-100">{lead}</p>}
        {children}
      </div>
      <svg aria-hidden="true" viewBox="0 0 1440 48" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-6 w-full text-white lg:h-10">
        <path d="M0 48V24C360 0 720 0 1080 18c180 9 270 12 360 6v24z" fill="currentColor" />
      </svg>
      <JsonLd data={breadcrumbSchema(crumbs)} />
    </section>
  );
}
