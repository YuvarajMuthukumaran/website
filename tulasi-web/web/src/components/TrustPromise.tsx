// "You are welcome here": the warm, plain-spoken promises that answer a patient's quiet worries (will I be
// judged, will my story stay private, will I be rushed, what will it cost, can my family come). Written in
// everyday words and in the first person plural, so it reads like a person, not a brochure. Management
// should confirm each line matches how the clinic really works before it goes live.
import Link from "next/link";
import { BrandIcon, Icon } from "@/components/ui/primitives";

type Promise = { icon: "heart" | "shield" | "check" | "phone" | "breath" | "family"; title: string; text: string; tint: string };

const PROMISES: Promise[] = [
  { icon: "heart", title: "Come as you are", text: "There is no right way to arrive. Whatever you are feeling, you will be met with kindness, never judgement.", tint: "#f9dedf" },
  { icon: "shield", title: "Your story stays yours", text: "What you share is kept private. You decide who else knows, and when.", tint: "#d6e8f7" },
  { icon: "breath", title: "At your own pace", text: "We explain every option in plain words. Nothing is rushed, and a hospital stay is suggested only if it truly helps.", tint: "#d9efdd" },
  { icon: "check", title: "Clear and fair costs", text: "Fees are shown on each doctor’s profile, so you always know what to expect before you decide.", tint: "#fbf0c6" },
  { icon: "family", title: "Your family is welcome too", text: "Loved ones can join sessions and find support of their own, whenever you are comfortable.", tint: "#e4ddf6" },
  { icon: "phone", title: "Someone to talk to", text: "Not ready to book? Call and simply talk. There is no pressure and no obligation.", tint: "#fbe3d2" },
];

export function TrustPromise({ phone }: { phone: { display: string; href: string } }) {
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute -top-10 -left-16 size-72 rounded-full bg-[#f9dedf] opacity-50 blur-3xl" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-0 size-72 rounded-full bg-[#d9efdd] opacity-60 blur-3xl" />
      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14">
        <div>
          <p className="eyebrow">Our promise to you</p>
          <h2 className="mt-3 max-w-[14ch] text-[length:var(--text-display)] leading-[1.08] font-semibold tracking-[-0.025em] text-ink">You are welcome here</h2>
          <p className="mt-5 max-w-[46ch] text-[length:var(--text-lead)] leading-relaxed text-ink-soft">Reaching out is the hardest step, and by being here you have already taken it. Whatever you or someone you love is going through, you will be met with warmth and respect. We are here to help you heal, at your own pace.</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[0.9375rem]">
            <a href={phone.href} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 font-semibold text-ink shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors hover:bg-brand-50"><Icon name="phone" className="size-4 text-sage-600" /> Talk to us: {phone.display}</a>
            <Link href="/mission-vision/" className="font-semibold text-brand-700 hover:text-brand-900">Our mission and values →</Link>
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {PROMISES.map((p) => (
            <li key={p.title} className="group flex gap-4 rounded-[1.25rem] bg-white/90 p-5 shadow-[0_0_0_1px_var(--color-line)] backdrop-blur-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_var(--color-sage-200),0_22px_40px_-26px_rgb(23_34_44/0.45)]">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-ink/80 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" style={{ backgroundColor: p.tint }}>
                {p.icon === "breath" || p.icon === "family" ? <BrandIcon name={p.icon} className="size-6" /> : <Icon name={p.icon} className="size-6" />}
              </span>
              <span>
                <span className="block font-display text-[1.0625rem] leading-snug font-semibold text-ink">{p.title}</span>
                <span className="mt-1.5 block text-[0.9375rem] leading-relaxed text-ink-soft">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
