"use client";
// Appointment booking: service → doctor → date & time → your details, with a live summary beside it.
// Verification is by e-mail: we send a 6-digit code to the patient's address, and booking needs it.
// Saves to the hospital's own database through the Express API (POST /api/appointments), which
// re-validates everything server-side and e-mails the confirmation.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, createAppointment, fetchDoctors, fetchSlots, fetchSpecialties, requestOtp, type ApiDoctor, type Appointment } from "@/lib/api";
import { track } from "@/lib/analytics";
import { Icon } from "@/components/ui/primitives";

export type SiteDoctor = { slug: string; name: string; designation: string | null; photo: string | null; tint: string };

const LABELS: Record<string, string> = {
  ocd: "OCD", depression: "Depression", anxiety: "Anxiety", bipolar: "Bipolar disorder", schizophrenia: "Schizophrenia", addiction: "Addiction & de-addiction",
  child_adolescent: "Child & adolescent", geriatric_dementia: "Dementia & elderly care", personality_disorder: "Personality disorders", sexual_disorder: "Sexual health",
  autism: "Autism", adhd: "ADHD", ptsd: "PTSD", relationship: "Relationships", stress: "Stress", rehabilitation: "Rehabilitation",
};
const STEPS = ["Service", "Specialist", "Date & time", "Your details"] as const;
const ANY = "__any";

