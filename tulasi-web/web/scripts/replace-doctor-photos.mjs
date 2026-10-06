/**
 * replace-doctor-photos.mjs
 * Converts new doctor JPG headshots to WebP and replaces the existing
 * team-cutouts in public/team-cutouts/.
 */

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_DIR = path.resolve(
  __dirname,
  "../../extracted_photos/Psychologist Headshots"
);
const DEST_DIR = path.resolve(__dirname, "../public/team-cutouts");

// Mapping: new photo filename (without ext) → target webp filename (without ext)
const MAP = {
  Aastha: "ms-aastha-dwivedi",
  Ankita: "ms-ankita-bhatnagar",
  Barkha: "ms-barkha-soni",
  Chaya: "ms-chaya-chaudhary",
  Jyoti: "ms-jyoti",
  Kiran: "ms-kiran-singh",
  Manju: "ms-manju-kumari",
  Suparash: "mr-suparas-jain",
  Surabi: "surabhi-sengar",
  // Punya is skipped — no matching doctor in the system yet
};

for (const [srcName, destName] of Object.entries(MAP)) {
  const srcFile = path.join(SRC_DIR, `${srcName}.jpg`);
  const destFile = path.join(DEST_DIR, `${destName}.webp`);

  try {
    await sharp(srcFile)
      .webp({ quality: 85 })
      .toFile(destFile);
    console.log(`✅  ${srcName}.jpg  →  ${destName}.webp`);
  } catch (err) {
    console.error(`❌  Failed ${srcName}: ${err.message}`);
  }
}

console.log("\nDone! All matched photos have been replaced.");
