// /team/ (the WordPress team archive, listed in the sitemap): every profile,
// with the same excerpts the live archive shows, in the team explorer.
import type { Metadata } from "next";
import { getArchiveSeo, getDoctorFacts, getDoctors } from "@/lib/content";
import { metadataFromArchive } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { PASTELS, portraitOf } from "@/components/team";
import { TeamExplorer, type TeamGroup } from "@/components/team/TeamExplorer";
import { expertiseTags, TAG_LIST } from "@/lib/team-tags";

export function generateMetadata(): Metadata {
  return metadataFromArchive(getArchiveSeo("/team/"), { title: "Team - Tulasi Healthcare", path: "/team/" });
}

export default function TeamIndex() {
  let n = 0;
  const groups: TeamGroup[] = [
    { heading: "Psychiatrists", anchor: "team-psychiatrists", list: getDoctors().filter((d) => d.role === "psychiatrist") },
    { heading: "Psychologists and therapists", anchor: "team-psychologists", list: getDoctors().filter((d) => d.role !== "psychiatrist") },
  ].map((g) => ({
    heading: g.heading,
    anchor: g.anchor,
    people: g.list.map((d) => {
      const facts = getDoctorFacts(d.slug);
      const p = portraitOf(d);
      return {
        slug: d.slug,
        name: d.name,
        designation: d.designation ?? "",
        src: p?.src ?? null,
        alt: d.name,
        cutout: !!p?.cutout,
        bg: PASTELS[n++ % PASTELS.length],
        tags: expertiseTags([d.designation ?? "", ...(facts?.expertise ?? [])].join(" ")),
        experience: facts?.experience ?? null,
        excerpt: d.excerpt,
      };
    }),
  }));
  const tags = TAG_LIST.map((tag) => ({ tag, count: groups.reduce((c, g) => c + g.people.filter((p) => p.tags.includes(tag)).length, 0) })).filter((t) => t.count > 1);
  return (
    <>
      <PageHero title={getArchiveSeo("/team/")?.h1 ?? "Team"} crumbs={[{ name: "Home", path: "/" }, { name: "Team", path: "/team/" }]} />
      <div className="container-page pb-24">
        <TeamExplorer groups={groups} tags={tags} />
      </div>
    </>
  );
}
