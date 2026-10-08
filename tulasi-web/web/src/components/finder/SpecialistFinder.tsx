"use client";
// "Find the right specialist": three plain questions (who, what, what kind of help)
// answered one at a time, then up to three suggested doctors with the reason for
// each. Nothing personal is asked or stored: the three answers go to POST /api/match,
// which ranks the real doctor directory. Calm by design: one question per screen,
// big targets, an easy way back, and a way out to a person at every step.
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ApiError, matchDoctors, type MatchInput, type MatchResult } from "@/lib/api";
import { track } from "@/lib/analytics";
import { WHO, type Who } from "@/lib/care";
import { OpenChatButton } from "@/components/chat/OpenChatButton";
import { Arrow, Icon } from "@/components/ui/primitives";

export type FinderDoctor = { slug: string; name: string; photo: string | null; designation: string | null; cutout?: boolean };

const norm = (n: string) => n.toLowerCase().replace(/\(.*?\)|\b(dr|ms|mr|mrs)\.?\s/g, "").replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();

type Option = { id: string; label: string; hint: string };
// What can be on someone's mind, in plain words. `id` is the specialty tag the doctor directory uses.
const O: Record<string, Option> = {
  anxiety: { id: "anxiety", label: "Anxiety or panic", hint: "Constant worry, panic attacks, fears" },
  depression: { id: "depression", label: "Low mood or depression", hint: "Sadness, no interest in things, hopelessness" },
  stress: { id: "stress", label: "Stress, burnout or poor sleep", hint: "Pressure at work or home, trouble sleeping" },
  ptsd: { id: "ptsd", label: "Trauma or PTSD", hint: "After a frightening or painful event" },
  ocd: { id: "ocd", label: "OCD", hint: "Repeating thoughts, checking or rituals" },
  bipolar: { id: "bipolar", label: "Mood swings (bipolar)", hint: "Very high and very low phases" },
  psychosis: { id: "schizophrenia", label: "Hearing or seeing things, or paranoia", hint: "Psychosis, schizophrenia, withdrawal" },
  addiction: { id: "addiction", label: "Alcohol or drug use", hint: "Drinking or drug use that is hard to stop" },
  gaming: { id: "addiction", label: "Gaming or screen addiction", hint: "Hours online, cannot cut down" },
  relationship: { id: "relationship", label: "Relationships or marriage", hint: "Conflict, distance, family or couple issues" },
  sexual: { id: "sexual_disorder", label: "Sexual health", hint: "Private concerns, handled discreetly" },
  personality: { id: "personality_disorder", label: "Anger or unstable relationships", hint: "Intense emotions, personality difficulties" },
  adhd: { id: "adhd", label: "ADHD or attention problems", hint: "Restless, distracted, impulsive" },
  autism: { id: "autism", label: "Autism or development", hint: "Speech, social or learning differences" },
  child: { id: "child_adolescent", label: "Behaviour, school or emotions", hint: "Tantrums, anger, learning, withdrawn" },
  examStress: { id: "stress", label: "Exam or school stress", hint: "Pressure, fear of failing, bullying" },
  dementia: { id: "geriatric_dementia", label: "Memory loss or dementia", hint: "Forgetting, confusion, getting lost" },
  lgbtq: { id: "stress", label: "LGBTQ+ support", hint: "Identity, coming out, family acceptance" },
  elderSleep: { id: "stress", label: "Poor sleep or restlessness", hint: "Not sleeping, agitation, worry" },
};
const OPTIONS: Record<Who, Option[]> = {
  self: [O.anxiety, O.depression, O.stress, O.ptsd, O.ocd, O.bipolar, O.relationship, O.addiction, O.gaming, O.adhd, O.sexual, O.lgbtq, O.personality, O.psychosis],
  child: [O.anxiety, O.depression, O.child, O.adhd, O.autism, O.examStress, O.gaming, O.ocd, O.ptsd, O.addiction],
  elder: [O.dementia, O.depression, O.anxiety, O.elderSleep, O.psychosis, O.bipolar, O.addiction],
  loved: [O.depression, O.anxiety, O.addiction, O.bipolar, O.psychosis, O.stress, O.ptsd, O.ocd, O.relationship, O.lgbtq, O.gaming, O.personality],
};

