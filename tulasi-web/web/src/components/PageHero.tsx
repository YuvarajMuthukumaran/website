// Inner-page header: white, compact, readable. Breadcrumbs, one modest heading
// and an optional lead. (Pages put extra content, such as buttons or tags,
// in `children`, and a picture or card in `visual`.)
import type { ReactNode } from "react";
import clsx from "clsx";
import { Breadcrumbs, JsonLd } from "@/components/ui/primitives";
import { breadcrumbSchema } from "@/lib/seo";

export function PageHero({ title, crumbs, lead, kicker, children, compact, visual }: { title: string; crumbs: { name: string; path: string }[]; lead?: string | null; kicker?: string | null; children?: ReactNode; compact?: boolean; visual?: ReactNode }) {
  return (
    <section className="border-b border-line bg-gradient-to-b from-mist to-white">
      <div className={clsx("container-page grid items-center gap-8", visual && "lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]", compact ? "py-8 lg:py-10" : "py-10 sm:py-12 lg:py-14")}>
        <div className="min-w-0">
          <Breadcrumbs items={crumbs} />
          {kicker && <p className="eyebrow mt-5">{kicker}</p>}
          <h1 className={clsx("max-w-4xl text-[length:var(--text-h1)] leading-[1.12] font-semibold tracking-[-0.025em] text-ink", kicker ? "mt-3" : "mt-5")}>{title}</h1>
          {lead && <p className="mt-4 max-w-[62ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">{lead}</p>}
          {children}
        </div>
        {visual && <div className="min-w-0">{visual}</div>}
      </div>
      <JsonLd data={breadcrumbSchema(crumbs)} />
    </section>
  );
}
