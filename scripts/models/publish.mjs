// Copy the chosen models into the site and write the list the app matches types against.
//   node scripts/models/publish.mjs --in <dir of converted .glb> --src "<...>/open-models"
// Writes public/models/<id>.glb, public/models/CREDITS.txt, public/models/COPYING.txt
// and app/app/_lib/modelList.ts.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { CATALOG } from "./catalog.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const IN = arg("in"), SRC = arg("src");
const OUT = path.resolve("public/models");
const LIST = path.resolve("app/app/_lib/modelList.ts");

const sourceOf = (file) => {
  const buf = fs.readFileSync(file);
  return JSON.parse(buf.toString("utf8", 20, 20 + buf.readUInt32LE(12))).asset.extras.source;
};

/** Author names from a FlightGear aircraft's set files, for the credits. */
function authorsOf(source) {
  const dir = path.join(SRC, source);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return "";
  const names = new Set();
  for (const f of fs.readdirSync(dir)) {
    if (!/-set\.xml$/i.test(f)) continue;
    const xml = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of xml.matchAll(/<authors?\b[^>]*>([^<]{2,300})<\/authors?>/gi)) {
      for (const n of m[1].split(/[,;\n]|\band\b/)) {
        const s = n.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
        if (s.length > 2 && s.length < 60) names.add(s);
      }
    }
    for (const m of xml.matchAll(/<author\b[^>]*>\s*<name\b[^>]*>([^<]{2,80})<\/name>/gi)) names.add(m[1].trim());
  }
  return [...names].slice(0, 12).join(", ");
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".glb")) fs.unlinkSync(path.join(OUT, f));

const rows = [], credits = [], seen = new Set();
let bytes = 0;
for (const [id, from, label, exact, alias] of CATALOG) {
  if (seen.has(id)) throw new Error("duplicate id " + id);
  seen.add(id);
  for (const p of [exact, alias]) if (p) new RegExp(p);
  const file = path.join(IN, from + ".glb");
  if (!fs.existsSync(file)) { console.log("missing, left out:", id, "<-", from); continue; }
  const buf = fs.readFileSync(file);
  fs.writeFileSync(path.join(OUT, id + ".glb"), buf);
  bytes += buf.length;
  const v = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
  rows.push(`  [${JSON.stringify(id)}, ${JSON.stringify(label)}, ${JSON.stringify(v)}, ${JSON.stringify(exact)}, ${JSON.stringify(alias)}],`);
  const source = sourceOf(file);
  const who = source.startsWith("fr24") ? "Flightradar24 AB" : authorsOf(source) || "the FlightGear aircraft authors";
  credits.push(`${(id + ".glb").padEnd(14)} ${label}\n               from ${source}\n               by ${who}`);
}

fs.writeFileSync(LIST, `// Written by scripts/models/publish.mjs from scripts/models/catalog.mjs. Do not edit by hand.
// [id, label, file version, exact pattern, alias pattern]
export const MODEL_LIST: [string, string, string, string, string][] = [
${rows.join("\n")}
];
`);

const gpl = [path.join(SRC, "fr24-3d-models", "LICENSE"), path.join(SRC, "A320-family", "LICENSE")].find((f) => fs.existsSync(f));
if (gpl) fs.copyFileSync(gpl, path.join(OUT, "COPYING.txt"));
fs.writeFileSync(path.join(OUT, "CREDITS.txt"), `Aircraft models used by the FinalPing web app
=============================================

The .glb files in this folder are simplified versions of 3D models made by the
FlightGear community (https://www.flightgear.org, aircraft from FGAddon) and by
Flightradar24 (https://github.com/Flightradar24/fr24-3d-models).

Licence: GNU General Public License, version 2 (see COPYING.txt). The original
models are published under that licence and these converted files are offered
under the same licence. You may copy, change and share them on those terms.

What was changed: textures, cockpits and other hidden parts were removed, the
meshes were simplified to about 10,000 triangles, and each model was turned to
face +X and scaled to a common size. The scripts that do this are in the site's
source under scripts/models/.

Models
------
${credits.join("\n\n")}
`);
console.log(`${rows.length} models, ${(bytes / 1048576).toFixed(1)} MB -> ${OUT}`);
