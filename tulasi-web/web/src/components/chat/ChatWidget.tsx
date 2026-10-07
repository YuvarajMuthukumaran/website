"use client";
// "Tulasi" chat assistant for the website, migrated from the standalone chatbot
// app (leaf mascot, moods, doctor mode, markdown replies, paced typing, retry).
// Loaded only when the chat bubble is first clicked (see FloatingActions).
// Talks to the Express API, which runs crisis detection first and calls Groq
// server-side; no key is in this code.
//
// Safety and privacy by design:
// - Before the first message: an "AI assistant, not a doctor" notice and a
//   DPDP consent line (what is processed, and what not to share).
// - Crisis replies are shown at once, highlighted, with one-tap call buttons.
// - The chat never collects names/phones/history: booking and records are
//   handed to the secure booking form and patient portal.
// - The conversation is kept only for this browser tab (sessionStorage).
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { ApiError, endChatSession, startChatSession, streamChat, type ChatEvent } from "@/lib/api";
import { detectMood, type Mood } from "@/lib/mood";
import { normalizeMarkdown, plainText } from "@/lib/markdown";
import { Icon } from "@/components/ui/primitives";
import TulasiMascot from "./TulasiMascot";

type Msg = { id: string; role: "user" | "bot"; text: string; crisis?: boolean; error?: boolean; action?: "book" | "portal"; quickReplies?: string[]; doctors?: { name: string; role?: string; photo?: string | null }[] };
type Props = { onClose: () => void; phone: { display: string; href: string }; doctorSlugs?: Record<string, string>; doctorPhotos?: Record<string, string> };

const STORE = "thc.chat.v1";
const MAX_MESSAGE_CHARS = 2000; // same limit as the server (routes/chat.js)
const greeting = (phone: string) => `Hi, I’m Tulasi, a supportive companion from Tulasi Healthcare. I’m here to listen and share some gentle tools, but I’m not a therapist or doctor and this isn’t an emergency service. If you’re ever in immediate danger, please call us on **${phone}**. What’s on your mind today?`;
const STARTERS = ["I’ve been feeling anxious lately", "I just need someone to talk to", "How do I know if I need a psychiatrist?", "I want to book an appointment"];
const uid = () => Math.random().toString(36).slice(2);

/** The mood the conversation was last in, for restoring the mascot after a reload. */
function moodFrom(msgs: Msg[]): Mood {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role !== "user") continue;
    const m = detectMood(msgs[i].text);
    if (m) return m;
  }
  return "neutral";
}

