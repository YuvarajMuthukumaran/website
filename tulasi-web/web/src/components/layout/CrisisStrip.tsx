// Persistent crisis help on every page, above the header. Plain HTML: it must
// work with JS off and be the first thing a screen reader reaches after the skip link.
// Phones get a compact single row; the full sentence shows from tablet width up.
import { Icon } from "@/components/ui/primitives";

export function CrisisStrip({ phone }: { phone: { display: string; href: string } }) {
  return (
    <aside aria-label="Crisis help" className="relative z-40 border-b border-white/[0.06] bg-midnight text-white">
      <div className="container-page flex min-h-10 items-center justify-between gap-3 py-1.5 text-[0.8125rem] leading-snug">
        <p className="flex min-w-0 items-center gap-2">
          <Icon name="heart" className="size-4 shrink-0 text-accent-50" />
          <span className="sm:hidden"><strong className="font-semibold">In crisis?</strong> Help is here.</span>
          <span className="hidden sm:inline">
            <strong className="font-semibold">In crisis or thinking of harming yourself?</strong> <span className="hidden lg:inline">You are not alone. Help is available right now.</span>
          </span>
        </p>
        <p className="flex shrink-0 items-center gap-2">
          <a href="tel:14416" className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-white/[0.06] px-3 font-semibold shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] hover:bg-white/[0.12]" aria-label="Call Tele-MANAS on 14416, free, 24 hours a day">
            <Icon name="phone" className="size-3.5" /> 14416<span className="hidden font-normal text-brand-100 md:inline">&nbsp;Tele-MANAS (free, 24×7)</span>
          </a>
          <a href={phone.href} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-accent-600 px-3 font-semibold hover:bg-accent-700" aria-label={`Call Tulasi Healthcare on ${phone.display}`}>
            <Icon name="phone" className="size-3.5" /> <span className="sm:hidden">Tulasi</span><span className="hidden sm:inline">Tulasi Healthcare {phone.display}</span>
          </a>
        </p>
      </div>
    </aside>
  );
}
