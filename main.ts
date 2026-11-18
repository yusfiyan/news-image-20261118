// news-image-20261118 entry: "The World in One Day" — a newspaper front page
// summing up Wednesday 18 November 2026 in one 1024x1024 PNG.
//
// The image is rendered from page.html (kept outside this repo) with headless
// Chromium and shipped here as entry.png. This program only verifies the file
// the gate will see and copies it to the output directory, so both grading
// runs write exactly the same bytes.
//
// The day's stories (researched 18 Nov 2026, before the entry was built):
//   1. U.S. sinks five Iranian tankers; Iran hits back near Hormuz and in Jordan
//   2. Crimean Bridge road arch collapses after a second night of strikes
//   3. APEC opens in Shenzhen; Trump, Xi and Putin to meet Thursday
//   4. COP31 enters its final days in Antalya, 144 items still disputed
//   5. Gaza faces winter in tents; U.N. warns of cold deaths, four nations urge aid
//   6. North Korea fires a ballistic missile toward the Sea of Japan
//   Also: Nvidia posts a $115.8bn quarter; Mongolia's president quits;
//   Cyclone Akvan nears India.

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target = join(outDir, "entry.png");

const bytes = readFileSync(source);

// The gate only accepts a whole PNG or JPEG. Refuse to ship anything else
// rather than letting a corrupt file through as a silent invalid entry.
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
for (let i = 0; i < pngSignature.length; i += 1) {
  if (bytes[i] !== pngSignature[i]) {
    throw new Error("entry.png is not a PNG file (bad signature)");
  }
}

// Gate cap: at most 1 MiB.
if (bytes.length > 1048576) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB cap`);
}

// Gate cap: at most 1024 by 1024 pixels. The IHDR chunk starts at byte 8
// (4-byte length, "IHDR") and holds width and height as big-endian uint32.
const ihdrLength = bytes.readUInt32BE(8);
const ihdrType = bytes.toString("latin1", 12, 16);
if (ihdrLength !== 13 || ihdrType !== "IHDR") {
  throw new Error("entry.png has no valid IHDR chunk");
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > 1024 || height > 1024) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 cap`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
console.log(`entry.png: ${width}x${height}, ${bytes.length} bytes -> ${target}`);
