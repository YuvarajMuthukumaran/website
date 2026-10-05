// Inner-page hero: a midnight stage with one soft key light, large type and
// an abstract scene chosen for the kind of page. The H1 is the live H1 text.
import type { ReactNode } from "react";
import clsx from "clsx";
import { Breadcrumbs, JsonLd, Kinetic } from "@/components/ui/primitives";
import { breadcrumbSchema } from "@/lib/seo";
import { HeroScene, type Scene } from "@/components/HeroScene";
import { Logo3D } from "@/components/Logo3D";

export function PageHero({ title, crumbs, lead, kicker, children, compact, scene, visual }: { title: string; crumbs: { name: string; path: string }[]; lead?: string | null; kicker?: string | null; children?: ReactNode; compact?: boolean; scene?: Scene | null; visual?: ReactNode }) {
  const art = visual ?? (scene === "cradle" ? <Logo3D /> : scene ? <HeroScene scene={scene} className="h-auto w-full" /> : null);
  return (
    <section className="on-dark stage relative overflow-clip bg-hero text-white">
      <div className="beam" aria-hidden="true" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-10%] hidden size-[36rem] rounded-full bg-brand-500/25 blur-[100px] md:block" />
      <div className={clsx("container-page relative grid items-center gap-10", art && "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]", compact ? "pt-32 pb-14 lg:pt-36 lg:pb-16" : "pt-36 pb-16 lg:pt-44 lg:pb-24")}>
        <div className="min-w-0">
          <Breadcrumbs items={crumbs} dark />
          {kicker && <p className="mt-6 max-w-3xl font-display text-lg font-semibold text-brand-200">{kicker}</p>}
          <h1 className={clsx("max-w-4xl text-[length:var(--text-h1)] leading-[1.02] font-extrabold tracking-[-0.04em]", kicker ? "mt-3" : "mt-6")}>
            <Kinetic text={title} tone="dark" />
          </h1>
          {lead && <p className="mt-6 max-w-[58ch] text-[length:var(--text-lead)] leading-relaxed text-brand-100/80">{lead}</p>}
          {children}
        </div>
        {art && (
          <div aria-hidden="true" className="hidden lg:block">
            {art}
          </div>
        )}
      </div>
      {/* hairline horizon where the stage meets daylight */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-300/40 to-transparent" />
      <JsonLd data={breadcrumbSchema(crumbs)} />
    </section>
  );
}
