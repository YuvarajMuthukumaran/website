"use client";
// LocationsClient – filter tabs + card grid.
// "All / Hospitals / Clinics" tabs filter the cards with a smooth layout animation.

import { useState } from "react";
import { LocationCard } from "./LocationCard";
import type { Location } from "@/lib/locations";

type Filter = "all" | "hospital" | "clinic";

export function LocationsClient({ locations }: { locations: Location[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = locations.filter((l) => filter === "all" || l.type === filter);
  const hospitals = locations.filter((l) => l.type === "hospital").length;
  const clinics   = locations.filter((l) => l.type === "clinic").length;

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all",      label: "All",      count: locations.length },
    { key: "hospital", label: "Hospitals", count: hospitals },
    { key: "clinic",   label: "Clinics",   count: clinics },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div className="loc-tabs" role="tablist" aria-label="Filter locations">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={filter === t.key}
            className={`loc-tab${filter === t.key ? " loc-tab-active" : ""}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
            <span className="loc-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Card grid */}
      <ul className="loc-grid" aria-live="polite" aria-label="Location cards">
        {visible.map((loc, i) => (
          <li key={loc.id}>
            <LocationCard loc={loc} index={i} />
          </li>
        ))}
      </ul>
    </div>
  );
}
