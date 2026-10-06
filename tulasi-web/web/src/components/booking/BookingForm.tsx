"use client";
// Multi-step appointment booking: service → doctor → date & time → details.
// Saves to the hospital's own database through the Express API
// (POST /api/appointments), which re-validates everything server-side and
// sends the SMS/WhatsApp confirmation.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, createAppointment, fetchDoctors, fetchSlots, fetchSpecialties, type ApiDoctor, type Appointment } from "@/lib/api";
import { track } from "@/lib/analytics";
import { Icon } from "@/components/ui/primitives";

export type SiteDoctor = { slug: string; name: string; designation: string | null; photo: string | null };

const LABELS: Record<string, string> = {
  ocd: "OCD", depression: "Depression", anxiety: "Anxiety", bipolar: "Bipolar disorder", schizophrenia: "Schizophrenia", addiction: "Addiction & de-addiction",
  child_adolescent: "Child & adolescent", geriatric_dementia: "Dementia & elderly care", personality_disorder: "Personality disorders", sexual_disorder: "Sexual health",
  autism: "Autism", adhd: "ADHD", ptsd: "PTSD", relationship: "Relationships", stress: "Stress", rehabilitation: "Rehabilitation",
};
const STEPS = ["Service", "Doctor", "Date & time", "Your details"] as const;
const ANY = "__any";