const SUPPORT: { id: MatchInput["support"]; label: string; hint: string }[] = [
  { id: "therapy", label: "Talking therapy", hint: "Regular sessions with a psychologist or counsellor" },
  { id: "medication", label: "A psychiatrist", hint: "Assessment, diagnosis and medication if needed" },
  { id: "unsure", label: "I’m not sure yet", hint: "We’ll suggest a good place to start" },
];
// Not a doctor match: admission and rehab begin with a short assessment by our team.
const RESIDENTIAL = { label: "Hospital stay or rehabilitation", hint: "Admission, de-addiction or residential care" };
const WHO_HINT: Record<Who, string> = { self: "I’m looking for help for myself", child: "Under 18, including school-age children", elder: "Memory, mood or behaviour changes with age", loved: "A partner, sibling or friend" };
const STEP_HELP = ["Choose the closest. It only shapes the suggestions, and you can start again at any time.", "Pick what matters most right now. If several apply, start with the one that worries you most."];
const STEP_TITLE = ["Who is this for?", "What’s been on your mind?", "What kind of help are you thinking about?"];

const optionClass =
  "group flex w-full min-h-14 items-center gap-3 rounded-[var(--radius-card)] bg-white px-4 py-3 text-left shadow-[inset_0_0_0_1px_var(--color-line)] transition-[box-shadow,transform,background-color] duration-300 hover:bg-brand-50 hover:shadow-[inset_0_0_0_1px_var(--color-brand-300)] focus-visible:bg-brand-50 active:scale-[0.99]";

