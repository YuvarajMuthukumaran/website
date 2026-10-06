// /patient-login/ (new, noindex): phone + one-time code.
import type { Metadata } from "next";
import { LoginForm } from "@/components/portal/LoginForm";

export const metadata: Metadata = { title: { absolute: "Patient Login - Tulasi Healthcare" }, robots: { index: false, follow: false } };

export default function PatientLogin() {
  return (
    <section className="bg-gradient-to-b from-mist to-white py-12 lg:py-20">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow">Patient portal</p>
          <h1 className="mt-3 text-[length:var(--text-h1)] leading-[1.12] font-semibold tracking-[-0.025em] text-ink">Sign in to see your appointments</h1>
          <p className="mt-4 max-w-md text-[length:var(--text-lead)] leading-relaxed text-ink-soft">Use the mobile number you booked with. We’ll text you a 6-digit code. No password needed.</p>
        </div>
        <LoginForm />
      </div>
    </section>
  );
}
