// /portal/ (new, noindex): the signed-in patient's appointments.
import type { Metadata } from "next";
import { Portal } from "@/components/portal/Portal";

export const metadata: Metadata = { title: { absolute: "My Appointments - Tulasi Healthcare" }, robots: { index: false, follow: false } };

export default function PortalPage() {
  return (
    <div className="grid-light bg-mist pt-32 pb-16 lg:pt-40 lg:pb-24">
      <div className="container-page max-w-4xl">
        <Portal />
      </div>
    </div>
  );
}
