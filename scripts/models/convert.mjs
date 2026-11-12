// Convert every aircraft in a folder of open models into the app's GLB format.
//
//   node scripts/models/convert.mjs --src "<...>/open-models" --out <dir> [--only <regex>] [--shard i/n] [--list] [--names]
//
// Sources understood: flightgear/<group>/<aircraft>/ (AC3D), fr24-3d-models/models/*.glb
// (glTF 1.0) and amvlab-aircraft-models/models/*_nologo.glb (glTF 2.0).

import fs from "node:fs";
import path from "node:path";
import { acParts, gltfParts, makeClassifier, build, writeGLB } from "./lib.mjs";
import { OVERRIDES } from "./overrides.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const SRC = arg("src");
const OUT = arg("out");
const only = arg("only") ? new RegExp(arg("only"), "i") : null;
const shard = arg("shard") ? arg("shard").split("/").map(Number) : null;
if (!SRC || !OUT) { console.error("need --src and --out"); process.exit(1); }

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Find a file whatever the case of its path (FlightGear folders were made on Linux and Windows both). */
function resolveCI(base, rel) {
  let cur = base;
  for (const seg of rel.split(/[\\/]+/).filter(Boolean)) {
    if (seg === ".") continue;
    if (seg === "..") { cur = path.dirname(cur); continue; }
    let names;
    try { names = fs.readdirSync(cur); } catch { return null; }
    const hit = names.find((n) => n === seg) || names.find((n) => n.toLowerCase() === seg.toLowerCase());
    if (!hit) return null;
    cur = path.join(cur, hit);
  }
  return cur;
}

const read = (f) => { try { return fs.readFileSync(f, "latin1"); } catch { return ""; } };
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, "");

// Sub-models that are not part of the aircraft's outside.
const SUB_SKIP = /(interior|cockpit|flight-?deck|panel|instrument|pilot|crew|human|pax|passenger|effect|light|pushback|fuel|ground|service|shadow|contrail|rain|damage|pontoon|skis?[./]|float|bush|tiedown|chock|cover|flag|smoke|fire|vapou?r|particle|marshal|stairs|catering|truck|jetway|tow|banner|sling|immat|regist|radar|hud|generic|winch|hitch|dialog|cdu|mfd|pfd|ecam|eicas|yoke|seat|cabin|galley|lavator|tablet|ipad|gps|garmin|knob|placard|checklist|chart|cart|weapon|missile|bomb|cargo|trailer|wreck|crash|parachute|skydiver|oxygen|headset|tug|operations|followme|baggage|luggage|people|patient|suitcase|rbf|cowlplug|safety|external-?power|extpow|gpu|sprayer|stores|minigun|tvcam|handle|pedal|circuit|primer|magneto|switch|flaptrim|gear[-_]?control|radio|strobe|controlls?\.|overhead|pedestal|jack|glasses|\/(alt|compass|asi|tach|oil|objects|details|rat)\.ac|\.ice\.|blur)/i;

