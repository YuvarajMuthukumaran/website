// /team/ (the WordPress team archive, listed in the sitemap): every profile.
import type { Metadata } from "next";
import { getArchiveSeo, getDoctors } from "@/lib/content";
import { metadataFromArchive } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { TeamMember } from "@/components/team";
import { Reveal } from "@/components/ui/primitives";

export function generateMetadata(): Metadata {
  return metadataFromArchive(getArchiveSeo("/team/"), { title: "Team - Tulasi Healthcare", path: "/team/" });
}

export default function TeamIndex() {
  const groups = [
    { title: "Psychiatrists", list: getDoctors().filter((d) => d.role === "psychiatrist") },
    { title: "Psychologists and therapists", list: getDoctors().filter((d) => d.role !== "psychiatrist") },
  ];
  return (
    <>
      <PageHero title={getArchiveSeo("/team/")?.h1 ?? "Team"} crumbs={[{ name: "Home", path: "/" }, { name: "Team", path: "/team/" }]} />
      <div className="container-page space-y-16 py-14 lg:py-20">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="font-display text-[length:var(--text-h2)] font-bold text-ink">{g.title}</h2>
            <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {g.list.map((d, i) => (
                <Reveal as="li" key={d.slug} delay={(i % 5) * 60}><TeamMember d={d} index={i} excerpt={d.excerpt} /></Reveal>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
