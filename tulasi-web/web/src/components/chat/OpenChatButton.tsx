"use client";
// A button anywhere on the site that opens the Tulasi chat (FloatingActions listens for the event).
import type { ReactNode } from "react";
import TulasiMascot from "./TulasiMascot";

export function OpenChatButton({ children, className, mascot = true }: { children: ReactNode; className?: string; mascot?: boolean }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("thc:open-chat"))}>
      {mascot && <TulasiMascot mood="happy" className="size-6 shrink-0" />}
      {children}
    </button>
  );
}
