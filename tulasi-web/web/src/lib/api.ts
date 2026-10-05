// Browser-side client for the Express API (chat, booking, patient login).
// The Groq key, database and HMS credentials live only on that server.
// Empty = same origin: the browser calls /api/* on this site and next.config.ts
// forwards it to the hosted server. Set NEXT_PUBLIC_API_URL only to call another
// API directly (e.g. the local sandbox at http://localhost:8788).
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      ...rest,
      headers: { ...(rest.body ? { "Content-Type": "application/json" } : {}), ...rest.headers },
      // The session cookie is only ever sent to the auth/portal endpoints.
      credentials: auth ? "include" : "omit",
    });
  } catch {
    throw new ApiError("We couldn’t reach our booking system. Please check your connection, or call us.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "Something went wrong. Please try again.", res.status);
  return data as T;
}

// ───────────── Doctors & booking ─────────────
export type ApiDoctor = { _id: string; name: string; role?: string; specialties?: string[]; focus?: string; photo?: string };
export const fetchDoctors = (specialty?: string) => call<{ doctors: ApiDoctor[] }>(`/doctors${specialty ? `?specialty=${encodeURIComponent(specialty)}` : ""}`);
export const fetchSpecialties = () => call<{ specialties: string[] }>("/doctors/specialties");
export const fetchSlots = (doctorId: string, date: string) => call<{ slots: string[] }>(`/appointments/slots?${new URLSearchParams({ doctorId, date })}`);
export type Appointment = { _id: string; doctorId: string; doctorName: string; date: string; time: string; status: "booked" | "cancelled" };
export const createAppointment = (body: { doctorId: string; patientName: string; patientPhone: string; date: string; time: string }) =>
  call<{ ok: true; appointment: Appointment }>("/appointments", { method: "POST", body: JSON.stringify(body) });

// ───────────── Patient login & portal ─────────────
export const requestOtp = (phone: string) => call<{ ok: true; devCode?: string }>("/auth/otp/request", { method: "POST", body: JSON.stringify({ phone }), auth: true });
export const verifyOtp = (phone: string, code: string) => call<{ ok: true; user: { phone: string } }>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, code }), auth: true });
export const fetchMe = () => call<{ user: { phone: string } }>("/auth/me", { auth: true });
export const logout = () => call<{ ok: true }>("/auth/logout", { method: "POST", auth: true });
export const myAppointments = () => call<{ appointments: Appointment[] }>("/me/appointments", { auth: true });
export const cancelMyAppointment = (id: string) => call<{ ok: true }>(`/me/appointments/${encodeURIComponent(id)}/cancel`, { method: "PATCH", auth: true });

// ───────────── Chat ─────────────
export const startChatSession = (history?: { role: string; text: string }[]) =>
  call<{ sessionId: string; crisisResources: unknown }>("/session", { method: "POST", body: JSON.stringify({ channel: "website", ...(history?.length ? { history } : {}) }) });
export const endChatSession = (id: string) => fetch(`${API_BASE}/api/session/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});

export type ChatEvent = { text?: string; crisis?: boolean; error?: boolean; functional?: boolean; action?: "book" | "portal"; quickReplies?: string[]; doctors?: { name: string; role?: string; photo?: string | null }[] };

/** Streams one reply (SSE over POST). Resolves when the stream ends. */
export async function streamChat(sessionId: string, message: string, onEvent: (e: ChatEvent) => void, signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message }), signal });
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
