/**
 * replace-doctor-photos-2.mjs
 * Converts new doctor PNG/JPEG headshots to WebP and replaces the existing
 * team-cutouts in public/team-cutouts/.
 */

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_DIR = path.resolve(
  __dirname,
  "../../extracted_doctors/Doctors Headshots"
);
const DEST_DIR = path.resolve(__dirname, "../public/team-cutouts");

// Mapping: new photo filename (without ext) → target webp filename (without ext)
const MAP = [
  { src: "Dr Alisha.png",           dest: "dr-alisha-nagar" },
  { src: "Dr Gorav Gupta.png",      dest: "dr-gorav-gupta" },
  { src: "dr ichpreet singh.png",   dest: "dr-ichpreet-singh" },
  { src: "Dr Kritika Soni.png",     dest: "dr-kritika-soni" },
  { src: "dr madhrua THC.png",      dest: "dr-madhura-samudra" },
  { src: "Dr Pooja THC.png",        dest: "dr-pooja-sharma" },
  { src: "Dr Poorva Gupta.png",     dest: "dr-poorva-gupta" },
  { src: "Dr Ratnarakshit.png",     dest: "dr-ratnarakshit-ingole" },
  { src: "Dr Sammer Guliani.jpeg",  dest: "dr-sameer-guliani" },
  { src: "Dr Suravi.png",           dest: "dr-suravi-das" },
  // Dr Anubhav.png  → skipped (no matching doctor in system)
  // Dr Naseem.png   → skipped (no matching doctor in system)
];

for (const { src, dest } of MAP) {
  const srcFile = path.join(SRC_DIR, src);
  const destFile = path.join(DEST_DIR, `${dest}.webp`);

  try {
    await sharp(srcFile)
      .webp({ quality: 85 })
      .toFile(destFile);
    console.log(`✅  ${src}  →  ${dest}.webp`);
  } catch (err) {
    console.error(`❌  Failed ${src}: ${err.message}`);
  }
}

console.log("\nDone! All matched doctor photos have been replaced.");
console.log("Skipped: Dr Anubhav.png, Dr Naseem.png (no matching doctor in system).");
