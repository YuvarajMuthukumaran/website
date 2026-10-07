"use client";
// Locations: filter chips (All / Hospitals / Clinics) over a grid of turning cards.
import clsx from "clsx";
import { useState } from "react";
import { LocationCard } from "./LocationCard";
import type { Location } from "@/lib/locations";

type Filter = "all" | "hospital" | "clinic";

export function LocationsClient({ locations, tints, phone, filters = true }: { locations: Location[]; tints: string[]; phone: { display: string; href: string }; filters?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = locations.filter((l) => filter === "all" || l.type === filter);
  const count = (t: Filter) => locations.filter((l) => t === "all" || l.type === t).length;
  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "hospital", label: "Hospitals" },
    { key: "clinic", label: "Clinics" },
  ];

  return (
    <div>
      {filters && (
        <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter locations">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={filter === t.key}
              onClick={() => setFilter(t.key)}
              className={clsx(
                "inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                filter === t.key ? "bg-brand-600 text-white" : "bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:text-brand-700"
              )}
            >
              {t.label} <span className="text-xs opacity-70">{count(t.key)}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="lc-grid" aria-live="polite">
        {visible.map((loc) => (
          <li key={loc.id}>
            <LocationCard loc={loc} tint={tints[locations.indexOf(loc) % tints.length]} phone={phone} />
          </li>
        ))}
      </ul>
    </div>
  );
}
