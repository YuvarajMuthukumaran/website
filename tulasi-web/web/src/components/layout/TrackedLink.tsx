"use client";
// A plain <a> that also reports a conversion event (calls, WhatsApp, downloads).
import type { ComponentProps } from "react";
import { track, type TrackEvent } from "@/lib/analytics";

export function TrackedLink({ event, eventLocation, onClick, ...rest }: ComponentProps<"a"> & { event: TrackEvent; eventLocation: string }) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        track(event, { location: eventLocation });
        onClick?.(e);
      }}
    />
  );
}