export function SpecialistFinder({ doctors, phone }: { doctors: FinderDoctor[]; phone: { display: string; href: string } }) {
  const reduce = useReducedMotion();
  const [who, setWho] = useState<Who | null>(null);
  const [concern, setConcern] = useState<{ id: string; label: string } | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [residential, setResidential] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  const bySite = useMemo(() => new Map(doctors.map((d) => [norm(d.name), d])), [doctors]);
  const step = result || error || crisis || residential ? 3 : concern ? 2 : who ? 1 : 0;

  const concernOptions = useMemo(() => (who ? OPTIONS[who] : []), [who]);

  // Each new question heading takes focus as it appears (after the exit animation), so
  // keyboard and screen-reader users follow along. The very first heading does not.
  const seenFirst = useRef(false);
  const focusHeading = useCallback((el: HTMLHeadingElement | null) => {
    if (!el) return;
    if (!seenFirst.current) {
      seenFirst.current = true;
      return;
    }
    el.focus({ preventScroll: true });
  }, []);

  async function find(support: MatchInput["support"]) {
    if (!who || !concern) return;
    setLoading(true);
    setError(null);
    setSlow(false);
    // The API host sleeps when idle; the first answer can take a while, so say so.
    const timer = setTimeout(() => setSlow(true), 3500);
    try {
      const r = await matchDoctors({ concern: concern.id, who, support });
      setResult(r);
      track("finder_complete");
    } catch (e) {
      setError(e instanceof ApiError && e.status === 429 ? e.message : "We couldn’t find a match just now.");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  function back() {
    if (result || error) {
      setResult(null);
      setError(null);
    } else if (residential) setResidential(false);
    else if (crisis) setCrisis(false);
    else if (concern) setConcern(null);
    else setWho(null);
  }
  function restart() {
    setWho(null);
    setConcern(null);
    setResult(null);
    setError(null);
    setCrisis(false);
    setResidential(false);
  }

  const motionProps = reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } };
  const title = result || error ? "Here’s where we’d start" : crisis ? "Please talk to someone now" : residential ? "Our team will guide you" : STEP_TITLE[step];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-ink-soft" aria-live="polite">
          {result || error ? "Your suggestions" : crisis ? "Support right now" : residential ? "Next step" : `Step ${step + 1} of 3`}
        </p>
        {step > 0 && !loading && (
          <button type="button" onClick={back} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            <Icon name="arrow" className="size-4 rotate-180" /> Back
          </button>
        )}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage-50" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={Math.min(step + 1, 3)} aria-label="Progress">
        <div className="h-full rounded-full bg-sage-500 transition-[width] duration-500 ease-[var(--ease-calm)]" style={{ width: `${(Math.min(step + 1, 3) / 3) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${step}-${loading}-${!!result}-${!!error}-${crisis}-${residential}`} {...motionProps} className="mt-6">
          <h2 ref={focusHeading} tabIndex={-1} className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.015em] text-ink outline-none sm:text-[1.75rem]">
            {loading ? "Finding the right people…" : title}
          </h2>

          {loading && (
            <div className="mt-6 space-y-3" role="status">
              <span className="sr-only">Finding specialists</span>
              {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-[var(--radius-card)] bg-sage-50" />)}
              {slow && <p className="text-sm text-ink-soft">Waking our system up. This can take up to a minute the first time. Thank you for your patience.</p>}
            </div>
          )}

          {!loading && !who && <p className="mt-2 text-ink-soft">{STEP_HELP[0]}</p>}
          {!loading && !who && (
            <ul className="mt-5 space-y-3">
              {WHO.map((w) => (
                <li key={w.id}>
                  <button type="button" className={optionClass} onClick={() => setWho(w.id)}>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{w.label}</span>
                      <span className="block text-sm text-ink-soft">{WHO_HINT[w.id]}</span>
                    </span>
                    <Icon name="arrow" className="size-4 shrink-0 text-brand-600 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && who && !concern && !crisis && !result && !error && (
            <>
              <p className="mt-2 text-ink-soft">{STEP_HELP[1]}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {concernOptions.map((c) => (
                  <li key={c.label}>
                    <button type="button" className={optionClass} onClick={() => setConcern({ id: c.id, label: c.label })}>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{c.label}</span>
                        <span className="block text-sm text-ink-soft">{c.hint}</span>
                      </span>
                    </button>
                  </li>
                ))}
                <li><button type="button" className={optionClass} onClick={() => setConcern({ id: "unsure", label: "Not sure yet" })}><span className="min-w-0 flex-1"><span className="block font-semibold text-ink">I’m not sure yet</span><span className="block text-sm text-ink-soft">We’ll suggest a place to start</span></span></button></li>
              </ul>
              <button type="button" onClick={() => setCrisis(true)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-semibold text-alert-700 underline underline-offset-4 hover:text-alert-600">
                <Icon name="heart" className="size-4" /> I’m having thoughts of harming myself
              </button>
            </>
          )}

          {!loading && who && concern && !result && !error && (
            <>
              <p className="mt-2 text-ink-soft">For: <strong className="font-semibold text-ink">{concern.label}</strong></p>
              <ul className="mt-5 space-y-3">
                {SUPPORT.map((s) => (
                  <li key={s.id}>
                    <button type="button" className={optionClass} onClick={() => find(s.id)}>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{s.label}</span>
                        <span className="block text-sm text-ink-soft">{s.hint}</span>
                      </span>
                      <Icon name="arrow" className="size-4 shrink-0 text-brand-600 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" className={optionClass} onClick={() => { setResidential(true); track("finder_residential"); }}>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{RESIDENTIAL.label}</span>
                      <span className="block text-sm text-ink-soft">{RESIDENTIAL.hint}</span>
                    </span>
                    <Icon name="arrow" className="size-4 shrink-0 text-brand-600 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </button>
                </li>
              </ul>
            </>
          )}

          {!loading && residential && (
            <div className="mt-4">
              <p className="leading-relaxed text-ink-soft">Admission and rehabilitation start with a short assessment, so our team can recommend the right level of care. Call us and we’ll arrange it, or read how it works first.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href={phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700"><Icon name="phone" className="size-4" /> Call {phone.display}</a>
                <Link href="/rehabilitation-centre/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50">How inpatient care works <Arrow /></Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <Link href="/book-appointment/" className="min-h-10 font-semibold text-brand-700 underline decoration-line underline-offset-4 hover:text-brand-900">Or book a consultation first</Link>
                <button type="button" onClick={restart} className="min-h-10 font-semibold text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">Start again</button>
              </div>
            </div>
          )}

          {!loading && crisis && (
            <div className="mt-5 rounded-[var(--radius-card)] bg-alert-50 p-5 shadow-[inset_0_0_0_1px_var(--color-alert-100)]">
              <p className="leading-relaxed text-ink">You don’t have to go through this alone, and you don’t need to answer anything else first. Please reach out right now:</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <a href={phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 font-semibold text-alert-700 shadow-[inset_0_0_0_1px_var(--color-alert-100)] hover:bg-alert-100"><Icon name="phone" className="size-4" /> Tulasi {phone.display}</a>
              </div>
              <p className="mt-4 text-sm text-ink-soft">If you are in immediate danger, go to the nearest emergency department.</p>
            </div>
          )}

          {!loading && error && (
            <div className="mt-5">
              <p className="leading-relaxed text-ink-soft">{error} Our team can help you choose a specialist in a couple of minutes.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href={phone.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white hover:bg-brand-700"><Icon name="phone" className="size-4" /> Call {phone.display}</a>
                <Link href="/book-appointment/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50">Choose a doctor yourself <Arrow /></Link>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="mt-4">
              {result.matches.length === 0 ? (
                <p className="leading-relaxed text-ink-soft">We’d rather guide you personally than guess. Call us and we’ll find the right person for you.</p>
              ) : (
                <>
                  <p className="leading-relaxed text-ink-soft">
                    {result.relaxed ? "We don’t have a specialist listed for exactly this, so these are the closest fits. Call us if you’d like help choosing." : "Based on your answers, these specialists are a good place to start."}
                  </p>
                  <ul className="mt-5 space-y-4">
                    {result.matches.map((m) => {
                      const site = bySite.get(norm(m.name));
                      const photo = site?.photo ?? m.photo;
                      const initials = m.name.replace(/^(Dr|Ms|Mr|Mrs)\.\s*/, "").replace(/\(.*?\)\s*/, "").split(" ").map((w) => w[0]).join("").slice(0, 2);
                      const book = `/book-appointment/?${site ? `doctor=${site.slug}&` : ""}from=finder`;
                      return (
                        <li key={m.name} className="rounded-[var(--radius-card)] bg-white p-4 shadow-[0_0_0_1px_var(--color-line)] sm:p-5">
                          <div className="flex gap-4">
                            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-sage-50 sm:size-20" style={site?.cutout ? { backgroundColor: "#eaf1f8" } : undefined}>
                              {photo && photo.startsWith("/") && site ? (
                                <Image src={photo} alt="" fill sizes="80px" className={site?.cutout ? "object-cover object-top" : "scale-[1.35] object-cover object-[50%_18%]"} />
                              ) : (
                                <span className="absolute inset-0 grid place-items-center font-display text-xl font-semibold text-sage-600">{initials}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-display text-[1.0625rem] leading-snug font-semibold text-ink">{site ? <Link href={`/team/${site.slug}/`} className="hover:text-brand-700">{m.name}</Link> : m.name}</h3>
                              <p className="mt-0.5 text-sm text-ink-soft">{site?.designation ?? m.role}</p>
                              <ul className="mt-3 flex flex-wrap gap-2">
                                {m.reasons.map((r) => (
                                  <li key={r} className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700"><Icon name="check" className="size-3" strokeWidth={2.4} /> {r}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <Link href={book} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-[0.9375rem] font-semibold text-white hover:bg-brand-700">Book with {m.name.replace(/^(Dr|Ms|Mr|Mrs)\.\s*/, "").split(" ")[0]} <Arrow /></Link>
                            {site && <Link href={`/team/${site.slug}/`} className="inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[0.9375rem] font-semibold text-brand-700 shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-brand-50">View profile</Link>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <a href={phone.href} className="inline-flex min-h-10 items-center gap-2 font-semibold text-ink underline decoration-line underline-offset-4 hover:text-brand-700"><Icon name="phone" className="size-4" /> Prefer to talk? {phone.display}</a>
                <OpenChatButton className="inline-flex min-h-10 items-center gap-2 font-semibold text-brand-700 hover:text-brand-900">Ask Tulasi</OpenChatButton>
                <button type="button" onClick={restart} className="min-h-10 font-semibold text-ink-soft underline decoration-line underline-offset-4 hover:text-ink">Start again</button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {!result && !error && !crisis && !residential && !loading && (
        <p className={clsx("mt-8 flex items-start gap-2 text-sm text-ink-soft")}>
          <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-sage-600" /> Private: we don’t ask for your name or contact details, and your answers aren’t stored. This is a guide, not a diagnosis.
        </p>
      )}
    </div>
  );
}
