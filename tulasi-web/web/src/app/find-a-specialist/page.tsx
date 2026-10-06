// /find-a-specialist/: three quick questions that suggest the right doctors.
import type { Metadata } from "next";
import { absoluteUrl, getDoctors, getSite, localPath } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { portraitOf } from "@/components/team";
import { SpecialistFinder } from "@/components/finder/SpecialistFinder";

export const metadata: Metadata = {
  title: { absolute: "Find the Right Psychiatrist or Psychologist - Tulasi Healthcare" },
  description: "Answer three quick questions and we’ll suggest the right Tulasi Healthcare specialists for you, your child or someone you care about. Private, no sign-up.",
  alternates: { canonical: absoluteUrl("/find-a-specialist/") },
};

export default function FindASpecialist() {
  const site = getSite();
  const doctors = getDoctors().map((d) => {
    const p = portraitOf(d); // the background-removed cut-out when there is one
    return { slug: d.slug, name: d.name, designation: d.designation, photo: p?.src ?? (d.photo ? localPath(d.photo) : null), cutout: !!p?.cutout };
  });
  return (
    <>
      <PageHero
        compact
        title="Find the right specialist"
        lead="Three quick questions, and we’ll suggest who to see first. No sign-up needed."
        crumbs={[{ name: "Home", path: "/" }, { name: "Find a specialist", path: "/find-a-specialist/" }]}
      />
      <div className="bg-mist py-10 sm:py-14">
        <div className="container-page">
          <div className="mx-auto max-w-2xl rounded-[1.5rem] bg-white p-5 shadow-[0_0_0_1px_var(--color-line),var(--shadow-soft)] sm:p-8">
            <SpecialistFinder doctors={doctors} phone={{ display: site.contact.phoneDisplay, href: site.contact.phoneHref }} />
          </div>
        </div>
      </div>
    </>
  );
}
