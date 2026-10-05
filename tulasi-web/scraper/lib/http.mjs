// Polite, cached HTTP for the one-time content extraction.
//
// - Every response is cached on disk under data/raw/cache, so re-running any
//   script never hits the live site again (delete the cache to force a refresh).
// - Requests go through a small concurrency pool with a delay between them, so
//   the crawl never looks like load on the hospital's shared LiteSpeed host.
// - Redirects are followed manually so the inventory can record every hop.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const ORIGIN = "https://www.tulasihealthcare.com";
export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const DATA = path.join(ROOT, "data");
export const RAW = path.join(DATA, "raw");
const CACHE = path.join(RAW, "cache");

const UA = "TulasiSiteMigration/1.0 (one-time content inventory; contact: site owner)";
const CONCURRENCY = Number(process.env.SCRAPE_CONCURRENCY ?? 3);
const DELAY_MS = Number(process.env.SCRAPE_DELAY_MS ?? 350);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = (url) => createHash("sha1").update(url).digest("hex");

let active = 0;
const queue = [];
async function slot() {
  if (active >= CONCURRENCY) await new Promise((r) => queue.push(r));
  active++;
}
function release() {
  active--;
  queue.shift()?.();
}

/**
 * Fetch a URL once. Returns { url, finalUrl, status, redirects[], headers, body }.
 * Cached responses are returned without touching the network.
 */
export async function fetchCached(url, { retries = 3 } = {}) {
  await mkdir(CACHE, { recursive: true });
  const file = path.join(CACHE, key(url) + ".json");
  if (existsSync(file)) return JSON.parse(await readFile(file, "utf8"));

  await slot();
  try {
    const redirects = [];
    let current = url;
    let res;
    for (let hop = 0; hop < 10; hop++) {
      for (let attempt = 0; ; attempt++) {
        try {
          res = await fetch(current, { redirect: "manual", headers: { "User-Agent": UA } });
          // Transient: rate limited or the host is briefly overloaded (the live
          // LiteSpeed host returns 500 under load; the same URL succeeds on retry).
          if ([429, 500, 502, 503, 504].includes(res.status) && attempt < retries) throw new Error(`HTTP ${res.status}`);
          break;
        } catch (err) {
          if (attempt >= retries) throw err;
          await sleep(2000 * (attempt + 1));
        }
      }
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = new URL(loc, current).href;
        redirects.push({ from: current, to: next, status: res.status });
        current = next;
        continue;
      }
      break;
    }
    const result = {
      url,
      finalUrl: current,
      status: res.status,
      redirects,
      headers: Object.fromEntries(
        ["content-type", "x-wp-total", "x-wp-totalpages", "last-modified", "x-robots-tag"]
          .map((h) => [h, res.headers.get(h)])
          .filter(([, v]) => v != null)
      ),
      body: await res.text(),
      fetchedAt: new Date().toISOString(),
    };
    await writeFile(file, JSON.stringify(result));
    await sleep(DELAY_MS);
    return result;
  } finally {
    release();
  }
}

export async function fetchJson(url) {
  const r = await fetchCached(url);
  if (r.status !== 200) throw new Error(`${r.status} for ${url}`);
  return { data: JSON.parse(r.body), headers: r.headers };
}

export async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
}

export async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

/** Run fn over items with progress output; the pool above bounds concurrency. */
export async function mapProgress(items, fn, label) {
  let done = 0;
  return Promise.all(
    items.map(async (item) => {
      const out = await fn(item);
      if (++done % 25 === 0 || done === items.length) console.log(`  ${label}: ${done}/${items.length}`);
      return out;
    })
  );
}
