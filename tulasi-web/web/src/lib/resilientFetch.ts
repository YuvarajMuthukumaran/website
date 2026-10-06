// fetch() that survives a sleeping API host (Render's free tier spins down and
// takes 30-60s to wake). Only 502/503/504 are retried: those come from the host's
// proxy before our app ever sees the request, so retrying a POST cannot double-submit.
// A 4xx/5xx from the app itself (400, 404, 429, 500...) is returned as-is.
const WAKING = new Set([502, 503, 504]);

const sleep = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });

export type RetryOptions = {
  retries?: number;
  baseMs?: number;
  /** Called once if the request is still pending after this long, so the UI can say "waking up". */
  slowAfterMs?: number;
  onSlow?: () => void;
  /** Called after onSlow, once the request finally settles (success or give-up). */
  onRecovered?: () => void;
};

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  { retries = 4, baseMs = 2000, slowAfterMs = 3500, onSlow, onRecovered }: RetryOptions = {}
): Promise<Response> {
  let notified = false;
  const slowTimer = onSlow
    ? setTimeout(() => {
        notified = true;
        onSlow();
      }, slowAfterMs)
    : undefined;
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        const res = await fetch(input, init);
        if (!WAKING.has(res.status) || attempt >= retries) return res;
      } catch (err) {
        if ((err as Error).name === "AbortError" || attempt >= retries) throw err;
      }
      await sleep(baseMs * 2 ** attempt, init.signal); // 2s, 4s, 8s, 16s
    }
  } finally {
    clearTimeout(slowTimer);
    if (notified) onRecovered?.();
  }
}

let warm: Promise<boolean> | undefined;
/** Fire and forget: wakes the API before the visitor needs it. Cached for 5 minutes. */
export function warmUp(healthUrl: string): Promise<boolean> {
  warm ??= fetchWithRetry(healthUrl, { cache: "no-store" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (warm = undefined), 5 * 60_000);
    });
  return warm;
}
