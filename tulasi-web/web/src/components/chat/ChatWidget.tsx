"use client";
// "Tulasi" chat assistant for the website. Loaded only when the chat bubble is
// first clicked (see FloatingActions). Talks to the Express API, which runs
// crisis detection first and calls Groq server-side; no key is in this code.
//
// Safety and privacy by design:
// - Before the first message: an "AI assistant, not a doctor" notice and a
//   DPDP consent line (what is processed, and what not to share).
// - Crisis replies are shown at once, highlighted, with one-tap call buttons.
// - The chat never collects names/phones/history: booking and records are
//   handed to the secure booking form and patient portal.
// - The conversation is kept only for this browser tab (sessionStorage).
import Link from "next/link";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, endChatSession, startChatSession, streamChat, type ChatEvent } from "@/lib/api";
import { Icon } from "@/components/ui/primitives";

type Msg = { id: string; role: "user" | "bot"; text: string; crisis?: boolean; error?: boolean; action?: "book" | "portal"; quickReplies?: string[]; doctors?: { name: string; role?: string }[] };
type Props = { onClose: () => void; phone: { display: string; href: string }; doctorSlugs?: Record<string, string> };

const STORE = "thc.chat.v1";
const STARTERS = ["I’ve been feeling anxious lately", "How do I know if I need a psychiatrist?", "What treatments do you offer for addiction?", "I want to book an appointment"];
const uid = () => Math.random().toString(36).slice(2);

/** Minimal, safe formatting: escape everything, then **bold**, line breaks and same-site links. */
function format(text: string) {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '<a href="$2" class="underline font-semibold">$1</a>')
    .replace(/\n/g, "<br/>");
}

