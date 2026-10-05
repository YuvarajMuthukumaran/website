// Soft fade between routes, in CSS only. The class has no effect on the
// server HTML or the first page load: MotionProvider marks the first page as
// static and only then enables the transition, so it plays on client-side
// navigations only. No JS animation state means no hydration mismatches and
// nothing that can leave content hidden. prefers-reduced-motion disables it.
import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
