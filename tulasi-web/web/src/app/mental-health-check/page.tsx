// /mental-health-check/: free, private two-minute check-in (PHQ-9 / GAD-7).
import type { Metadata } from "next";
import { absoluteUrl, getSite } from "@/lib/content";
import { PageHero } from "@/components/PageHero";
import { Screener } from "@/components/screening/Screener";

export const metadata: Metadata = {
  title: { absolute: "Free 2-Minute Mental Health Check-In - Tulasi Healthcare" },
  description: "A free, private check-in for low mood or anxiety, using the well-known PHQ-9 and GAD-7 questions. No sign-up. Not a diagnosis.",
  alternates: { canonical: absoluteUrl("/mental-health-check/") },
};

export default function MentalHealthCheck() {
  const site = getSite();
  return (
    <>
      <PageHero
        compact
        title="A free two-minute check-in"
        lead="Answer a few questions about the last two weeks. It’s private, and it helps you decide what to do next."
        crumbs={[{ name: "Home", path: "/" }, { name: "Mental health check-in", path: "/mental-health-check/" }]}
      />
      <div className="bg-mist py-10 sm:py-14">
        <div className="container-page">
          <div className="mx-auto max-w-2xl rounded-[1.5rem] bg-white p-5 shadow-[0_0_0_1px_var(--color-line),var(--shadow-soft)] sm:p-8">
            <Screener phone={{ display: site.contact.phoneDisplay, href: site.contact.phoneHref }} />
          </div>
        </div>
      </div>
    </>
  );
}
