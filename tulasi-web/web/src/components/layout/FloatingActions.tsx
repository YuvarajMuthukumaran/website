"use client";
// Floating "Book Appointment" + chat bubble. The chat widget's code is only
// downloaded on the first click, so it costs nothing on page load (LCP/INP).
//
// On every page load the Tulasi leaf mascot slides out from behind the chat
// bubble and says "Click here to have a chat", then tucks back in after a few
// seconds. Hovering the bubble brings it out again.
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import TulasiMascot from "@/components/chat/TulasiMascot";
import { Icon } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";

type Phone = { display: string; href: string };
type WidgetProps = { onClose: () => void; phone: Phone; doctorSlugs: Record<string, string>; doctorPhotos: Record<string, string> };

const PEEK_DELAY_MS = 1600; // after load
const PEEK_STAY_MS = 9000;

export function FloatingActions({ phone, doctorSlugs, doctorPhotos }: { phone: Phone; doctorSlugs: Record<string, string>; doctorPhotos: Record<string, string> }) {
  const reduce = useReducedMotion();
  const [Widget, setWidget] = useState<ComponentType<WidgetProps> | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [peek, setPeek] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pathname = usePathname();
  const onBookingPage = pathname?.startsWith("/book-appointment");

  const showMascot = (stayMs: number) => {
    clearTimeout(hideTimer.current);
    setPeek(true);
    hideTimer.current = setTimeout(() => setPeek(false), stayMs);
  };

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    // Other components (hero, doctor cards) can open the chat.
    const openChat = () => launch();
    window.addEventListener("thc:open-chat", openChat);
    // The mascot comes out shortly after the page loads (or is refreshed).
    const first = setTimeout(() => showMascot(PEEK_STAY_MS), PEEK_DELAY_MS);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("thc:open-chat", openChat);
      clearTimeout(first);
      clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function launch() {
    clearTimeout(hideTimer.current);
    setPeek(false);
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

        <div className="relative">
          {/* The mascot sits BEHIND the bubble (z-0 vs z-10) so it appears to come out of it. */}
          <AnimatePresence>
            {peek && !open && (
              <motion.div
                key="mascot-peek"
                className="absolute right-9 bottom-1 z-0 flex items-end"
                initial={reduce ? { opacity: 0 } : { x: 54, opacity: 0, scale: 0.5, rotate: 14 }}
                animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
                exit={reduce ? { opacity: 0 } : { x: 54, opacity: 0, scale: 0.5, rotate: 14, transition: { duration: 0.35, ease: "easeIn" } }}
                transition={{ type: "spring", stiffness: 230, damping: 15 }}
              >
                <motion.button
                  type="button"
                  onClick={launch}
                  initial={reduce ? false : { opacity: 0, scale: 0.6, x: 14 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: reduce ? 0 : 0.45, type: "spring", stiffness: 300, damping: 20 }}
                  style={{ transformOrigin: "right center" }}
                  className="relative mr-2 mb-6 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-brand-800 shadow-[0_14px_34px_-14px_rgb(3_11_58/0.55)] ring-1 ring-brand-100 hover:bg-brand-50"
                >
                  Click here to have a chat
                  <span aria-hidden="true" className="absolute top-1/2 -right-1 size-2.5 -translate-y-1/2 rotate-45 rounded-[2px] bg-white" />
                </motion.button>
                <motion.div
                  aria-hidden="true"
                  onClick={launch}
                  className="size-[4.5rem] cursor-pointer drop-shadow-[0_10px_14px_rgb(3_11_58/0.28)]"
                  animate={reduce ? undefined : { rotate: [0, -9, 8, -6, 4, 0] }}
                  transition={{ delay: 0.9, duration: 1.1, ease: "easeInOut" }}
                  style={{ transformOrigin: "50% 90%" }}
                >
                  <TulasiMascot mood="happy" className="size-full" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => (open ? setOpen(false) : launch())}
            onMouseEnter={() => !open && !peek && showMascot(5000)}
            onFocus={() => !open && !peek && showMascot(5000)}
            aria-expanded={open}
            aria-controls="tulasi-chat"
            className="group relative z-10 grid size-14 place-items-center rounded-full bg-midnight text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),inset_0_1px_0_rgb(255_255_255/0.18),0_16px_40px_-12px_rgb(10_47_181/0.8)] transition duration-[450ms] hover:-translate-y-0.5"
          >
            <span aria-hidden="true" className="absolute -inset-1 rounded-full bg-brand-500/25 blur-md motion-safe:animate-[breathe_5s_ease-in-out_infinite]" />
            <Icon name={open ? "close" : "chat"} className="relative size-6" />
            <span className="sr-only">{open ? "Close chat" : "Chat with Tulasi, our AI assistant"}</span>
            {loading && <span className="absolute -top-1 -right-1 size-4 animate-ping rounded-full bg-accent-600" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open && Widget && <Widget onClose={() => setOpen(false)} phone={phone} doctorSlugs={doctorSlugs} doctorPhotos={doctorPhotos} />}
    </>
  );
}
