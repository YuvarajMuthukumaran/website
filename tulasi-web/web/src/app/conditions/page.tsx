// /conditions/: conditions A to Z with search, including illnesses that are not among the home page tiles.
import type { Metadata } from "next";
import { absoluteUrl, getSite } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { ConditionsAZ } from "@/components/conditions/ConditionsAZ";

export const metadata: Metadata = {
  title: { absolute: "Mental Health Conditions A to Z - Tulasi Healthcare" },
  description: "Find mental health and addiction conditions by first letter or search by name or symptom, and read how Tulasi Healthcare treats them.",
  alternates: { canonical: absoluteUrl("/conditions/") },
};

export default function ConditionsPage() {
  const site = getSite();
  return (
    <>
      <PageHero
        compact
        kicker="Conditions A to Z"
        title="Diseases and conditions we help with"
        lead="Pick a letter or search. If a condition isn’t listed, we’ll still point you to the right specialist."
        crumbs={[{ name: "Home", path: "/" }, { name: "Conditions", path: "/conditions/" }]}
      />
      <div className="py-10 sm:py-14">
        <div className="container-page">
          <ConditionsAZ phone={{ display: site.contact.phoneDisplay, href: site.contact.phoneHref }} />
        </div>
      </div>
    </>
  );
}
