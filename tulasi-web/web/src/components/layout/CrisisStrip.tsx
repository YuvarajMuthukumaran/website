// Persistent crisis help on every page, above the header. Plain HTML: it must
// work with JS off and be the first thing a screen reader reaches after the skip link.
// A soft rose strip: red is reserved for emergencies, and this is the emergency.
// Phones get a compact single row; the full sentence shows from tablet width up.
import { Icon } from "@/components/ui/primitives";

export function CrisisStrip({ phone }: { phone: { display: string; href: string } }) {
  const pill = "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white px-3 font-semibold text-alert-700 shadow-[inset_0_0_0_1px_var(--color-alert-100)] transition-colors hover:bg-alert-100";
  return (
    <aside aria-label="Contact our care team" className="relative z-40 border-b border-alert-100 bg-alert-50 text-ink">
      <div className="container-page flex min-h-10 items-center justify-between gap-3 py-1.5 text-[0.8125rem] leading-snug">
        <p className="flex min-w-0 items-center gap-2">
          <Icon name="heart" className="size-4 shrink-0 text-alert-600" />
          <span className="sm:hidden"><strong className="font-semibold">Need support?</strong> Call</span>
          <span className="hidden sm:inline">
            <strong className="font-semibold">Need to talk to someone?</strong> <span className="hidden lg:inline text-ink-soft">Call our care team and we will help you find the right doctor or counsellor.</span>
          </span>
        </p>
        <p className="flex shrink-0 items-center gap-2">
          <a href={phone.href} className={pill}>
            <Icon name="phone" className="size-3.5" /> <span className="sm:hidden">Call us</span><span className="hidden sm:inline">Call Tulasi Healthcare {phone.display}</span>
          </a>
        </p>
      </div>
    </aside>
  );
}