export function ChatWidget({ onClose, phone, doctorSlugs = {}, doctorPhotos = {} }: Props) {
  const [consented, setConsented] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState<Mood>("neutral");
  const [failedText, setFailedText] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [waking, setWaking] = useState(false);
  const session = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  // Restore this tab's conversation (must run after hydration, so it is an effect).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
      if (saved?.consented) {
        setConsented(true);
        setMsgs(saved.msgs ?? []);
        setMood(moodFrom(saved.msgs ?? []));
        session.current = saved.sessionId ?? null;
      }
    } catch {}
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      if (consented) sessionStorage.setItem(STORE, JSON.stringify({ consented, msgs: msgs.filter((m) => m.text).slice(-40), sessionId: session.current }));
    } catch {}
  }, [consented, msgs]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [msgs, busy]);

  // Grow the input with its content, up to a few lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    if (input) el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  useEffect(() => {
    (consented ? inputRef.current : dialog.current?.querySelector<HTMLElement>("[data-autofocus]"))?.focus();
  }, [consented]);

  useEffect(() => {
    if (!matchMedia("(max-width: 639px)").matches) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The API host sleeps when idle; tell the visitor instead of leaving them staring at a spinner.
  const wakingHooks = useMemo(() => ({ onSlow: () => setWaking(true), onRecovered: () => setWaking(false) }), []);

  const ensureSession = useCallback(async (restore = false) => {
    if (session.current && !restore) return session.current;
    const history = restore ? msgs.filter((m) => !m.crisis && m.text).slice(-20).map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text.slice(0, 1500) })) : undefined;
    const { sessionId } = await startChatSession(history, wakingHooks);
    session.current = sessionId;
    return sessionId;
  }, [msgs, wakingHooks]);

  /** Sends `text` (adding a user bubble unless this is a retry) and streams the reply. */
  async function run(text: string, addUser: boolean) {
    setBusy(true);
    setFailedText(null);
    const botId = uid();
    setMsgs((m) => [...m, ...(addUser ? [{ id: uid(), role: "user" as const, text }] : []), { id: botId, role: "bot", text: "" }]);
    const patch = (fn: (b: Msg) => Msg) => setMsgs((m) => m.map((x) => (x.id === botId ? fn(x) : x)));

    // The model can generate a reply faster than a person reads it. Decouple how
    // fast text ARRIVES from how fast it APPEARS: buffer it and reveal it at a
    // steady, readable pace after a short "reading your message" pause. A crisis
    // reply (safety information) and functional replies (booking links) show at once.
    let full = "";
    let shown = 0;
    let streamEnded = false;
    let instant = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let starter: ReturnType<typeof setTimeout> | null = null;
    const meta: Partial<Msg> & { functional?: boolean } = {};
    let resolveDone!: () => void;
    const finished = new Promise<void>((r) => (resolveDone = r));
    const stop = () => {
      if (timer) clearInterval(timer);
      if (starter) clearTimeout(starter);
      timer = starter = null;
    };
    const apply = (final: boolean) => patch((b) => ({ ...b, text: full.slice(0, shown), crisis: b.crisis || meta.crisis, ...(final ? { error: meta.error, action: meta.action, quickReplies: meta.quickReplies, doctors: meta.doctors } : {}) }));
    const done = () => {
      stop();
      shown = full.length;
      apply(true);
      if (meta.functional) setMood("neutral"); // booking/records are transactional, not emotional
      if (meta.error) setFailedText(text);
      if (full && !meta.error) setAnnouncement(`Tulasi: ${plainText(full)}`);
      resolveDone();
    };
    const tick = () => {
      if (shown < full.length) {
        shown = Math.min(full.length, shown + 2);
        apply(false);
      }
      if (streamEnded && shown >= full.length) done();
    };
    const onEvent = (e: ChatEvent) => {
      if (e.text) full += e.text;
      if (e.crisis) meta.crisis = true;
      if (e.error) meta.error = true;
      if (e.functional) meta.functional = true;
      if (e.action) meta.action = e.action;
      if (e.quickReplies) meta.quickReplies = e.quickReplies;
      if (e.doctors) meta.doctors = e.doctors;
      if (e.crisis || e.functional) instant = true;
      if (instant) {
        stop();
        shown = full.length;
        apply(false);
      } else if (!timer && !starter && full) {
        starter = setTimeout(() => {
          starter = null;
          timer = setInterval(tick, 25);
        }, 350 + Math.random() * 250);
      }
    };

    abort.current = new AbortController();
    const signal = abort.current.signal;
    signal.addEventListener("abort", () => {
      stop();
      resolveDone();
    });
    try {
      let id = await ensureSession();
      try {
        await streamChat(id, text, onEvent, signal, wakingHooks);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          id = await ensureSession(true); // server restarted: carry the conversation over
          await streamChat(id, text, onEvent, signal, wakingHooks);
        } else throw err;
      }
      streamEnded = true;
      if (!full || instant || shown >= full.length) done();
      await finished;
    } catch (err) {
      stop();
      if ((err as Error).name !== "AbortError") {
        const apiErr = err instanceof ApiError && err.status !== 0 ? err : null;
        patch((b) => ({ ...b, error: true, text: b.text || (apiErr ? apiErr.message : `I can’t connect right now. Please try again, or call us on ${phone.display}.`) }));
        // Too long / too many requests: the bubble says why, and retrying a too-long message fails again.
        if (apiErr?.status !== 413) setFailedText(text);
      }
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function send(raw: string) {
    const message = raw.trim();
    if (!message || busy) return;
    setInput("");
    const detected = detectMood(message);
    if (detected) setMood(detected);
    run(message, true);
  }

  function retry() {
    if (!failedText || busy) return;
    const text = failedText;
    setMsgs((m) => (m.at(-1)?.role === "bot" && m.at(-1)?.error ? m.slice(0, -1) : m));
    run(text, false);
  }

  function newChat() {
    abort.current?.abort();
    if (session.current) endChatSession(session.current);
    session.current = null;
    setMsgs([]);
    setMood("neutral");
    setFailedText(null);
    setAnnouncement("");
    try {
      sessionStorage.removeItem(STORE);
    } catch {}
    setConsented(true);
  }

  // The mascot puts on the stethoscope whenever the latest reply recommends specialists.
  const lastBot = [...msgs].reverse().find((m) => m.role === "bot" && m.text);
  const doctorMode = !!lastBot?.doctors?.length && !busy;
  const lastId = msgs.at(-1)?.id;

  const markdown: Components = {
    p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    h1: ({ children }) => <p className="mb-2 font-semibold last:mb-0">{children}</p>,
    h2: ({ children }) => <p className="mb-2 font-semibold last:mb-0">{children}</p>,
    h3: ({ children }) => <p className="mb-2 font-semibold last:mb-0">{children}</p>,
    hr: () => <hr className="my-2 border-line" />,
    code: ({ children }) => <code className="rounded bg-black/5 px-1 py-0.5 text-[0.9em]">{children}</code>,
    a: ({ children, href }) =>
      href?.startsWith("/") ? (
        <Link href={href} onClick={onClose} className="font-semibold text-brand-700 underline underline-offset-2">{children}</Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline underline-offset-2">{children}</a>
      ),
  };
  const bot = (text: string) => <ReactMarkdown components={markdown}>{normalizeMarkdown(text)}</ReactMarkdown>;

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
      className="fixed inset-0 z-[65] flex max-sm:h-dvh flex-col bg-white sm:inset-auto sm:right-6 sm:bottom-28 sm:h-[min(640px,calc(100dvh-9rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-[1.75rem] sm:shadow-[0_24px_60px_-20px_rgb(23_34_44/0.35)] sm:ring-1 sm:ring-line"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] text-ink">
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-sage-50 p-1 shadow-[inset_0_0_0_1px_var(--color-sage-100)]">
          <TulasiMascot mood={mood} streaming={busy} doctorMode={doctorMode} className="size-full" />
          <span className="absolute right-0 bottom-0 size-3 rounded-full bg-sage-500 ring-2 ring-white" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold leading-tight">Tulasi</p>
          <p className="text-xs text-ink-soft">{waking ? "Waking up, this can take up to a minute…" : busy ? "Thinking with you…" : "AI assistant · not a doctor"}</p>
        </div>
        {consented && msgs.length > 0 && (
          <button type="button" onClick={newChat} className="min-h-10 rounded-full px-3 text-xs font-semibold text-ink-soft hover:bg-mist hover:text-brand-700">New chat</button>
        )}
        <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-ink">
          <Icon name="close" />
          <span className="sr-only">Close chat</span>
        </button>
      </div>

      {!consented ? (
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <TulasiMascot mood="happy" className="mb-3 size-20" />
          <p className="font-display text-xl font-bold text-ink">Hi, I’m Tulasi.</p>
          <p className="mt-2 leading-relaxed text-ink-soft">I can answer questions about mental health, our services and our team, and help you find the right specialist.</p>
          <ul className="mt-5 space-y-3 text-sm text-ink-soft">
            <li className="flex gap-3"><Icon name="spark" className="mt-0.5 size-4 shrink-0 text-brand-600" /><span>I’m an AI assistant, <strong className="text-ink">not a doctor</strong>. I can’t diagnose or advise on medicines.</span></li>
            <li className="flex gap-3"><Icon name="shield" className="mt-0.5 size-4 shrink-0 text-brand-600" /><span>Please don’t share your name, phone number or medical history here. To book, use our secure booking form.</span></li>
            <li className="flex gap-3"><Icon name="heart" className="mt-0.5 size-4 shrink-0 text-alert-600" /><span>If you are in crisis, call us on <a href={phone.href} className="font-semibold text-alert-700 underline">{phone.display}</a>.</span></li>
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
          <div ref={list} role="log" aria-label="Conversation with Tulasi" className="flex-1 space-y-3 overflow-y-auto bg-mist/60 p-4">
            {/* Greeting: always the first bubble (not stored, not sent to the model). */}
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-[0.9375rem] text-ink shadow-[var(--shadow-soft)]">{bot(greeting(phone.display))}</div>
            </div>
            {msgs.length === 0 && (
              <div className="space-y-2 pt-1">
                {STARTERS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="block min-h-11 w-full rounded-2xl bg-white px-4 py-2.5 text-left text-sm text-ink ring-1 ring-line transition-[box-shadow,transform] hover:-translate-y-px hover:ring-brand-300">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 220 }}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-3xl rounded-br-md bg-brand-600 px-4 py-2.5 text-[0.9375rem] whitespace-pre-wrap text-white"
                      : m.crisis
                        ? "max-w-[92%] rounded-3xl rounded-bl-md border-2 border-alert-600 bg-alert-50 px-4 py-3 text-[0.9375rem] text-ink"
                        : m.error
                          ? "max-w-[88%] rounded-3xl rounded-bl-md bg-mist px-4 py-2.5 text-[0.9375rem] text-ink-soft ring-1 ring-line"
                          : "max-w-[88%] rounded-3xl rounded-bl-md bg-white px-4 py-2.5 text-[0.9375rem] text-ink shadow-[var(--shadow-soft)]"
                  }
                >
                  {m.role === "bot" && !m.text ? (
                    <span className="flex gap-1 py-1.5" role="status" aria-label="Tulasi is typing">
                      {[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-brand-300" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </span>
                  ) : m.role === "user" ? (
                    m.text
                  ) : (
                    bot(m.text)
                  )}
                  {m.crisis && (
                    <div className="mt-3 grid gap-2">
                      <a href={phone.href} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-alert-600 font-semibold text-white"><Icon name="phone" className="size-4" /> Call Tulasi Healthcare</a>
                    </div>
                  )}
                  {m.action === "book" && <Link href="/book-appointment/" onClick={onClose} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-600 font-semibold text-white"><Icon name="calendar" className="size-4" /> Book Appointment</Link>}
                  {m.action === "portal" && <Link href="/patient-login/" onClick={onClose} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-600 font-semibold text-white"><Icon name="user" className="size-4" /> Patient portal</Link>}
                  {m.doctors && m.doctors.length > 0 && (
                    <ul className="mt-3 space-y-2 border-t border-line pt-3">
                      {m.doctors.map((d) => {
                        const slug = doctorSlugs[d.name];
                        const photo = doctorPhotos[d.name];
                        return (
                          <li key={d.name} className="flex items-center gap-3 rounded-2xl bg-brand-50 p-2">
                            {photo ? (
                              <Image src={photo} alt="" width={48} height={48} className="size-12 shrink-0 rounded-full bg-white object-cover object-[50%_12%] ring-1 ring-brand-100" />
                            ) : (
                              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-lg font-semibold text-brand-700 ring-1 ring-brand-100" aria-hidden="true">{d.name.replace(/^(Dr\.|Ms\.|Mr\.)\s*(\([^)]*\)\s*)?/i, "").charAt(0)}</span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{d.name}</span>
                              {d.role && <span className="block truncate text-xs text-ink-soft">{d.role}</span>}
                            </span>
                            <Link href={slug ? `/book-appointment/?doctor=${slug}` : "/book-appointment/"} onClick={onClose} className="shrink-0 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">Book</Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {m.quickReplies && m.quickReplies.length > 0 && m.id === lastId && !busy && (
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Suggested replies">
                      {m.quickReplies.slice(0, 6).map((q) => (
                        <button key={q} type="button" onClick={() => send(q)} className={q === "Never mind" ? "min-h-9 rounded-full bg-white px-3 text-xs font-semibold text-ink-soft ring-1 ring-line hover:bg-mist" : "min-h-9 rounded-full bg-brand-50 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-100"}>{q}</button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {failedText && !busy && (
              <div className="flex items-center gap-3 px-1" role="alert">
                <p className="text-sm text-ink-soft">That message didn’t go through.</p>
                <button type="button" onClick={retry} className="min-h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">Retry</button>
              </div>
            )}
          </div>
          {/* One announcement per finished reply, not every revealed character. */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
          <form
            className="border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">Message Tulasi</label>
              <textarea
                id="chat-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_MESSAGE_CHARS}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter is a new line, but not while an input method is composing (Hindi/Tamil/Telugu keyboards).
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Share what’s on your mind…"
                className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl bg-mist px-4 py-3 text-base sm:text-[0.9375rem] text-ink placeholder:text-ink-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              />
              <motion.button
                type="submit"
                disabled={busy || !input.trim()}
                whileHover={input.trim() && !busy ? { scale: 1.06 } : {}}
                whileTap={{ scale: 0.94 }}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
              >
                <Icon name="arrow" />
                <span className="sr-only">Send</span>
              </motion.button>
            </div>
            <p className="mt-2 px-2 text-center text-[0.6875rem] text-ink-soft">
              AI assistant, not a doctor. In crisis? Call <a href={phone.href} className="font-semibold underline">{phone.display}</a>.
            </p>
          </form>
        </>
      )}
    </motion.div>
  );
}
