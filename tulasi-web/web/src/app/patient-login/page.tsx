// /patient-login/ (new, noindex): phone + one-time code.
import type { Metadata } from "next";
import { LoginForm } from "@/components/portal/LoginForm";

export const metadata: Metadata = { title: { absolute: "Patient Login - Tulasi Healthcare" }, robots: { index: false, follow: false } };

export default function PatientLogin() {
  return (
    <section className="relative isolate overflow-clip bg-hero py-16 on-dark lg:py-24">
      <div aria-hidden="true" className="orb pointer-events-none absolute hidden md:block -top-24 -right-24 size-96 rounded-full bg-brand-300/25 blur-3xl" />
      <div className="container-page relative grid items-center gap-12 lg:grid-cols-2">
        <div className="text-white">
          <p className="eyebrow !text-brand-200">Patient portal</p>
          <h1 className="mt-3 text-[length:var(--text-h1)] font-extrabold leading-tight">Sign in to see your appointments</h1>
          <p className="mt-4 max-w-md text-[length:var(--text-lead)] text-brand-100">Use the mobile number you booked with. We’ll text you a 6-digit code. No password needed.</p>
        </div>
        <LoginForm />
      </div>
    </section>
  );
}
