"use client";
// Floating "Book Appointment" + chat bubble. The chat widget's code is only
// downloaded on the first click, so it costs nothing on page load (LCP/INP).
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { Icon } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";

type WidgetProps = { onClose: () => void; phone: { display: string; href: string }; doctorSlugs: Record<string, string> };

export function FloatingActions({ phone, doctorSlugs }: { phone: { display: string; href: string }; doctorSlugs: Record<string, string> }) {
  const [Widget, setWidget] = useState<ComponentType<WidgetProps> | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const onBookingPage = pathname?.startsWith("/book-appointment");

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Other components (hero, doctor cards) can open the chat.
    const openChat = () => launch();
    window.addEventListener("thc:open-chat", openChat);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("thc:open-chat", openChat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function launch() {
    setOpen(true);
    track("chat_open", { location: "floating" });
    if (Widget) return;
    setLoading(true);
    const mod = await import("@/components/chat/ChatWidget");
    setWidget(() => mod.ChatWidget);
    setLoading(false);
  }

  return (
    <>
      <div className="fixed right-4 bottom-4 z-[55] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
        {!onBookingPage && (
          <Link
            href="/book-appointment/"
            className={clsx(
              "inline-flex min-h-12 items-center gap-2 rounded-full bg-accent-600 px-5 font-semibold text-white shadow-[0_16px_40px_-14px_rgb(215_20_31/0.8)] transition-all duration-500 ease-[var(--ease-calm)] hover:bg-accent-700",
              visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
            )}
            tabIndex={visible ? 0 : -1}
            aria-hidden={!visible}
          >
            <Icon name="calendar" /> <span className="hidden sm:inline">Book Appointment</span>
            <span className="sm:hidden">Book</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : launch())}
          aria-expanded={open}
          aria-controls="tulasi-chat"
          className="group relative grid size-16 place-items-center rounded-full bg-brand-600 text-white shadow-[var(--shadow-glow)] transition hover:bg-brand-700 hover:scale-105"
        >
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500/40 motion-safe:animate-[breathe_4s_ease-in-out_infinite]" />
          <Icon name={open ? "close" : "chat"} className="relative size-7" />
          <span className="sr-only">{open ? "Close chat" : "Chat with Tulasi, our AI assistant"}</span>
          {loading && <span className="absolute -top-1 -right-1 size-4 animate-ping rounded-full bg-accent-600" aria-hidden="true" />}
        </button>
      </div>
      {open && Widget && <Widget onClose={() => setOpen(false)} phone={phone} doctorSlugs={doctorSlugs} />}
    </>
  );
}