const mul3 = (A, B) => [
  A[0] * B[0] + A[1] * B[3] + A[2] * B[6], A[0] * B[1] + A[1] * B[4] + A[2] * B[7], A[0] * B[2] + A[1] * B[5] + A[2] * B[8],
  A[3] * B[0] + A[4] * B[3] + A[5] * B[6], A[3] * B[1] + A[4] * B[4] + A[5] * B[7], A[3] * B[2] + A[4] * B[5] + A[5] * B[8],
  A[6] * B[0] + A[7] * B[3] + A[8] * B[6], A[6] * B[1] + A[7] * B[4] + A[8] * B[7], A[6] * B[2] + A[7] * B[5] + A[8] * B[8],
];
const cs = (d) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)];
const rotY = (d) => { const [c, s] = cs(d); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rotZ = (d) => { const [c, s] = cs(d); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const rotX = (d) => { const [c, s] = cs(d); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const move = (R, t, v) => [t[0] + R[0] * v[0] + R[1] * v[1] + R[2] * v[2], t[1] + R[3] * v[0] + R[4] * v[1] + R[5] * v[2], t[2] + R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];

/** <offsets> of a FlightGear model, as a rotation and a shift in AC3D axes (x aft, y up, z left). */
function offsetsOf(xml) {
  const m = /<offsets>([\s\S]*?)<\/offsets>/.exec(xml);
  const num = (k) => {
    const r = m && new RegExp("<" + k + "[^>]*>\\s*([-+.\\deE]+)\\s*</" + k + ">").exec(m[1]);
    return r ? parseFloat(r[1]) || 0 : 0;
  };
  return { R: mul3(rotY(-num("heading-deg")), mul3(rotZ(-num("pitch-deg")), rotX(-num("roll-deg")))), t: [num("x-m"), num("z-m"), -num("y-m")] };
}

/** Top-level <model>...</model> blocks of a model XML, and the XML with them cut out. */
function splitModels(xml) {
  const blocks = [];
  let rest = "", depth = 0, start = 0, last = 0;
  const re = /<(\/?)model\b[^>]*?(\/?)>/g;
  let m;
  while ((m = re.exec(xml))) {
    if (m[2]) continue;
    if (!m[1]) { if (depth === 0) { rest += xml.slice(last, m.index); start = m.index; } depth++; }
    else if (depth > 0) { depth--; if (depth === 0) { blocks.push(xml.slice(start, re.lastIndex)); last = re.lastIndex; } }
  }
  rest += xml.slice(last);
  return { blocks, rest };
}

/** Every .ac file that makes up the outside of a FlightGear aircraft, with where each one sits. */
function fgModelFiles(dir) {
  const name = path.basename(dir);
  const sets = fs.readdirSync(dir).filter((f) => /-set\.xml$/i.test(f));
  const score = (f) => (f.toLowerCase() === name.toLowerCase() + "-set.xml" ? 0 : 1000) + f.length;
  sets.sort((a, b) => score(a) - score(b));
  const fromRoot = (p) => resolveCI(dir, p.replace(/^Aircraft\/[^/]+\//i, ""));
  const tried = new Set();
  const candidates = [];
  const collect = (file, depth) => {
    if (depth > 3 || tried.has(file)) return;
    tried.add(file);
    const xml = stripComments(read(file));
    for (const m of xml.matchAll(/<model>\s*<path[^>]*>\s*([^<]+?)\s*<\/path>/g)) candidates.push(m[1]);
    for (const inc of xml.matchAll(/include="([^"]+\.xml)"/g)) {
      const f = resolveCI(path.dirname(file), inc[1]) || fromRoot(inc[1]);
      if (f) collect(f, depth + 1);
    }
  };
  for (const s of sets) collect(path.join(dir, s), 0);

  let out = [];
  const seenFiles = new Set();
  const condAt = new Set();
  const load = (file, R, t, depth) => {
    if (depth > 5) return;
    if (/\.ac$/i.test(file)) {
      const key = file + t.concat(R).map((v) => v.toFixed(3)).join();
      if (!seenFiles.has(key) && !/empty\.ac$/i.test(file)) { seenFiles.add(key); out.push({ file, R, t }); }
      return;
    }
    const { blocks, rest: rest0 } = splitModels(stripComments(read(file)));
    // Only the model's own <offsets> count, not those of lights, labels or particle effects.
    const rest = rest0.replace(/<(particlesystem|text|light|animation|effect|nasal|sound|panel)\b[\s\S]*?<\/\1>/g, "");
    // The top file's own offsets only line the model up with the flight model; they would tilt it here.
    const o = depth === 0 ? { R: I3, t: [0, 0, 0] } : offsetsOf(rest);
    const R1 = mul3(R, o.R);
    const t1 = move(R, t, o.t);
    const here = (p) => resolveCI(path.dirname(file), p) || fromRoot(p);
    const main = /<path[^>]*>\s*([^<]+?\.ac)\s*<\/path>/i.exec(rest);
    if (main) { const f = here(main[1]); if (f && fs.existsSync(f)) load(f, R1, t1, depth + 1); }
    for (const b of blocks) {
      const pm = /<path[^>]*>\s*([^<]+?\.(?:xml|ac))\s*<\/path>/i.exec(b);
      if (!pm) continue;
      const rel = pm[1].replace(/^Aircraft\/[^/]+\//i, "");
      if (/^(Models|Aircraft\/(Generic|Instruments[^/]*))\//i.test(pm[1]) || SUB_SKIP.test(rel)) continue;
      const f = here(pm[1]);
      if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) continue;
      const bo = offsetsOf(b);
      const t2 = move(R1, t1, bo.t);
      if (/<condition>/.test(b)) {
        // Alternatives (engine options and the like) sit in the same place: keep the first.
        const key = t2.map((v) => v.toFixed(2)).join();
        if (condAt.has(key)) continue;
        condAt.add(key);
      }
      load(f, mul3(R1, bo.R), t2, depth + 1);
    }
  };
  for (const c of candidates) {
    const f = fromRoot(c);
    if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) continue;
    out = [];
    load(f, I3, [0, 0, 0], 0);
    if (out.length) return out;
  }
  // Last resort: the biggest .ac that is not obviously the inside.
  let best = null;
  const scan = (d) => {
    for (const n of fs.readdirSync(d)) {
      const f = path.join(d, n);
      const st = fs.statSync(f);
      if (st.isDirectory()) { if (!SUB_SKIP.test(n)) scan(f); }
      else if (/\.ac$/i.test(n) && !SUB_SKIP.test(n) && (!best || st.size > best.size)) best = { file: f, size: st.size };
    }
  };
  const md = resolveCI(dir, "Models");
  if (md) scan(md);
  return best ? [{ file: best.file, R: I3, t: [0, 0, 0], guessed: true }] : null;
}

function catalog() {
  const list = [];
  const fg = path.join(SRC, "flightgear");
  if (fs.existsSync(fg)) for (const group of fs.readdirSync(fg)) {
    const gdir = path.join(fg, group);
    if (!fs.statSync(gdir).isDirectory()) continue;
    for (const a of fs.readdirSync(gdir)) {
      const dir = path.join(gdir, a);
      if (!fs.statSync(dir).isDirectory()) continue;
      list.push({ id: "fg-" + slug(a), kind: "ac", dir, group, heli: group === "helicopters", orient: "fg", source: `flightgear/${group}/${a}` });
    }
  }
  const a320 = path.join(SRC, "A320-family");
  if (fs.existsSync(a320)) list.push({ id: "fg-a320-family", kind: "ac", dir: a320, group: "airliners", orient: "fg", source: "A320-family" });
  const fr = path.join(SRC, "fr24-3d-models", "models");
  if (fs.existsSync(fr)) for (const f of fs.readdirSync(fr)) {
    if (!/\.glb$/i.test(f)) continue;
    const n = f.replace(/\.glb$/i, "");
    list.push({ id: "fr-" + slug(n), kind: "gltf", files: [path.join(fr, f)], heli: n === "heli", orient: "auto", source: `fr24-3d-models/models/${f}` });
  }
  const am = path.join(SRC, "amvlab-aircraft-models", "models");
  if (fs.existsSync(am)) for (const f of fs.readdirSync(am)) {
    if (!/_nologo\.glb$/i.test(f)) continue;
    const n = f.replace(/_nologo\.glb$/i, "");
    list.push({ id: "amv-" + slug(n), kind: "gltf", files: [path.join(am, f)], orient: "auto", source: `amvlab-aircraft-models/models/${f}` });
  }
  return list;
}

const all = catalog().filter((e) => !only || only.test(e.id));
fs.mkdirSync(OUT, { recursive: true });
const report = [];
const LIST = process.argv.includes("--list"), NAMES = process.argv.includes("--names");
let n = 0;
for (const [i, e0] of all.entries()) {
  if (shard && i % shard[1] !== shard[0]) continue;
  const o = OVERRIDES[e0.id] || {};
  if (o.skip) { report.push({ id: e0.id, skipped: o.skip }); continue; }
  const e = { ...e0, ...o };
  const t0 = Date.now();
  try {
    let files = e.files;
    if (e.kind === "ac") {
      files = e.ac ? e.ac.map((f) => ({ file: resolveCI(e.dir, f), R: I3, t: [0, 0, 0] })) : fgModelFiles(e.dir);
      if (!files || files.some((f) => !f.file)) throw new Error("main model not found");
      for (const f of e.also || []) files.push({ file: resolveCI(e.dir, f), R: I3, t: [0, 0, 0] });
      if (e.not) files = files.filter((f) => !e.not.test(path.relative(e.dir, f.file)));
    }
    const rel = (f) => (f.guessed ? "(guess) " : "") + path.relative(e.dir || SRC, f.file || f);
    if (LIST) { console.log(e.id.padEnd(30), files.map(rel).join(" + ")); continue; }
    const classify = makeClassifier({ heli: e.heli, drop: e.drop, keep: e.keep, noSpin: e.noSpin });
    let parts = [];
    for (const f of files) parts = parts.concat(e.kind === "ac" ? acParts(f.file, classify, f.R, f.t, path.relative(e.dir, f.file).split(path.sep).join("/").replace(/\.ac$/i, "")) : gltfParts(f, classify));
    if (NAMES) {
      // Biggest things first, with their size, to spot what does not belong.
      const rows = parts.map((p) => {
        let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
        for (const v of p.idx) for (let k = 0; k < 3; k++) { const q = p.pos[v * 3 + k]; if (q < lo[k]) lo[k] = q; if (q > hi[k]) hi[k] = q; }
        return { k: p.name + " [" + p.cls + (p.ax || "") + "]", n: p.idx.length / 3, d: Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]), c: lo.map((v, i) => ((v + hi[i]) / 2).toFixed(1)).join(",") };
      }).sort((x, y) => y.d - x.d);
      const want = arg("grep") ? new RegExp(arg("grep"), "i") : null;
      for (const r of rows.filter((r) => !want || want.test(r.k)).slice(0, +arg("top", 14))) console.log(String(r.n).padStart(7), r.d.toFixed(1).padStart(7), ("@" + r.c).padEnd(18), r.k);
      continue;
    }
    const model = await build(parts, e);
    const file = path.join(OUT, e.id + ".glb");
    writeGLB(file, model, { source: e.source });
    const kb = Math.round(fs.statSync(file).size / 1024);
    report.push({ id: e.id, ok: true, kb, ...model.meta, log: model.log, from: files.map(rel) });
    console.log(`${e.id.padEnd(30)} ${String(model.meta.tris).padStart(6)} tris ${String(kb).padStart(4)} KB ${((Date.now() - t0) / 1000).toFixed(1)}s  ${model.log.join(" | ")}`);
    n++;
  } catch (err) {
    report.push({ id: e.id, error: String(err.message || err) });
    console.log(`${e.id.padEnd(30)} FAILED: ${err.message || err}`);
  }
}
if (!LIST && !NAMES) {
  fs.writeFileSync(path.join(OUT, `report${shard ? "-" + shard[0] : ""}.json`), JSON.stringify(report, null, 1));
  console.log(`${n} converted`);
}
