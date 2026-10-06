// DoctorMarquee – server component.
// Two-row auto-scrolling portrait marquee for "Meet our doctors" on the homepage.
// Row 1 scrolls left, row 2 scrolls right at a slightly different speed.
// All cards are in SSR HTML; the duplicate track is aria-hidden for a11y.
import "server-only";
import Link from "next/link";
import Image from "next/image";
import { getDoctors } from "@/lib/content";
import { portraitOf, PASTELS } from "@/components/team";
import { MarqueePause } from "@/components/MarqueePause";
import type { Doctor } from "@/lib/content";

// Short designation: strip "with over X years" suffix and "(RCI)" badge
const shortDesignation = (d: Doctor) =>
  (d.designation ?? "")
    .replace(/\s*with over .*$/i, "")
    .replace(/\s*\((RCI|A)\)/, "")
    .trim();

// Initials from doctor name (strips honorific prefix)
const initials = (name: string) => {
  const parts = name.replace(/^(Dr\.|Ms\.|Mr\.|Mrs\.)\s*/i, "").split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

function MarqueeCard({
  d,
  index,
  priority = false,
  tabbable = true,
}: {
  d: Doctor;
  index: number;
  priority?: boolean;
  tabbable?: boolean;
}) {
  const portrait = portraitOf(d);
  const bg = PASTELS[index % PASTELS.length];

  return (
    <Link
      href={`/team/${d.slug}/`}
      aria-label={`${d.name} – ${shortDesignation(d)}`}
      tabIndex={tabbable ? undefined : -1}
      aria-hidden={tabbable ? undefined : true}
      className="marquee-card group"
      style={{ backgroundColor: bg }}
    >
      {/* Photo or initials placeholder */}
      {portrait ? (
        <Image
          src={portrait.src}
          alt=""
          fill
          priority={priority}
          sizes="(max-width:640px) 150px, 190px"
          className={`marquee-photo${portrait.cutout ? " portrait-fade" : ""}`}
        />
      ) : (
        <span className="marquee-initials" aria-hidden="true">
          {initials(d.name)}
        </span>
      )}

      {/* Bottom gradient overlay + name / designation */}
      <span className="marquee-overlay" aria-hidden="true" />
      <span className="marquee-info">
        <span className="marquee-name">{d.name}</span>
        <span className="marquee-role">{shortDesignation(d)}</span>
      </span>
    </Link>
  );
}

function MarqueeRow({
  doctors,
  direction,
  duration,
  offset = false,
}: {
  doctors: Doctor[];
  direction: "left" | "right";
  duration: number;
  offset?: boolean;
}) {
  return (
    <div className="marquee-row-wrap">
      {/* The pauseable track lives inside MarqueePause (client) */}
      <MarqueePause
        className={`marquee-track-outer${offset ? " marquee-offset" : ""}`}
        data-dir={direction}
      >
        {/* Primary pass – visible to crawlers / screen readers */}
        <div
          className={`marquee-track marquee-${direction}`}
          style={{ "--marquee-dur": `${duration}s` } as React.CSSProperties}
        >
          {doctors.map((d, i) => (
            <MarqueeCard key={d.slug} d={d} index={i} priority={i < 4 && direction === "left"} />
          ))}
          {/* Duplicate for seamless loop – aria-hidden */}
          <div aria-hidden="true" className="marquee-dupe">
            {doctors.map((d, i) => (
              <MarqueeCard key={`${d.slug}-dup`} d={d} index={i} tabbable={false} />
            ))}
          </div>
        </div>
      </MarqueePause>
    </div>
  );
}

export function DoctorMarquee() {
  const doctors = getDoctors();

  // Split into two rows: odd/even so they feel independent
  const row1 = doctors.filter((_, i) => i % 2 === 0);
  const row2 = doctors.filter((_, i) => i % 2 !== 0);

  return (
    <div className="marquee-section" aria-label="Scrolling doctor portraits">
      <MarqueeRow doctors={row1} direction="left"  duration={60} />
      <MarqueeRow doctors={row2} direction="right" duration={75} offset />
    </div>
  );
}
