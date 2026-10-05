// Product-style mockups of booking, a doctor profile and the patient portal,
// built as real HTML (not images). The doctor card uses that doctor's
// published facts; times and appointments are clearly marked as samples.
import Image from "next/image";
import clsx from "clsx";
import type { Doctor } from "@/lib/content";

type Facts = { experience: string | null; expertise: string[]; fee: string | null; opd: string[] | null; onlineOpd: string | null } | null;

export function Mockups({ doctor, facts, portrait }: { doctor: Doctor; facts: Facts; portrait: { src: string; cutout: boolean } | null }) {
  return (
    <div aria-hidden="true" className="relative mx-auto grid max-w-[1100px] items-start gap-6 [perspective:1800px] md:grid-cols-3">
      {/* 1 · booking */}
      <div className="mock-card md:mt-16 md:[transform:rotateX(10deg)_rotateY(14deg)]">
        <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">Book · step 3 of 4</p>
        <div className="mt-3 flex gap-1.5">
          {[1, 1, 1, 0].map((on, i) => (
            <span key={i} className={clsx("h-1 flex-1 rounded-full", on ? "bg-brand-600" : "bg-brand-100")} />
          ))}
        </div>
        <p className="mt-5 font-display text-lg font-bold tracking-[-0.02em] text-ink">Pick a time</p>
        <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
          {[["Mon", 12], ["Tue", 13], ["Wed", 14], ["Thu", 15], ["Fri", 16]].map(([d, n], i) => (
            <span key={d} className={clsx("rounded-[10px] py-2 text-[0.65rem] leading-tight", i === 1 ? "bg-brand-900 text-brand-200" : "text-ink-soft shadow-[inset_0_0_0_1px_var(--color-line)]")}>
              {d}
              <b className={clsx("block font-display text-sm", i === 1 ? "text-white" : "text-ink")}>{n}</b>
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs font-semibold">
          {["1:00", "1:30", "2:00", "2:30", "3:00", "3:30"].map((t, i) => (
            <span key={t} className={clsx("rounded-[10px] py-2.5", i === 2 ? "bg-brand-600 text-white" : "text-ink shadow-[inset_0_0_0_1px_var(--color-line)]")}>{t} PM</span>
          ))}
        </div>
        <span className="mt-5 flex min-h-10 items-center justify-center rounded-full bg-accent-600 text-xs font-semibold text-white">Continue</span>
        <p className="mt-3 text-[0.65rem] text-ink-soft">Sample times for illustration.</p>
      </div>

      {/* 2 · doctor profile (published facts) */}
      <div className="mock-card md:[transform:rotateX(8deg)_translateY(-8px)]">
        <div className="flex items-center gap-3">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-[14px] bg-gradient-to-b from-brand-50 to-brand-100">
            {portrait && <Image src={portrait.src} alt="" fill sizes="56px" className={portrait.cutout ? "object-cover object-top" : "object-cover object-[50%_25%]"} />}
          </span>
          <span>
            <b className="block font-display text-[1.02rem] leading-tight tracking-[-0.02em] text-ink">{doctor.name}</b>
            <span className="text-xs text-ink-soft">{doctor.designation}</span>
          </span>
        </div>
        {facts && facts.expertise.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {facts.expertise.slice(0, 3).map((e) => (
              <span key={e} className="rounded-full bg-brand-50 px-2.5 py-1 text-[0.68rem] font-medium text-brand-900 shadow-[inset_0_0_0_1px_var(--color-brand-100)]">{e}</span>
            ))}
          </div>
        )}
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
          {facts?.experience && (<><dt className="text-ink-soft">Experience</dt><dd className="font-semibold text-ink">{facts.experience}</dd></>)}
          {facts?.opd && (<><dt className="text-ink-soft">OPD</dt><dd className="font-semibold text-ink">{facts.opd.join(", ")}</dd></>)}
          {facts?.onlineOpd && (<><dt className="text-ink-soft">Online</dt><dd className="font-semibold text-ink">{facts.onlineOpd}</dd></>)}
        </dl>
        <span className="mt-5 flex min-h-10 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">Book with {doctor.name}</span>
      </div>

      {/* 3 · patient portal */}
      <div className="mock-card md:mt-24 md:[transform:rotateX(10deg)_rotateY(-14deg)]">
        <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-ink-soft uppercase">My appointments</p>
        {[["OCT", 13, doctor.name, "Tuesday · 2:00 PM"], ["NOV", 4, "Ms. Kiran Singh", "Wednesday · 5:00 PM"]].map(([m, d, who, when]) => (
          <div key={String(d)} className="mt-3 flex items-center gap-3 rounded-[14px] p-3 shadow-[inset_0_0_0_1px_var(--color-line)]">
            <span className="w-11 rounded-[10px] bg-brand-50 py-1.5 text-center font-display text-base leading-tight font-bold text-brand-900">
              <small className="block text-[0.58rem] tracking-[0.08em] text-brand-600">{m}</small>
              {d}
            </span>
            <span className="text-xs leading-snug">
              <b className="block font-display text-[0.82rem] text-ink">{who}</b>
              <span className="text-ink-soft">{when}</span>
            </span>
          </div>
        ))}
        <div className="mt-4 flex items-center gap-2 rounded-[12px] bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-800">
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
          Confirmation sent by SMS
        </div>
        <p className="mt-3 text-[0.65rem] text-ink-soft">Sample appointments for illustration.</p>
      </div>
    </div>
  );
}