export function ChatWidget({ onClose, phone, doctorSlugs = {} }: Props) {
  const [consented, setConsented] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const session = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  // Restore this tab's conversation.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
      if (saved?.consented) {
        setConsented(true);
        setMsgs(saved.msgs ?? []);
        session.current = saved.sessionId ?? null;
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (consented) sessionStorage.setItem(STORE, JSON.stringify({ consented, msgs: msgs.slice(-40), sessionId: session.current }));
    } catch {}
  }, [consented, msgs]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    (consented ? inputRef.current : dialog.current?.querySelector<HTMLElement>("[data-autofocus]"))?.focus();
  }, [consented]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ensureSession = useCallback(async (restore = false) => {
    if (session.current && !restore) return session.current;
    const history = restore ? msgs.filter((m) => !m.crisis).slice(-20).map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text })) : undefined;
    const { sessionId } = await startChatSession(history);
    session.current = sessionId;
    return sessionId;
  }, [msgs]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    const botId = uid();
    setMsgs((m) => [...m, { id: uid(), role: "user", text: message }, { id: botId, role: "bot", text: "" }]);
    const patch = (fn: (b: Msg) => Msg) => setMsgs((m) => m.map((x) => (x.id === botId ? fn(x) : x)));
    const onEvent = (e: ChatEvent) =>
      patch((b) => ({
        ...b,
        text: e.text ? b.text + e.text : b.text,
        crisis: b.crisis || e.crisis,
        error: b.error || e.error,
        action: e.action ?? b.action,
        quickReplies: e.quickReplies ?? b.quickReplies,
        doctors: e.doctors ?? b.doctors,
      }));
    abort.current = new AbortController();
    try {
      let id = await ensureSession();
      try {
        await streamChat(id, message, onEvent, abort.current.signal);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          id = await ensureSession(true); // server restarted: carry the conversation over
          await streamChat(id, message, onEvent, abort.current.signal);
        } else throw err;
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError")
        patch((b) => ({ ...b, error: true, text: b.text || (err instanceof ApiError && err.status !== 0 ? err.message : `I can’t connect right now. Please try again, or call us on ${phone.display}.`) }));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function newChat() {
    abort.current?.abort();
    if (session.current) endChatSession(session.current);
    session.current = null;
    setMsgs([]);
    try {
      sessionStorage.removeItem(STORE);
    } catch {}
    setConsented(true);
  }

  return (
    <motion.div
      ref={dialog}
      id="tulasi-chat"
      role="dialog"
      aria-modal="false"
      aria-label="Chat with Tulasi, Tulasi Healthcare’s AI assistant"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[65] flex flex-col bg-white sm:inset-auto sm:right-6 sm:bottom-28 sm:h-[min(640px,calc(100dvh-9rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-[1.75rem] sm:shadow-[var(--shadow-lift)] sm:ring-1 sm:ring-line"
     
    >
      {/* Header */}
      <div className="bg-hero on-dark flex items-center gap-3 px-5 py-4 text-white">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-white/15">
          <Icon name="heart" className="size-5" />
          <span className="absolute right-0 bottom-0 size-3 rounded-full bg-emerald-400 ring-2 ring-brand-900" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold leading-tight">Tulasi</p>
          <p className="text-xs text-brand-100">AI assistant · not a doctor</p>
        </div>
        {consented && msgs.length > 0 && (
          <button type="button" onClick={newChat} className="min-h-10 rounded-full px-3 text-xs font-semibold text-brand-100 hover:bg-white/10">New chat</button>
        )}
        <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full hover:bg-white/10">
          <Icon name="close" />
          <span className="sr-only">Close chat</span>
        </button>
      </div>

      {!consented ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <p className="font-display text-xl font-bold text-ink">Hi, I’m Tulasi.</p>
          <p className="mt-2 leading-relaxed text-ink-soft">I can answer questions about mental health, our services and our team, and help you find the right specialist.</p>
          <ul className="mt-5 space-y-3 text-sm text-ink-soft">
            <li className="flex gap-3"><Icon name="spark" className="mt-0.5 size-4 shrink-0 text-brand-600" /><span>I’m an AI assistant, <strong className="text-ink">not a doctor</strong>. I can’t diagnose or advise on medicines.</span></li>
            <li className="flex gap-3"><Icon name="shield" className="mt-0.5 size-4 shrink-0 text-brand-600" /><span>Please don’t share your name, phone number or medical history here. To book, use our secure booking form.</span></li>
            <li className="flex gap-3"><Icon name="heart" className="mt-0.5 size-4 shrink-0 text-accent-600" /><span>If you are in crisis, call <a href="tel:14416" className="font-semibold text-accent-700 underline">Tele-MANAS 14416</a> (free, 24×7) or <a href={phone.href} className="font-semibold text-accent-700 underline">{phone.display}</a>.</span></li>
          </ul>
          <p className="mt-5 rounded-2xl bg-mist p-4 text-xs leading-relaxed text-ink-soft">
            Consent (Digital Personal Data Protection Act, 2023): your messages are processed by our AI provider to generate replies and are not used to identify you. You can start a new chat at any time to clear this conversation. See our <Link href="/privacy-policy/" className="font-semibold text-brand-700 underline">Privacy Policy</Link>.
          </p>
          <button type="button" data-autofocus onClick={() => setConsented(true)} className="mt-auto min-h-12 w-full rounded-full bg-brand-600 font-semibold text-white hover:bg-brand-700 max-sm:mt-6">
            I understand. Start chat
          </button>
        </div>
      ) : (
        <>
          <div ref={list} className="flex-1 space-y-4 overflow-y-auto bg-mist/60 p-4" aria-live="polite" aria-relevant="additions">
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-ink-soft">How can I help you today?</p>
                {STARTERS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="block min-h-11 w-full rounded-2xl bg-white px-4 py-2.5 text-left text-sm text-ink ring-1 ring-line hover:ring-brand-300">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-3xl rounded-br-md bg-brand-600 px-4 py-2.5 text-[0.9375rem] text-white"
                      : m.crisis
                        ? "max-w-[92%] rounded-3xl rounded-bl-md border-2 border-accent-600 bg-accent-50 px-4 py-3 text-[0.9375rem] text-ink"
                        : "max-w-[88%] rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-[0.9375rem] text-ink shadow-[var(--shadow-soft)]"
                  }
                >
                  {m.role === "bot" && !m.text ? (
                    <span className="flex gap-1 py-1.5" aria-label="Tulasi is typing">
                      {[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-brand-300" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </span>
                  ) : (
                    <p className="leading-relaxed [&_a]:text-brand-700" dangerouslySetInnerHTML={{ __html: format(m.text) }} />
                  )}
                  {m.crisis && (
                    <div className="mt-3 grid gap-2">
                      <a href="tel:14416" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold text-white"><Icon name="phone" className="size-4" /> Call Tele-MANAS 14416</a>
                      <a href={phone.href} className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent-600 font-semibold text-accent-700"><Icon name="phone" className="size-4" /> Call Tulasi Healthcare</a>
                    </div>
                  )}
                  {m.action === "book" && <Link href="/book-appointment/" onClick={onClose} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold text-white"><Icon name="calendar" className="size-4" /> Book Appointment</Link>}
                  {m.action === "portal" && <Link href="/patient-login/" onClick={onClose} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white"><Icon name="user" className="size-4" /> Patient portal</Link>}
                  {m.doctors && m.doctors.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {m.doctors.map((d) => {
                        const slug = doctorSlugs[d.name];
                        return (
                          <li key={d.name} className="flex items-center justify-between gap-2 rounded-2xl bg-brand-50 px-3 py-2">
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">{d.name}</span>
                              {d.role && <span className="block truncate text-xs text-ink-soft">{d.role}</span>}
                            </span>
                            <Link href={slug ? `/book-appointment/?doctor=${slug}` : "/book-appointment/"} onClick={onClose} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">Book</Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {m.quickReplies && m.quickReplies.length > 0 && m.id === msgs.at(-1)?.id && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.quickReplies.slice(0, 6).map((q) => (
                        <button key={q} type="button" onClick={() => send(q)} className="min-h-9 rounded-full bg-brand-50 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100">{q}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <form
            className="border-t border-line bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">Message</label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Type your message…"
                className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl bg-mist px-4 py-3 text-[0.9375rem] text-ink placeholder:text-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
              <button type="submit" disabled={busy || !input.trim()} className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40">
                <Icon name="arrow" />
                <span className="sr-only">Send</span>
              </button>
            </div>
            <p className="mt-2 px-2 text-center text-[0.6875rem] text-ink-soft">
              AI assistant, not a doctor. In crisis? Call <a href="tel:14416" className="font-semibold underline">14416</a>.
            </p>
          </form>
        </>
      )}
    </motion.div>
  );
}