const norm = (n: string) => n.toLowerCase().replace(/\(.*?\)|\b(dr|ms|mr|mrs)\.?\s/g, "").replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
const istDate = (offset: number) => {
  const d = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d); // YYYY-MM-DD
};
const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00+05:30`);
  return { dow: d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }), day: d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }), month: d.toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" }) };
};
const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function BookingForm({ siteDoctors }: { siteDoctors: SiteDoctor[] }) {
  const [step, setStep] = useState(0);
  const [specialties, setSpecialties] = useState<string[] | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<ApiDoctor[] | null>(null);
  const [doctor, setDoctor] = useState<ApiDoctor | null>(null);
  const [date, setDate] = useState(istDate(1));
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Appointment | null>(null);
  const [notBookable, setNotBookable] = useState<SiteDoctor | null>(null);
  const top = useRef<HTMLDivElement>(null);
  // The first step is server-rendered fully visible; only later steps animate in.
  const firstStep = useRef(true);
  useEffect(() => {
    firstStep.current = false;
  }, []);

  const site = useMemo(() => new Map(siteDoctors.map((d) => [norm(d.name), d])), [siteDoctors]);
  const siteFor = (d: ApiDoctor) => site.get(norm(d.name));
  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => istDate(i)), []);

  useEffect(() => {
    // Read the query here (not useSearchParams) so the form itself is server-rendered.
    const params = new URLSearchParams(window.location.search);
    track("booking_start", { location: params.get("from") ?? "direct" });
    fetchSpecialties().then((r) => setSpecialties(r.specialties)).catch((e) => setError(e.message));
    // Pre-selected service (/book-appointment/?service=anxiety, from the care guide)
    const pre = params.get("service");
    if (pre && !params.get("doctor")) {
      setService(pre);
      setStep(1);
    }
    // Pre-selected doctor (/book-appointment/?doctor=dr-pooja-sharma)
    const slug = params.get("doctor");
    if (slug) {
      const sd = siteDoctors.find((d) => d.slug === slug);
      if (sd)
        fetchDoctors()
          .then(({ doctors }) => {
            const match = doctors.find((d) => norm(d.name) === norm(sd.name));
            if (match) {
              setService(ANY);
              setDoctor(match);
              setStep(2);
            } else setNotBookable(sd);
          })
          .catch((e) => setError(e.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!service) return;
    setDoctors(null);
    fetchDoctors(service === ANY ? undefined : service).then((r) => setDoctors(r.doctors)).catch((e) => setError(e.message));
  }, [service]);

  useEffect(() => {
    if (!doctor) return;
    setSlots(null);
    setTime(null);
    fetchSlots(doctor._id, date).then((r) => setSlots(r.slots)).catch((e) => setError(e.message));
  }, [doctor, date]);

  const go = (n: number) => {
    setError(null);
    setStep(n);
    top.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  const phoneOk = /^(?:\+?91|0)?[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ""));
  const nameOk = name.trim().length >= 2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!doctor || !time || !nameOk || !phoneOk || !agree) return;
    setSubmitting(true);
    setError(null);
    try {
      const { appointment } = await createAppointment({ doctorId: doctor._id, patientName: name.trim(), patientPhone: phone, date, time });
      setDone(appointment);
      track("booking_complete", { doctor: doctor.name });
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.message);
      if (e2.status === 409) {
        go(2);
        fetchSlots(doctor._id, date).then((r) => setSlots(r.slots));
      }
    } finally {
      setSubmitting(false);
    }
  }

  function icsHref(a: Appointment) {
    const [y, mo, d] = a.date.split("-");
    const [h, mi] = a.time.split(":").map(Number);
    const start = new Date(Date.UTC(+y, +mo - 1, +d, h - 5, mi - 30));
    const end = new Date(start.getTime() + 30 * 60000);
    const f = (x: Date) => x.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tulasi Healthcare//Booking//EN", "BEGIN:VEVENT", `UID:${a._id}@tulasihealthcare.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`, `SUMMARY:Appointment with ${a.doctorName}`, "LOCATION:Tulasi Healthcare", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl rounded-[var(--radius-blob)] bg-white p-8 text-center shadow-[var(--shadow-lift)] ring-1 ring-line sm:p-12" role="status">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }} className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
          <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <motion.path d="m5 12.5 4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
          </svg>
        </motion.span>
        <h2 className="mt-6 font-display text-2xl font-bold text-ink">Your appointment is booked</h2>
        <p className="mt-2 text-ink-soft">
          <strong className="text-ink">{done.doctorName}</strong> · {dayLabel(done.date).dow} {dayLabel(done.date).day} {dayLabel(done.date).month} · {time12(done.time)}
        </p>
        <p className="mt-3 text-sm text-ink-soft">We’ll send a confirmation to your mobile. If you need to change it, sign in to the patient portal or call us.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a href={icsHref(done)} download="tulasi-appointment.ics" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line font-semibold text-ink hover:border-brand-300"><Icon name="calendar" /> Add to calendar</a>
          <Link href="/patient-login/" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700"><Icon name="user" /> Patient portal</Link>
        </div>
      </motion.div>
    );
  }

  const chosen = doctor ? siteFor(doctor) : undefined;

  return (
    <div ref={top} className="mx-auto max-w-4xl scroll-mt-32">
      {/* Progress */}
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Booking steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <button type="button" disabled={i > step} onClick={() => go(i)} className="w-full text-left disabled:cursor-default">
              <span className={clsx("block h-1.5 rounded-full transition-colors duration-500", i <= step ? "bg-brand-600" : "bg-line")} />
              <span className={clsx("mt-2 block text-xs font-semibold sm:text-sm", i === step ? "text-brand-700" : "text-ink-soft")}>
                <span className="sr-only">Step {i + 1}: </span>{s}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {notBookable && (
        <div className="mb-6 rounded-2xl bg-brand-50 p-5 text-ink" role="status">
          Online booking isn’t available for <strong>{notBookable.name}</strong> yet. Please choose a service below, or call us to book with them.
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-alert-50 p-4 text-alert-700" role="alert">
          <Icon name="close" className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      <div className="min-h-[560px] rounded-[var(--radius-blob)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line),0_1px_0_#fff_inset,0_30px_80px_-40px_rgb(6_26_107/0.45)] sm:min-h-[460px] sm:p-10">
        {/* Each step slides in with a CSS animation (the first one is static). */}
        <div key={step} className={firstStep.current ? undefined : "step-in"}>
            {step === 0 && (
              <fieldset>
                <legend className="font-display text-2xl font-bold text-ink">What would you like help with?</legend>
                <p className="mt-1 text-ink-soft">Not sure? Choose “General consultation” and our team will guide you.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[ANY, ...(specialties ?? [])].map((s) => (
                    <label key={s} className={clsx("flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 font-medium transition", service === s ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line hover:border-brand-300")}>
                      <input type="radio" name="service" value={s} checked={service === s} onChange={() => { setService(s); setDoctor(null); go(1); }} className="size-4 accent-[var(--color-brand-600)]" />
                      {s === ANY ? "General consultation" : LABELS[s] ?? s.replace(/_/g, " ")}
                    </label>
                  ))}
                  {!specialties && !error && Array.from({ length: 6 }, (_, i) => <span key={i} className="h-14 animate-pulse rounded-2xl bg-mist" />)}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="font-display text-2xl font-bold text-ink">Choose your specialist</legend>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {doctors?.map((d) => {
                    const s = siteFor(d);
                    return (
                      <label key={d._id} className={clsx("flex cursor-pointer items-center gap-4 rounded-2xl border p-3 transition", doctor?._id === d._id ? "border-brand-600 bg-brand-50" : "border-line hover:border-brand-300")}>
                        <input type="radio" name="doctor" className="sr-only" checked={doctor?._id === d._id} onChange={() => { setDoctor(d); go(2); }} />
                        <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                          {s?.photo && <Image src={s.photo} alt="" fill sizes="64px" className="object-cover object-top" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink">{d.name}</span>
                          <span className="block text-sm text-ink-soft">{s?.designation ?? d.role}</span>
                        </span>
                      </label>
                    );
                  })}
                  {!doctors && Array.from({ length: 4 }, (_, i) => <span key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-mist" />)}
                  {doctors?.length === 0 && <p className="text-ink-soft">No specialists found for this service. Please choose “General consultation”.</p>}
                </div>
              </fieldset>
            )}

            {step === 2 && doctor && (
              <div>
                <p className="font-display text-2xl font-bold text-ink">Pick a date and time</p>
                <p className="mt-1 text-ink-soft">with <strong className="text-ink">{doctor.name}</strong>{chosen?.designation ? `, ${chosen.designation}` : ""}</p>
                <fieldset className="mt-6">
                  <legend className="text-sm font-semibold text-ink-soft">Date</legend>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                    {dates.map((iso) => {
                      const l = dayLabel(iso);
                      return (
                        <label key={iso} className={clsx("grid min-w-16 cursor-pointer place-items-center rounded-2xl border px-2 py-3 text-center transition", date === iso ? "border-brand-600 bg-brand-600 text-white" : "border-line hover:border-brand-300")}>
                          <input type="radio" name="date" className="sr-only" checked={date === iso} onChange={() => setDate(iso)} />
                          <span className="text-xs">{l.dow}</span>
                          <span className="font-display text-lg font-bold">{l.day}</span>
                          <span className="text-xs">{l.month}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className="mt-6">
                  <legend className="text-sm font-semibold text-ink-soft">Time (IST)</legend>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {slots?.map((t) => (
                      <label key={t} className={clsx("grid min-h-11 cursor-pointer place-items-center rounded-xl border text-sm font-semibold transition", time === t ? "border-brand-600 bg-brand-600 text-white" : "border-line text-ink hover:border-brand-300")}>
                        <input type="radio" name="time" className="sr-only" checked={time === t} onChange={() => setTime(t)} />
                        {time12(t)}
                      </label>
                    ))}
                    {!slots && Array.from({ length: 10 }, (_, i) => <span key={i} className="h-11 animate-pulse rounded-xl bg-mist" />)}
                  </div>
                  {slots?.length === 0 && <p className="mt-2 text-ink-soft">No times left on this day. Please choose another date.</p>}
                </fieldset>
                <div className="mt-8 flex justify-between gap-3">
                  <button type="button" onClick={() => go(1)} className="min-h-12 rounded-full px-5 font-semibold text-brand-700 hover:bg-brand-50">Back</button>
                  <button type="button" disabled={!time} onClick={() => go(3)} className="min-h-12 rounded-full bg-brand-600 px-7 font-semibold text-white hover:bg-brand-700 disabled:opacity-40">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && doctor && time && (
              <form onSubmit={submit} noValidate>
                <p className="font-display text-2xl font-bold text-ink">Your details</p>
                <p className="mt-1 text-ink-soft">{doctor.name} · {dayLabel(date).dow} {dayLabel(date).day} {dayLabel(date).month} · {time12(time)}</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="b-name" className="text-sm font-semibold text-ink">Patient’s full name</label>
                    <input id="b-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required aria-invalid={!!name && !nameOk} className="mt-2 min-h-12 w-full rounded-2xl border border-line px-4 text-ink transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label htmlFor="b-phone" className="text-sm font-semibold text-ink">Mobile number</label>
                    <input id="b-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required aria-invalid={!!phone && !phoneOk} aria-describedby="b-phone-help" placeholder="98765 43210" className="mt-2 min-h-12 w-full rounded-2xl border border-line px-4 text-ink transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100" />
                    <p id="b-phone-help" className={clsx("mt-1.5 text-xs", phone && !phoneOk ? "text-alert-700" : "text-ink-soft")}>{phone && !phoneOk ? "Please enter a 10-digit Indian mobile number." : "We’ll send your confirmation here."}</p>
                  </div>
                </div>
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-mist p-4 text-sm leading-relaxed text-ink-soft">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand-600)]" required />
                  <span>I agree to Tulasi Healthcare using these details only to arrange this appointment and contact me about it, as described in the <Link href="/privacy-policy/" className="font-semibold text-brand-700 underline">Privacy Policy</Link>.</span>
                </label>
                <div className="mt-8 flex justify-between gap-3">
                  <button type="button" onClick={() => go(2)} className="min-h-12 rounded-full px-5 font-semibold text-brand-700 hover:bg-brand-50">Back</button>
                  <button type="submit" disabled={!nameOk || !phoneOk || !agree || submitting} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-600 px-7 font-semibold text-white hover:bg-accent-700 disabled:opacity-40">
                    {submitting ? "Booking…" : <>Confirm booking <Icon name="check" className="size-4" /></>}
                  </button>
                </div>
              </form>
            )}
        </div>
      </div>
    </div>
  );
}
