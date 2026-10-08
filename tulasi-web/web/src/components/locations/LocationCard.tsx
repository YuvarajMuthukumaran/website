"use client";
// A centre as a card that turns over. Front: where it is. Back: the address, directions and
// how to reach us. It turns on click, tap or Enter/Space (never on hover alone, so the links on
// the back can always be reached). The hidden face is `inert`, so keyboard and screen-reader
// users only meet the face they can see. Reduced motion: a quick cross-fade instead of a turn.
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Arrow, Icon } from "@/components/ui/primitives";
import type { Location } from "@/lib/locations";

export function LocationCard({ loc, tint, phone }: { loc: Location; tint: string; phone: { display: string; href: string } }) {
  const [flipped, setFlipped] = useState(false);
  const isHospital = loc.type === "hospital";
  const label = isHospital ? "Hospital" : "Clinic";

  return (
    <div id={loc.id} className={`lc-wrap${flipped ? " lc-flipped" : ""}`}>
      <div className="lc-card">
        {/* FRONT */}
        <div className="lc-face lc-front" style={{ backgroundColor: tint }} inert={flipped}>
          {loc.photo && <Image src={loc.photo} alt="" fill sizes="(min-width:1024px) 360px, (min-width:640px) 50vw, 100vw" className="lc-photo" />}
          <button type="button" className="lc-turn" onClick={() => setFlipped(true)} aria-label={`${loc.name}, ${loc.area}. Show address and directions`}>
            <span className="lc-badge">{label}</span>
            <span className="lc-title">{loc.title}</span>
            <span className="lc-area">{loc.area}</span>
            <span className="lc-hint">
              Address &amp; directions <Icon name="arrow" className="size-4" />
            </span>
          </button>
        </div>

        {/* BACK */}
        <div
          className="lc-face lc-back cursor-pointer"
          inert={!flipped}
          // a tap anywhere on the card turns it back, except on its Directions, Call and Book links
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("a")) setFlipped(false);
          }}
        >
          <p className="lc-back-label">{label}</p>
          <h3 className="lc-back-name">{loc.name}</h3>
          <address className="lc-address">
            <Icon name="pin" className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <span>{loc.address}</span>
          </address>
          <div className="lc-actions">
            <a href={loc.mapsUrl} target="_blank" rel="noopener noreferrer" className="lc-btn lc-btn-primary">
              <Icon name="pin" className="size-4" /> Directions
            </a>
            <a href={phone.href} className="lc-btn" aria-label={`Call ${phone.display}`}>
              <Icon name="phone" className="size-4" /> Call
            </a>
            <Link href={`/book-appointment/?from=${encodeURIComponent("/locations/")}`} className="lc-btn">
              Book <Arrow className="size-3.5" />
            </Link>
          </div>
          <button type="button" className="lc-back-btn" onClick={() => setFlipped(false)}>
            <Icon name="arrow" className="size-3.5 rotate-180" /> Turn back
          </button>
        </div>
      </div>
    </div>
  );
}
