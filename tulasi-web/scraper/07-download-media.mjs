// Step 7: download every image/file the site uses, keeping the exact original
// path (public/wp-content/uploads/... in the new app), so no image URL changes
// and Google Images keeps its index. next/image converts to AVIF/WebP on the fly.
// Sources: the REST media library + any same-host asset referenced in crawled pages.
// Output: data/media/<original path>, data/media/_manifest.json
import path from "node:path";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { DATA, RAW, readJson, writeJson, mapProgress } from "./lib/http.mjs";

const MEDIA_DIR = path.join(DATA, "media");
const HOSTS = new Set(["www.tulasihealthcare.com", "tulasihealthcare.com"]);
const media = await readJson(path.join(DATA, "content", "media.json"));
const crawl = await readJson(path.join(RAW, "crawl.json"));

const urls = new Map(); // url -> source
for (const m of media) urls.set(m.url, "media-library");
for (const r of crawl) {
  // Only real files: some theme <img> tags point at post URLs (no extension).
  for (const i of r.images ?? []) if (HOSTS.has(new URL(i.src).host) && /\.[a-z0-9]{2,5}$/i.test(new URL(i.src).pathname) && !urls.has(i.src)) urls.set(i.src, "page-only");
  if (r.ogImage && !urls.has(r.ogImage)) urls.set(r.ogImage, "og-image");
}

// Binary downloads bypass the JSON cache but are just as polite: 3 at a time, with a pause.
let active = 0;
const waiters = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const manifest = await mapProgress(
  [...urls],
  async ([url, source]) => {
    const rel = decodeURIComponent(new URL(url).pathname).replace(/^\/+/, "");
    const file = path.join(MEDIA_DIR, rel);
    if (existsSync(file)) return { url, path: "/" + rel, source, bytes: (await stat(file)).size, cached: true };
    if (active >= 3) await new Promise((r) => waiters.push(r));
    active++;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "TulasiSiteMigration/1.0" } });
      if (!res.ok) return { url, path: "/" + rel, source, status: res.status };
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, buf);
      await sleep(250);
      return { url, path: "/" + rel, source, bytes: buf.length };
    } catch (e) {
      return { url, path: "/" + rel, source, status: "error", error: String(e) };
    } finally {
      active--;
      waiters.shift()?.();
    }
  },
  "media"
);

await writeJson(path.join(MEDIA_DIR, "_manifest.json"), manifest);
const failed = manifest.filter((m) => m.status);
console.log({ files: manifest.length, mb: +(manifest.reduce((a, m) => a + (m.bytes ?? 0), 0) / 1e6).toFixed(1), failed: failed.length });
if (failed.length) console.table(failed.slice(0, 20).map(({ url, status }) => ({ url, status })));
