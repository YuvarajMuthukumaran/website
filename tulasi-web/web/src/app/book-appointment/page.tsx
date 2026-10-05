// /book-appointment/ (new page): multi-step booking against the hospital's own database.
import type { Metadata } from "next";
import { absoluteUrl, getDoctors, getSite, localPath } from "@/lib/content";
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
  const siteDoctors = getDoctors().map((d) => ({ slug: d.slug, name: d.name, designation: d.designation, photo: d.photo ? localPath(d.photo) : null }));
  return (
    <>
      <PageHero
        scene="rings"
        title="Book an Appointment"
        lead="Choose a service, a specialist and a time that suits you. It takes about a minute."
        crumbs={[{ name: "Home", path: "/" }, { name: "Book an Appointment", path: "/book-appointment/" }]}
      >
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-brand-100">
          <Icon name="phone" className="size-4" /> Prefer to talk? Call <a href={site.contact.phoneHref} className="font-semibold text-white underline">{site.contact.phoneDisplay}</a>
        </p>
      </PageHero>
      <div className="grid-light bg-mist py-16 lg:py-24">
        <div className="container-page">
          <BookingForm siteDoctors={siteDoctors} />
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-soft">
            If you or someone you know is in immediate danger, call <a href="tel:14416" className="font-semibold text-accent-700 underline">Tele-MANAS 14416</a> or <a href="tel:112" className="font-semibold text-accent-700 underline">112</a> now. Online booking is not for emergencies.
          </p>
        </div>
      </div>
    </>
  );
}
