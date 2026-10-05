"use client";
// Patient dashboard: upcoming and past appointments, cancel, sign out.
// Every request is authorised by the API from the httpOnly session cookie.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, cancelMyAppointment, fetchMe, logout, myAppointments, type Appointment } from "@/lib/api";
import { Icon } from "@/components/ui/primitives";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const pretty = (a: Appointment) => {
  const d = new Date(`${a.date}T${a.time}:00+05:30`);
  return `${d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })} · ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}`;
};

export function Portal() {
  const router = useRouter();
  const [user, setUser] = useState<{ phone: string } | null>(null);
  const [list, setList] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = () =>
    myAppointments()
      .then((r) => setList(r.appointments))
      .catch((e) => setError(e.message));

  useEffect(() => {
    fetchMe()
      .then((r) => {
        setUser(r.user);
        load();
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          document.cookie = "thc_signed_in=; path=/; max-age=0";
          router.replace("/patient-login/?next=/portal/");
        }
        else setError(e.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cancel(a: Appointment) {
    if (!confirm(`Cancel your appointment with ${a.doctorName} on ${pretty(a)}?`)) return;
    setCancelling(a._id);
    try {
      await cancelMyAppointment(a._id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCancelling(null);
    }
  }

  async function signOut() {
    await logout().catch(() => {});
    document.cookie = "thc_signed_in=; path=/; max-age=0";
    router.replace("/patient-login/");
  }

  const t = today();
  const upcoming = list?.filter((a) => a.status === "booked" && a.date >= t) ?? [];
  const past = list?.filter((a) => !(a.status === "booked" && a.date >= t)) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Patient portal</p>
          <h1 className="mt-2 font-display text-[length:var(--text-h2)] font-bold text-ink">My appointments</h1>
          {user && <p className="mt-1 text-sm text-ink-soft">Signed in as +91 {user.phone}</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/book-appointment/" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-600 px-5 font-semibold text-white hover:bg-accent-700"><Icon name="calendar" /> New booking</Link>
          <button type="button" onClick={signOut} className="min-h-12 rounded-full border border-line bg-white px-5 font-semibold text-ink hover:border-brand-300">Sign out</button>
        </div>
      </div>

      {error && <p role="alert" className="mt-6 rounded-2xl bg-accent-50 p-4 text-accent-700">{error}</p>}

      <section className="mt-10" aria-labelledby="up">
        <h2 id="up" className="font-display text-xl font-bold text-ink">Upcoming</h2>
        {!list ? (
          <div className="mt-4 space-y-3">{[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-[var(--radius-card)] bg-white" />)}</div>
        ) : upcoming.length ? (
          <ul className="mt-4 space-y-3">
            {upcoming.map((a) => (
              <li key={a._id} className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)] ring-1 ring-line">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon name="calendar" /></span>
                  <div>
                    <p className="font-semibold text-ink">{a.doctorName}</p>
                    <p className="text-sm text-ink-soft">{pretty(a)}</p>
                  </div>
                </div>
                <button type="button" onClick={() => cancel(a)} disabled={cancelling === a._id} className="min-h-11 rounded-full px-4 text-sm font-semibold text-accent-700 hover:bg-accent-50 disabled:opacity-50">
                  {cancelling === a._id ? "Cancelling…" : "Cancel"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-[var(--radius-card)] bg-white p-6 text-ink-soft ring-1 ring-line">No upcoming appointments. <Link href="/book-appointment/" className="font-semibold text-brand-700 underline">Book one</Link>.</p>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10" aria-labelledby="past">
          <h2 id="past" className="font-display text-xl font-bold text-ink">Past and cancelled</h2>
          <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] bg-white ring-1 ring-line">
            {past.map((a) => (
              <li key={a._id} className="flex flex-wrap items-center justify-between gap-2 p-5">
                <span><span className="font-semibold text-ink">{a.doctorName}</span> <span className="text-sm text-ink-soft">· {pretty(a)}</span></span>
                <span className={a.status === "cancelled" ? "text-sm font-semibold text-ink-soft" : "text-sm font-semibold text-emerald-700"}>{a.status === "cancelled" ? "Cancelled" : "Completed"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-10 text-sm text-ink-soft">To reschedule, cancel and book a new time, or call us. For medical records, please contact the hospital directly.</p>
    </div>
  );
}