const norm = (n: string) => n.toLowerCase().replace(/\(.*?\)|\b(dr|ms|mr|mrs)\.?\s/g, "").replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
const istDate = (offset: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(Date.now() + offset * 86400000)); // YYYY-MM-DD
const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00+05:30`);
  const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", { ...o, timeZone: "Asia/Kolkata" });
  return { dow: f({ weekday: "short" }), day: f({ day: "numeric" }), month: f({ month: "short" }), long: f({ weekday: "long", day: "numeric", month: "long" }) };
};
const time12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const field = "mt-2 min-h-14 w-full rounded-2xl border border-line bg-white px-4 text-base text-ink transition focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function BookingForm({ siteDoctors, clinicPhone }: { siteDoctors: SiteDoctor[]; clinicPhone: { display: string; href: string } }) {
  const [step, setStep] = useState(0);
  const [specialties, setSpecialties] = useState<string[] | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<ApiDoctor[] | null>(null);
  const [doctor, setDoctor] = useState<ApiDoctor | null>(null);
  const [date, setDate] = useState(istDate(1));
  const [slots, setSlots] = useState<string[] | null>(null);
  // How many times are open on each of the next 14 days, so days the doctor isn't in can be greyed out.
  const [openByDay, setOpenByDay] = useState<Record<string, number> | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [sending, setSending] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Appointment | null>(null);
  const [notBookable, setNotBookable] = useState<SiteDoctor | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the ?service= link once on load
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loading state while a new list is fetched
    setDoctors(null);
    fetchDoctors(service === ANY ? undefined : service).then((r) => setDoctors(r.doctors)).catch((e) => setError(e.message));
  }, [service]);

  useEffect(() => {
    if (!doctor) return;
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loading state while availability is fetched
    setOpenByDay(null);
    Promise.all(dates.map((d) => fetchSlots(doctor._id, d).then((r) => [d, r.slots.length] as const).catch(() => [d, -1] as const))).then((rows) => {
      if (!live) return;
      const map = Object.fromEntries(rows);
      setOpenByDay(map);
      // Start on the first day that has anything open, instead of an empty day.
      setDate((cur) => (map[cur] === 0 ? (dates.find((d) => map[d] > 0) ?? cur) : cur));
    });
    return () => {
      live = false;
    };
  }, [doctor, dates]);

  useEffect(() => {
    if (!doctor) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loading state while times are fetched
    setSlots(null);
    setTime(null);
    fetchSlots(doctor._id, date).then((r) => setSlots(r.slots)).catch((e) => setError(e.message));
  }, [doctor, date]);

  useEffect(() => {
    if (!resendIn) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const go = (n: number) => {
    setError(null);
    setStep(n);
    top.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim());
  const nameOk = name.trim().length >= 2;

  async function sendCode() {
    if (!emailOk || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await requestOtp(email.trim());
      setDevCode(r.devCode ?? null);
      setCodeSent(true);
      setCode("");
      setResendIn(30);
      setTimeout(() => codeRef.current?.focus(), 60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!doctor || !time || !nameOk || !emailOk || code.length !== 6 || !agree) return;
    setSubmitting(true);
    setError(null);
    try {
      const { appointment } = await createAppointment({ doctorId: doctor._id, patientName: name.trim(), patientEmail: email.trim(), code, date, time });
      // Routing hint for the portal (the real session is the API's httpOnly cookie, set by the booking).
      document.cookie = "thc_signed_in=1; path=/; max-age=604800; SameSite=Lax";
      setDone(appointment);
      track("booking_complete", { doctor: doctor.name });
    } catch (err) {
      const e2 = err as ApiError;
      setError(e2.message);
      if (e2.status === 409) {
        go(2);
        fetchSlots(doctor._id, date).then((r) => setSlots(r.slots));
      } else if (e2.status === 401) setCode("");
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
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }} className="mx-auto grid size-20 place-items-center rounded-full bg-sage-50 text-sage-600 ring-8 ring-sage-50/60">
          <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <motion.path d="m5 12.5 4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3 }} />
          </svg>
        </motion.span>
        <h2 className="mt-6 font-display text-2xl font-semibold text-ink">Your appointment is booked</h2>
        <p className="mt-3 text-ink-soft">
          <strong className="text-ink">{done.doctorName}</strong><br />
          {dayLabel(done.date).long} · {time12(done.time)}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">We’ve sent a confirmation to <strong className="text-ink">{email.trim()}</strong>. You’re signed in, so you can see, change or cancel it in the patient portal.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a href={icsHref(done)} download="tulasi-appointment.ics" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line font-semibold text-ink hover:border-brand-300"><Icon name="calendar" /> Add to calendar</a>
          <Link href="/portal/" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700"><Icon name="user" /> My appointments</Link>
        </div>
      </motion.div>
    );
  }

  const chosen = doctor ? siteFor(doctor) : undefined;
  const serviceLabel = service ? (service === ANY ? "General consultation" : LABELS[service] ?? service.replace(/_/g, " ")) : null;

  return (
    <div ref={top} className="mx-auto max-w-6xl scroll-mt-32">
      {/* Progress */}
      <ol className="mb-8 flex items-center gap-2 sm:gap-3" aria-label="Booking steps">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={clsx("flex items-center gap-2 sm:gap-3", i < STEPS.length - 1 && "flex-1")}>
            <button type="button" disabled={i > step} onClick={() => go(i)} className="flex items-center gap-2.5 disabled:cursor-default">
              <span className={clsx("grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors duration-300", i < step ? "bg-sage-600 text-white" : i === step ? "bg-brand-600 text-white" : "bg-white text-ink-soft shadow-[inset_0_0_0_1px_var(--color-line)]")}>
                {i < step ? <Icon name="check" className="size-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className={clsx("hidden text-sm font-semibold sm:block", i === step ? "text-ink" : "text-ink-soft")}>
                <span className="sr-only">Step {i + 1}: </span>{s}
              </span>
            </button>
            {i < STEPS.length - 1 && <span aria-hidden="true" className={clsx("h-0.5 flex-1 rounded-full transition-colors duration-500", i < step ? "bg-sage-500" : "bg-line")} />}
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

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-h-[30rem] rounded-[var(--radius-blob)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line),var(--shadow-soft)] sm:p-9">
          {/* Each step slides in with a CSS animation (the first one is static). */}
          {/* eslint-disable-next-line react-hooks/refs -- the first step is server-rendered fully visible; only later steps animate in */}
          <div key={step} className={firstStep.current ? undefined : "step-in"}>
            {step === 0 && (
              <fieldset>
                <legend className="font-display text-[1.65rem] leading-tight font-semibold tracking-[-0.02em] text-ink">What would you like help with?</legend>
                <p className="mt-2 text-ink-soft">Not sure? Choose “General consultation” and our team will guide you.</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[ANY, ...(specialties ?? [])].map((s) => (
                    <label key={s} className={clsx("group flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 font-medium transition-[border-color,background-color,box-shadow] duration-200", service === s ? "border-brand-600 bg-brand-50 text-brand-900 shadow-[0_0_0_3px_var(--color-brand-100)]" : "border-line hover:border-brand-300 hover:bg-mist")}>
                      <input type="radio" name="service" value={s} checked={service === s} onChange={() => { setService(s); setDoctor(null); go(1); }} className="sr-only" />
                      <span className={clsx("grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors", service === s ? "border-brand-600" : "border-line group-hover:border-brand-300")}>
                        <span className={clsx("size-2.5 rounded-full bg-brand-600 transition-transform", service === s ? "scale-100" : "scale-0")} />
                      </span>
                      {s === ANY ? "General consultation" : LABELS[s] ?? s.replace(/_/g, " ")}
                    </label>
                  ))}
                  {!specialties && !error && Array.from({ length: 6 }, (_, i) => <span key={i} className="h-16 animate-pulse rounded-2xl bg-mist" />)}
                </div>
              </fieldset>
            )}

            {step === 1 && (
              <fieldset>
                <legend className="font-display text-[1.65rem] leading-tight font-semibold tracking-[-0.02em] text-ink">Choose your specialist</legend>
                <p className="mt-2 text-ink-soft">{serviceLabel}. Pick whoever feels right; you can go back and change it.</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {doctors?.map((d) => {
                    const s = siteFor(d);
                    const on = doctor?._id === d._id;
                    return (
                      <label key={d._id} className={clsx("flex cursor-pointer items-center gap-4 rounded-2xl border p-3 transition-[border-color,background-color,box-shadow] duration-200", on ? "border-brand-600 bg-brand-50 shadow-[0_0_0_3px_var(--color-brand-100)]" : "border-line hover:border-brand-300 hover:bg-mist")}>
                        <input type="radio" name="doctor" className="sr-only" checked={on} onChange={() => { setDoctor(d); go(2); }} />
                        <span className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-2xl" style={{ backgroundColor: s?.tint ?? "#eef2f7" }}>
                          {s?.photo && <Image src={s.photo} alt="" fill sizes="72px" className="object-cover object-top" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink">{d.name}</span>
                          <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-ink-soft">{s?.designation ?? d.role}</span>
                        </span>
                      </label>
                    );
                  })}
                  {!doctors && Array.from({ length: 4 }, (_, i) => <span key={i} className="h-24 animate-pulse rounded-2xl bg-mist" />)}
                  {doctors?.length === 0 && <p className="text-ink-soft">No specialists found for this service. Please choose “General consultation”.</p>}
                </div>
                <div className="mt-8"><button type="button" onClick={() => go(0)} className="min-h-12 rounded-full px-5 font-semibold text-brand-700 hover:bg-brand-50">Back</button></div>
              </fieldset>
            )}

            {step === 2 && doctor && (
              <div>
                <p className="font-display text-[1.65rem] leading-tight font-semibold tracking-[-0.02em] text-ink">Pick a date and time</p>
                <p className="mt-2 text-ink-soft">with <strong className="text-ink">{doctor.name}</strong>{chosen?.designation ? `, ${chosen.designation}` : ""}</p>
                <fieldset className="mt-7">
                  <legend className="text-sm font-semibold text-ink-soft">Date</legend>
                  <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-2">
                    {dates.map((iso) => {
                      const l = dayLabel(iso);
                      const closed = openByDay?.[iso] === 0;
                      return (
                        <label key={iso} title={closed ? "No appointments this day" : undefined} className={clsx("grid min-w-[4.25rem] place-items-center rounded-2xl border px-2 py-3 text-center transition-[border-color,background-color] duration-200", closed ? "cursor-not-allowed border-line bg-mist text-ink-soft/50" : "cursor-pointer", date === iso ? "border-brand-600 bg-brand-600 text-white" : closed ? "" : "border-line hover:border-brand-300 hover:bg-mist")}>
                          <input type="radio" name="date" className="sr-only" checked={date === iso} disabled={closed} onChange={() => setDate(iso)} />
                          <span className="text-xs">{l.dow}</span>
                          <span className="font-display text-xl font-semibold">{l.day}</span>
                          <span className="text-xs">{l.month}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className="mt-6">
                  <legend className="text-sm font-semibold text-ink-soft">Time (IST)</legend>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {slots?.map((t) => (
                      <label key={t} className={clsx("grid min-h-12 cursor-pointer place-items-center rounded-xl border text-sm font-semibold transition-[border-color,background-color] duration-200", time === t ? "border-brand-600 bg-brand-600 text-white" : "border-line text-ink hover:border-brand-300 hover:bg-mist")}>
                        <input type="radio" name="time" className="sr-only" checked={time === t} onChange={() => setTime(t)} />
                        {time12(t)}
                      </label>
                    ))}
                    {!slots && Array.from({ length: 10 }, (_, i) => <span key={i} className="h-12 animate-pulse rounded-xl bg-mist" />)}
                  </div>
                  {slots?.length === 0 && <p className="mt-3 text-ink-soft">No times left on this day. Please choose another date.</p>}
                  {openByDay && Object.values(openByDay).every((n) => n <= 0) && (
                    <p className="mt-4 rounded-2xl bg-mist p-4 text-ink-soft">There are no online appointments open for {doctor.name} in the next two weeks. Please call us on <a href={clinicPhone.href} className="font-semibold text-ink underline">{clinicPhone.display}</a> and we’ll find a time, or choose another doctor.</p>
                  )}
                </fieldset>
                <div className="mt-8 flex justify-between gap-3">
                  <button type="button" onClick={() => go(1)} className="min-h-12 rounded-full px-5 font-semibold text-brand-700 hover:bg-brand-50">Back</button>
                  <button type="button" disabled={!time} onClick={() => go(3)} className="min-h-12 rounded-full bg-brand-600 px-8 font-semibold text-white hover:bg-brand-700 disabled:opacity-40">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && doctor && time && (
              <form onSubmit={submit} noValidate>
                <p className="font-display text-[1.65rem] leading-tight font-semibold tracking-[-0.02em] text-ink">Your details</p>
                <p className="mt-2 text-ink-soft">We’ll e-mail a 6-digit code to confirm it’s you, then send your confirmation to the same address.</p>
                <div className="mt-7 grid gap-5">
                  <div>
                    <label htmlFor="b-name" className="text-sm font-semibold text-ink">Patient’s full name</label>
                    <input id="b-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required aria-invalid={!!name && !nameOk} className={field} />
                  </div>
                  <div>
                    <label htmlFor="b-email" className="text-sm font-semibold text-ink">E-mail address</label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input id="b-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setCodeSent(false); setCode(""); }} required aria-invalid={!!email && !emailOk} placeholder="name@example.com" className={clsx(field, "sm:flex-1")} />
                      <button type="button" onClick={sendCode} disabled={!emailOk || sending || resendIn > 0} className="mt-0 min-h-14 shrink-0 rounded-2xl bg-brand-50 px-5 font-semibold text-brand-800 transition hover:bg-brand-100 disabled:opacity-50 sm:mt-2">
                        {sending ? "Sending…" : codeSent ? (resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code") : "Send code"}
                      </button>
                    </div>
                    <p className={clsx("mt-1.5 text-xs", email && !emailOk ? "text-alert-700" : "text-ink-soft")}>{email && !emailOk ? "Please enter a valid e-mail address." : "We use it only for this appointment."}</p>
                  </div>
                  {codeSent && (
                    <div className="step-in rounded-2xl bg-mist p-5">
                      <label htmlFor="b-code" className="text-sm font-semibold text-ink">Enter the 6-digit code we e-mailed you</label>
                      {devCode && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Sandbox mode: your code is <strong>{devCode}</strong></p>}
                      <input id="b-code" ref={codeRef} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-3 min-h-16 w-full rounded-2xl border border-line bg-white text-center font-display text-3xl font-semibold tracking-[0.5em] text-ink focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100" />
                      <p className="mt-2 text-xs text-ink-soft">Check your spam folder if it doesn’t arrive within a minute.</p>
                    </div>
                  )}
                </div>
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-mist p-4 text-sm leading-relaxed text-ink-soft">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand-600)]" required />
                  <span>I agree to Tulasi Healthcare using these details only to arrange this appointment and contact me about it, as described in the <Link href="/privacy-policy/" className="font-semibold text-brand-700 underline">Privacy Policy</Link>.</span>
                </label>
                <div className="mt-8 flex justify-between gap-3">
                  <button type="button" onClick={() => go(2)} className="min-h-12 rounded-full px-5 font-semibold text-brand-700 hover:bg-brand-50">Back</button>
                  <button type="submit" disabled={!nameOk || !emailOk || code.length !== 6 || !agree || submitting} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-600 px-8 font-semibold text-white hover:bg-brand-700 disabled:opacity-40">
                    {submitting ? "Booking…" : <>Confirm booking <Icon name="check" className="size-4" /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Live summary */}
        <aside className="rounded-[var(--radius-blob)] bg-white p-6 shadow-[0_0_0_1px_var(--color-line),var(--shadow-soft)] lg:sticky lg:top-28" aria-label="Your appointment so far">
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">Your appointment</p>
          <div className="mt-4 flex items-center gap-4">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-mist" style={chosen ? { backgroundColor: chosen.tint } : undefined}>
              {chosen?.photo ? <Image src={chosen.photo} alt="" fill sizes="64px" className="object-cover object-top" /> : <Icon name="user" className="absolute inset-0 m-auto size-7 text-ink-soft/50" />}
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg leading-snug font-semibold text-ink">{doctor ? doctor.name : "Choose a specialist"}</p>
              {(chosen?.designation || doctor?.role) && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{chosen?.designation ?? doctor?.role}</p>}
            </div>
          </div>
          <dl className="mt-6 space-y-3.5 border-t border-line pt-5 text-sm">
            {[
              ["Service", serviceLabel, "heart"],
              ["Date", doctor && date ? dayLabel(date).long : null, "calendar"],
              ["Time", time ? `${time12(time)} (IST)` : null, "clock"],
            ].map(([label, value, icon]) => (
              <div key={label as string} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mist text-ink-soft"><Icon name={icon as string} className="size-4" /></span>
                <div>
                  <dt className="text-xs text-ink-soft">{label}</dt>
                  <dd className={clsx("font-semibold", value ? "text-ink" : "text-ink-soft/60")}>{value ?? "Not chosen yet"}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-6 rounded-2xl bg-sage-50 p-4 text-xs leading-relaxed text-sage-700">The consultation fee is on each doctor’s profile. You can change or cancel this appointment later from the patient portal.</p>
          <p className="mt-4 text-xs text-ink-soft">Need help? Call <a href={clinicPhone.href} className="font-semibold text-ink underline">{clinicPhone.display}</a></p>
        </aside>
      </div>
    </div>
  );
}
