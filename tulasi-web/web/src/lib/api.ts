// Browser-side client for the Express API (chat, booking, patient login).
// The Groq key, database and HMS credentials live only on that server.
// Always same origin: the browser calls /api/* on this site and next.config.ts
// forwards it to the hosted chat server (so there is no CORS to configure and no
// environment variable to forget on a new deployment).
import { fetchWithRetry, type RetryOptions } from "@/lib/resilientFetch";

export const API_BASE = "";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// The site uses trailing slashes (next.config trailingSlash), and Next answers an API path without one with a
// redirect that some browsers refuse to follow for fetch(). Always ask for the slash form directly.
const apiUrl = (path: string) => {
  const [p, q] = path.split("?");
  return `${API_BASE}/api${p.endsWith("/") ? p : `${p}/`}${q ? `?${q}` : ""}`;
};

async function call<T>(path: string, init: RequestInit & { auth?: boolean } = {}, retry?: RetryOptions): Promise<T> {
  const { auth, ...rest } = init;
  let res: Response;
  try {
    res = await fetchWithRetry(
      apiUrl(path),
      {
        ...rest,
        headers: { ...(rest.body ? { "Content-Type": "application/json" } : {}), ...rest.headers },
        // The session cookie is only ever sent to the auth/portal endpoints.
        credentials: auth ? "include" : "omit",
      },
      retry
    );
  } catch {
    throw new ApiError("We couldn’t reach our booking system. Please check your connection, or call us.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "Something went wrong. Please try again.", res.status);
  return data as T;
}

// ───────────── Doctors & booking ─────────────
export type ApiDoctor = { _id: string; name: string; role?: string; specialties?: string[]; focus?: string; photo?: string };
/** Dr Gorav Gupta is always listed first; everyone else keeps the order the server gave. */
export const leadFirst = <T extends { name: string }>(list: T[]) => {
  const lead = (x: T) => /gorav\s+gupta/i.test(x.name);
  return [...list.filter(lead), ...list.filter((x) => !lead(x))];
};
export const fetchDoctors = (specialty?: string) =>
  call<{ doctors: ApiDoctor[] }>(`/doctors${specialty ? `?specialty=${encodeURIComponent(specialty)}` : ""}`).then((r) => ({ ...r, doctors: leadFirst(r.doctors) }));
export const fetchSpecialties = () => call<{ specialties: string[] }>("/doctors/specialties");
export const fetchSlots = (doctorId: string, date: string) => call<{ slots: string[] }>(`/appointments/slots?${new URLSearchParams({ doctorId, date })}`);
export type Appointment = { _id: string; doctorId: string; doctorName: string; date: string; time: string; status: "booked" | "cancelled" };
// `code` is the 6-digit code e-mailed to `patientEmail` (see requestOtp). Booking also signs the patient in (session cookie).
export const createAppointment = (body: { doctorId: string; patientName: string; patientPhone: string; patientEmail: string; code: string; date: string; time: string }) =>
  call<{ ok: true; appointment: Appointment }>("/appointments", { method: "POST", body: JSON.stringify(body), auth: true });

// ───────────── Patient login & portal ─────────────
export type PatientUser = { email?: string; phone?: string };
export const requestOtp = (email: string) => call<{ ok: true; devCode?: string }>("/auth/otp/request", { method: "POST", body: JSON.stringify({ email }), auth: true });
export const verifyOtp = (email: string, code: string) => call<{ ok: true; user: PatientUser }>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ email, code }), auth: true });
export const fetchMe = () => call<{ user: PatientUser }>("/auth/me", { auth: true });
export const logout = () => call<{ ok: true }>("/auth/logout", { method: "POST", auth: true });
export const myAppointments = () => call<{ appointments: Appointment[] }>("/me/appointments", { auth: true });
export const cancelMyAppointment = (id: string) => call<{ ok: true }>(`/me/appointments/${encodeURIComponent(id)}/cancel`, { method: "PATCH", auth: true });

// ───────────── Guided matching ─────────────
export type MatchInput = { concern: string; who: "self" | "child" | "elder" | "loved"; support: "therapy" | "medication" | "unsure" };
export type MatchResult = { relaxed: boolean; matches: { name: string; role: string; focus: string | null; photo: string | null; reasons: string[] }[]; fallback?: "call" };
export const matchDoctors = (input: MatchInput) =>
  call<MatchResult>("/match", { method: "POST", body: JSON.stringify(input) }).then((r) => ({ ...r, matches: leadFirst(r.matches) }));

// ───────────── Chat ─────────────
export const startChatSession = (history?: { role: string; text: string }[], retry?: RetryOptions) =>
  call<{ sessionId: string; crisisResources: unknown }>("/session", { method: "POST", body: JSON.stringify({ channel: "website", ...(history?.length ? { history } : {}) }) }, retry);
export const endChatSession = (id: string) => fetch(apiUrl(`/session/${encodeURIComponent(id)}`), { method: "DELETE" }).catch(() => {});

export type ChatEvent = { text?: string; crisis?: boolean; error?: boolean; functional?: boolean; action?: "book" | "portal"; quickReplies?: string[]; doctors?: { name: string; role?: string; photo?: string | null }[] };

/** Streams one reply (SSE over POST). Resolves when the stream ends. */
export async function streamChat(sessionId: string, message: string, onEvent: (e: ChatEvent) => void, signal?: AbortSignal, retry?: RetryOptions) {
  const res = await fetchWithRetry(apiUrl("/chat"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message }), signal }, retry);
  if (res.status === 404) throw new ApiError("session-expired", 404);
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError((data as { error?: string }).error ?? "The chat is unavailable right now.", res.status);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        onEvent(JSON.parse(payload));
      } catch {
        /* ignore a malformed chunk */
      }
    }
  }
}
