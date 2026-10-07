// /book-appointment/ (new page): multi-step booking against the hospital's own database.
import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, getDoctors, getSite } from "@/lib/content";
import { pastelFor, portraitOf } from "@/components/team";
import { PageHero } from "@/components/PageHero";
import { BookingForm } from "@/components/booking/BookingForm";
import { Icon } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: { absolute: "Book an Appointment with a Psychiatrist or Psychologist - Tulasi Healthcare" },
  description: "Book a consultation with Tulasi Healthcare’s psychiatrists and psychologists in Delhi & Gurgaon. Choose your specialist, date and time online.",
  alternates: { canonical: absoluteUrl("/book-appointment/") },
};

export default function BookAppointment() {
  const site = getSite();
  const siteDoctors = getDoctors().map((d) => ({ slug: d.slug, name: d.name, designation: d.designation, photo: portraitOf(d)?.src ?? null, tint: pastelFor(d.slug) }));
  return (
    <>
      <PageHero
        title="Book an Appointment"
        lead="Choose a service, a specialist and a time that suits you. It takes about a minute."
        crumbs={[{ name: "Home", path: "/" }, { name: "Book an Appointment", path: "/book-appointment/" }]}
      >
        <p className="mt-6 text-sm text-ink-soft">Not sure who to see? <Link href="/find-a-specialist/" className="font-semibold text-brand-700 underline decoration-brand-200 underline-offset-4 hover:text-brand-900">Find the right specialist</Link></p>
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-soft">
          <Icon name="phone" className="size-4" /> Prefer to talk? Call <a href={site.contact.phoneHref} className="font-semibold text-ink underline underline-offset-2">{site.contact.phoneDisplay}</a>
        </p>
      </PageHero>
      <div className="bg-mist py-12 lg:py-16">
        <div className="container-page">
          <BookingForm siteDoctors={siteDoctors} clinicPhone={{ display: site.contact.phoneDisplay, href: site.contact.phoneHref }} />
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-soft">
            If you or someone you know is in immediate danger, call <a href={site.contact.phoneHref} className="font-semibold text-alert-700 underline">Tulasi Healthcare on {site.contact.phoneDisplay}</a> now. Online booking is not for emergencies.
          </p>
        </div>
      </div>
    </>
  );
}
