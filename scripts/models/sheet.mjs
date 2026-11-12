// Draw contact sheets of converted models, for checking them by eye.
//   node scripts/models/sheet.mjs --in <dir of .glb> --out <dir for .png> [--only <regex>]
// Each aircraft is shown from above (nose should point right) and from the front quarter.
// Glass is blue and spinning parts red so mistakes stand out; the sky-blue areas are where paint goes.

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { readOwn, raster, viewBasis } from "./lib.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const IN = arg("in"), OUT = arg("out");
const only = arg("only") ? new RegExp(arg("only"), "i") : null;
const BIG = process.argv.includes("--big");
const CW = BIG ? 400 : 200, CH = BIG ? 300 : 150, COLS = BIG ? 2 : 4, ROWS = BIG ? 3 : 5, LABEL = 16;
const COLORS = { body: [232, 232, 232], glass: [60, 110, 170], trim: [70, 70, 70], spin: [220, 60, 60] };
const PAINT = [56, 189, 248];

function drawView(img, W, ox, oy, model, basis) {
  const pos = [], idx = [], col = [];
  let base = 0;
  const m = model.meta;
  for (const mesh of model.meshes) {
    for (const v of mesh.pos) pos.push(v);
    for (let i = 0; i < mesh.idx.length; i += 3) {
      const a = mesh.idx[i], b = mesh.idx[i + 1], c = mesh.idx[i + 2];
      idx.push(a + base, b + base, c + base);
      let rgb = COLORS[mesh.name] || COLORS.body;
      if (mesh.name === "body") {
        const cx = (mesh.pos[a * 3] + mesh.pos[b * 3] + mesh.pos[c * 3]) / 3;
        const cy = (mesh.pos[a * 3 + 1] + mesh.pos[b * 3 + 1] + mesh.pos[c * 3 + 1]) / 3;
        const cz = (mesh.pos[a * 3 + 2] + mesh.pos[b * 3 + 2] + mesh.pos[c * 3 + 2]) / 3;
        if (cx < m.tailX || cx > m.noseX || (Math.abs(cy - m.stripeY) < m.stripeH && Math.abs(cz) < m.fuseZ)) rgb = PAINT;
      }
      col.push(rgb);
    }
    base += mesh.pos.length / 3;
  }
  const P = Float32Array.from(pos), I = Uint32Array.from(idx);
  const res = CH;
  const light = [0.35, 0.8, 0.45];
  const ll = Math.hypot(...light);
  const { ib } = raster(P, I, basis, res, [0, 0, 0], 1.3);
  const shade = new Float32Array(I.length / 3);
  for (let t = 0; t < shade.length; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    shade[t] = 0.45 + 0.55 * Math.abs((nx * light[0] + ny * light[1] + nz * light[2]) / (nl * ll));
  }
  const pad = (CW - res) / 2;
  for (let y = 0; y < res; y++) for (let x = 0; x < res; x++) {
    const t = ib[y * res + x];
    if (t < 0) continue;
    const o = ((oy + y) * W + ox + pad + x) * 3;
    img[o] = col[t][0] * shade[t]; img[o + 1] = col[t][1] * shade[t]; img[o + 2] = col[t][2] * shade[t];
  }
}

const files = fs.readdirSync(IN).filter((f) => f.endsWith(".glb") && (!only || only.test(f))).sort();
fs.mkdirSync(OUT, { recursive: true });
const per = COLS * ROWS;
const cellW = CW * 2, cellH = CH + LABEL;
for (let s = 0; s * per < files.length; s++) {
  const W = cellW * COLS, H = cellH * ROWS;
  const img = Buffer.alloc(W * H * 3, 18);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  files.slice(s * per, (s + 1) * per).forEach((f, i) => {
    const ox = (i % COLS) * cellW, oy = Math.floor(i / COLS) * cellH;
    let model;
    try { model = readOwn(path.join(IN, f)); } catch { return; }
    drawView(img, W, ox, oy + LABEL, model, viewBasis([0, 1, 0], [0, 0, -1]));
    drawView(img, W, ox + CW, oy + LABEL, model, viewBasis([0.62, 0.42, 0.66]));
    const kb = Math.round(fs.statSync(path.join(IN, f)).size / 1024);
    svg += `<text x="${ox + 4}" y="${oy + 12}" font-family="Consolas, monospace" font-size="12" fill="#ddd">${f.replace(".glb", "")}  ${model.meta.tris}t ${kb}KB ${model.meta.spins ? "spin" + model.meta.spins : ""}</text>`;
    svg += `<rect x="${ox}" y="${oy}" width="${cellW}" height="${cellH}" fill="none" stroke="#333"/>`;
  });
  svg += "</svg>";
  const out = path.join(OUT, `sheet-${String(s + 1).padStart(2, "0")}.png`);
  await sharp(img, { raw: { width: W, height: H, channels: 3 } }).composite([{ input: Buffer.from(svg) }]).png().toFile(out);
  console.log(out);
}
