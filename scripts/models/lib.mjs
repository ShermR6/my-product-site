// Turns open aircraft models (FlightGear AC3D, glTF 1.0 and 2.0) into the small
// untextured GLB files the web app draws. For each aircraft it keeps only what
// can be seen from outside, sorts the surfaces into body / glass / trim / spinning
// parts, reduces the triangle count, and scales everything to one standard frame:
// nose +X, up +Y, right wing +Z, 2.2 units across the larger of length and span.

import fs from "node:fs";
import path from "node:path";
import { MeshoptSimplifier } from "meshoptimizer";

export const K = 1.2; // positions are stored as int16 / 32767 * K

// ---------------------------------------------------------------- AC3D

export function parseAC(buf) {
  const text = buf.toString("latin1");
  const len = text.length;
  let pos = 0;
  const line = () => {
    if (pos >= len) return null;
    let e = text.indexOf("\n", pos);
    if (e < 0) e = len;
    let s = text.slice(pos, e);
    pos = e + 1;
    if (s.charCodeAt(s.length - 1) === 13) s = s.slice(0, -1);
    return s;
  };
  const head = line();
  if (!head || !head.startsWith("AC3D")) throw new Error("not an AC3D file");
  const materials = [];
  const unq = (s) => (s.startsWith('"') ? s.slice(1, s.lastIndexOf('"')) : s);

  function object(first) {
    const o = { type: first.split(/\s+/)[1] || "", name: "", tex: false, loc: [0, 0, 0], rot: null, verts: null, surfs: [], kids: [] };
    for (;;) {
      const l = line();
      if (l == null) return o;
      const sp = l.indexOf(" ");
      const key = sp < 0 ? l : l.slice(0, sp);
      const rest = sp < 0 ? "" : l.slice(sp + 1).trim();
      if (key === "name") o.name = unq(rest);
      else if (key === "data") { pos += parseInt(rest, 10); line(); }
      else if (key === "texture") { if (unq(rest.split(/\s+/)[0] || "") !== "empty_texture_no_mapping") o.tex = true; }
      else if (key === "loc") o.loc = rest.split(/\s+/).map(Number);
      else if (key === "rot") o.rot = rest.split(/\s+/).map(Number);
      else if (key === "numvert") {
        const n = parseInt(rest, 10);
        const v = new Float64Array(n * 3);
        for (let i = 0; i < n; i++) {
          const p = line().trim().split(/\s+/);
          v[i * 3] = +p[0]; v[i * 3 + 1] = +p[1]; v[i * 3 + 2] = +p[2];
        }
        o.verts = v;
      } else if (key === "numsurf") {
        const n = parseInt(rest, 10);
        for (let i = 0; i < n; i++) {
          const s = { flags: 0, mat: 0, refs: null };
          for (;;) {
            const sl = line();
            if (sl == null) break;
            if (sl.startsWith("SURF")) s.flags = parseInt(sl.slice(4).trim(), 16) || 0;
            else if (sl.startsWith("mat")) s.mat = parseInt(sl.slice(3), 10) || 0;
            else if (sl.startsWith("refs")) {
              const rn = parseInt(sl.slice(4), 10);
              const r = new Int32Array(rn);
              for (let k = 0; k < rn; k++) r[k] = parseInt(line(), 10);
              s.refs = r;
              break;
            }
          }
          o.surfs.push(s);
        }
      } else if (key === "kids") {
        const n = parseInt(rest, 10);
        for (let i = 0; i < n; i++) {
          let l2 = line();
          while (l2 != null && !l2.startsWith("OBJECT")) l2 = line();
          if (l2 == null) break;
          o.kids.push(object(l2));
        }
        return o;
      }
    }
  }

  let root = null;
  for (;;) {
    const l = line();
    if (l == null) break;
    if (l.startsWith("MATERIAL")) {
      const m = /^MATERIAL\s+("[^"]*"|\S+)\s+rgb\s+(\S+)\s+(\S+)\s+(\S+).*?trans\s+(\S+)/.exec(l);
      materials.push(m ? { name: unq(m[1]), rgb: [+m[2], +m[3], +m[4]], trans: +m[5] } : { name: "", rgb: [1, 1, 1], trans: 0 });
    } else if (l.startsWith("MAT ")) {
      const m = { name: unq(l.slice(4).trim()), rgb: [1, 1, 1], trans: 0 };
      for (;;) {
        const ml = line();
        if (ml == null || ml.startsWith("ENDMAT")) break;
        const t = ml.trim().split(/\s+/);
        if (t[0] === "rgb") m.rgb = [+t[1], +t[2], +t[3]];
        if (t[0] === "trans") m.trans = +t[1];
      }
      materials.push(m);
    } else if (l.startsWith("OBJECT")) {
      root = object(l);
      break;
    }
  }
  return { materials, root };
}

/** Flatten an AC3D file into raw parts: one per object and material, in file coordinates. */
export function acParts(file, classify, R0 = [1, 0, 0, 0, 1, 0, 0, 0, 1], t0 = [0, 0, 0], prefix = null) {
  const { materials, root } = parseAC(fs.readFileSync(file));
  const parts = [];
  if (!root) return parts;
  const walk = (o, names, R, t) => {
    // world = R * local + t
    let R2 = R, t2 = t;
    const l = o.loc;
    t2 = [t[0] + R[0] * l[0] + R[1] * l[1] + R[2] * l[2], t[1] + R[3] * l[0] + R[4] * l[1] + R[5] * l[2], t[2] + R[6] * l[0] + R[7] * l[1] + R[8] * l[2]];
    if (o.rot && o.rot.length === 9) {
      const r = o.rot;
      R2 = [
        R[0] * r[0] + R[1] * r[3] + R[2] * r[6], R[0] * r[1] + R[1] * r[4] + R[2] * r[7], R[0] * r[2] + R[1] * r[5] + R[2] * r[8],
        R[3] * r[0] + R[4] * r[3] + R[5] * r[6], R[3] * r[1] + R[4] * r[4] + R[5] * r[7], R[3] * r[2] + R[4] * r[5] + R[5] * r[8],
        R[6] * r[0] + R[7] * r[3] + R[8] * r[6], R[6] * r[1] + R[7] * r[4] + R[8] * r[7], R[6] * r[2] + R[7] * r[5] + R[8] * r[8],
      ];
    }
    const full = names ? names + "/" + o.name : o.name;
    if (o.verts && o.surfs.length) {
      const n = o.verts.length / 3;
      const w = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const x = o.verts[i * 3], y = o.verts[i * 3 + 1], z = o.verts[i * 3 + 2];
        w[i * 3] = R2[0] * x + R2[1] * y + R2[2] * z + t2[0];
        w[i * 3 + 1] = R2[3] * x + R2[4] * y + R2[5] * z + t2[1];
        w[i * 3 + 2] = R2[6] * x + R2[7] * y + R2[8] * z + t2[2];
      }
      const byMat = new Map();
      for (const s of o.surfs) {
        if ((s.flags & 0xf) !== 0 || !s.refs || s.refs.length < 3) continue; // lines
        let a = byMat.get(s.mat);
        if (!a) byMat.set(s.mat, (a = []));
        for (let k = 1; k + 1 < s.refs.length; k++) a.push(s.refs[0], s.refs[k], s.refs[k + 1]);
      }
      for (const [mi, idx] of byMat) {
        const m = materials[mi] || { name: "", rgb: [1, 1, 1], trans: 0 };
        const c = classify({ name: full, own: o.name, mat: m.name, rgb: m.rgb, alpha: 1 - m.trans, tex: o.tex });
        if (c) parts.push({ name: full, ...c, pos: w, idx: Uint32Array.from(idx) });
      }
    }
    for (const k of o.kids) walk(k, full, R2, t2);
  };
  walk(root, prefix ?? path.basename(file).replace(/\.ac$/i, ""), R0, t0);
  return parts;
}

// ---------------------------------------------------------------- glTF 1.0 / 2.0

const mul4 = (a, b) => {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
};
function trs(n) {
  if (n.matrix) return n.matrix;
  const t = n.translation || [0, 0, 0], q = n.rotation || [0, 0, 0, 1], s = n.scale || [1, 1, 1];
  const [x, y, z, w] = q;
  return [
    (1 - 2 * (y * y + z * z)) * s[0], 2 * (x * y + z * w) * s[0], 2 * (x * z - y * w) * s[0], 0,
    2 * (x * y - z * w) * s[1], (1 - 2 * (x * x + z * z)) * s[1], 2 * (y * z + x * w) * s[1], 0,
    2 * (x * z + y * w) * s[2], 2 * (y * z - x * w) * s[2], (1 - 2 * (x * x + y * y)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ];
}

export function gltfParts(file, classify) {
  const buf = fs.readFileSync(file);
  let doc, body = null;
  if (buf.readUInt32LE(0) === 0x46546c67) {
    const ver = buf.readUInt32LE(4);
    if (ver === 1) {
      const clen = buf.readUInt32LE(12);
      doc = JSON.parse(buf.toString("utf8", 20, 20 + clen));
      body = buf.subarray(20 + clen);
    } else {
      let off = 12;
      while (off < buf.length) {
        const cl = buf.readUInt32LE(off), ct = buf.readUInt32LE(off + 4);
        if (ct === 0x4e4f534a) doc = JSON.parse(buf.toString("utf8", off + 8, off + 8 + cl));
        else if (ct === 0x004e4942) body = buf.subarray(off + 8, off + 8 + cl);
        off += 8 + cl;
      }
    }
  } else doc = JSON.parse(buf.toString("utf8"));
  const get = (table, id) => (table ? table[id] : undefined);
  const buffers = new Map();
  const bufferOf = (id) => {
    if (buffers.has(id)) return buffers.get(id);
    const b = get(doc.buffers, id);
    let data;
    if (!b || !b.uri || id === "binary_glTF") data = body;
    else if (b.uri.startsWith("data:")) data = Buffer.from(b.uri.slice(b.uri.indexOf(",") + 1), "base64");
    else data = fs.readFileSync(path.join(path.dirname(file), decodeURIComponent(b.uri)));
    buffers.set(id, data);
    return data;
  };
  const SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  const accessor = (id) => {
    const a = get(doc.accessors, id);
    const bv = get(doc.bufferViews, a.bufferView);
    const data = bufferOf(bv.buffer);
    const n = SIZE[a.type], ct = a.componentType;
    const cs = ct === 5126 || ct === 5125 ? 4 : ct === 5123 || ct === 5122 ? 2 : 1;
    const stride = bv.byteStride || a.byteStride || n * cs;
    const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const out = ct === 5126 ? new Float32Array(a.count * n) : new Uint32Array(a.count * n);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) {
      const o = base + i * stride + k * cs;
      out[i * n + k] = ct === 5126 ? data.readFloatLE(o) : ct === 5125 ? data.readUInt32LE(o) : ct === 5123 ? data.readUInt16LE(o) : ct === 5122 ? data.readInt16LE(o) : data.readUInt8(o);
    }
    return out;
  };
  const matInfo = (id) => {
    const m = get(doc.materials, id) || {};
    let rgb = [1, 1, 1], alpha = 1, tex = false;
    if (m.values) { // glTF 1.0
      const d = m.values.diffuse;
      if (Array.isArray(d)) { rgb = d.slice(0, 3); if (d.length > 3) alpha = d[3]; } else if (d != null) tex = true;
      if (typeof m.values.transparency === "number") alpha = Math.min(alpha, m.values.transparency);
    } else if (m.pbrMetallicRoughness || m.alphaMode) {
      const p = m.pbrMetallicRoughness || {};
      if (p.baseColorFactor) { rgb = p.baseColorFactor.slice(0, 3); alpha = p.baseColorFactor[3]; }
      if (p.baseColorTexture) tex = true;
      if (m.alphaMode !== "BLEND") alpha = 1;
    }
    return { mat: m.name || String(id), rgb, alpha, tex };
  };
  const parts = [];
  const visit = (id, M, names) => {
    const n = get(doc.nodes, id);
    if (!n) return;
    const W = mul4(M, trs(n));
    const full = names + "/" + (n.name || id);
    const meshIds = n.meshes || (n.mesh != null ? [n.mesh] : []);
    for (const mid of meshIds) {
      const mesh = get(doc.meshes, mid);
      for (const p of mesh.primitives || []) {
        if (p.mode != null && p.mode !== 4) continue;
        const src = accessor(p.attributes.POSITION);
        const nv = src.length / 3;
        const pos = new Float32Array(nv * 3);
        for (let i = 0; i < nv; i++) {
          const x = src[i * 3], y = src[i * 3 + 1], z = src[i * 3 + 2];
          pos[i * 3] = W[0] * x + W[4] * y + W[8] * z + W[12];
          pos[i * 3 + 1] = W[1] * x + W[5] * y + W[9] * z + W[13];
          pos[i * 3 + 2] = W[2] * x + W[6] * y + W[10] * z + W[14];
        }
        let idx;
        if (p.indices != null) idx = Uint32Array.from(accessor(p.indices));
        else { idx = new Uint32Array(nv); for (let i = 0; i < nv; i++) idx[i] = i; }
        const mi = matInfo(p.material);
        const name = full + "/" + (mesh.name || mid);
        const c = classify({ name, own: n.name || mesh.name || String(mid), ...mi });
        if (c) parts.push({ name, ...c, pos, idx });
      }
    }
    for (const c of n.children || []) visit(c, W, full);
  };
  const scene = get(doc.scenes, doc.scene != null ? doc.scene : Object.keys(doc.scenes || {})[0]);
  const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  for (const r of (scene && scene.nodes) || []) visit(r, I, "");
  return parts;
}

// ---------------------------------------------------------------- sorting surfaces

// Things that are visible from outside but are not the aircraft as it flies.
const DROP = /(disc|disk|blur|shadow|pontoon|amphib|chock|tie[-_ ]?down|(pitot|intake|inlet|engine|canopy|prop|static|wind\w*)[-_. ]?cover|remove.?before|pushback|contrail|vapou?r|smoke|halo|glow|flare|light.?cone|lightbeam|light[-_. ]beam|hotspot|clickspot|pickspot|collision|crash|damage|wreck|broken|tundra|tow.?bar|ladder|stairs|raindrop|frost|splash|flame|marshal|truck|trafficcone|banner|parking.?brake.?flag|immat|pilot|human|passenger|crewmember|propfast|fast.?prop|prop.?fast|rotor.?fast|fast.?rotor|slowprop|light[-_. ]?spot|lnd\.spot|[._]spot$|landing_cone|taxi_cone|light_cone|\.cs(\.\w+)?$|(^|\/)plane(\.\d+)?x$|(strobe|beacon|light|courtesy|nav|lamp|landing|taxi)\w*?o(n|ff)x?$)/i;
const DROP_TOKENS = new Set(["float", "floats", "ski", "skis", "gpu", "fire", "wake", "man", "woman", "guy", "guys", "fast", "ground", "rain", "dust", "cover", "covers", "flag", "flags", "rbf", "person", "crew", "bush", "skid_shadow", "effect", "effects", "vortex", "fog", "ice", "snow"]);
const KEEP = /(door|window|glass|hatch|step|canopy|windshield|windscreen)/i;
const GLASS = /(glass|window|windshield|windscreen|canopy|vitre|verriere|fenster|scheibe|hublot|plexi)/i;
const TRIM = /(tire|tyre|rubber|\bwheel(?!.?(pant|fairing|door|well|spat|cover))|antenn|exhaust|pitot)/i;
const PROP = /(propell|(^|[^a-z])props?([^a-z]|$)|blade|helice|airscrew|luftschraube)/i;
const ROTOR_T = /(tail[-_. ]?rotor|rear[-_. ]?rotor|rotor[-_. ]?(tail|rear)|trotor|heckrotor|fenestron|antitorque|tr[-_. ]?blade|(^|[\/_. -])t[-_.]?blade)/i;
const ROTOR_M = /(main[-_. ]?rotor|rotor[-_. ]?main|mrotor|hauptrotor|mr[-_. ]?blade|rotor|pales?)/i;

const tokens = (s) => s.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/[^a-z]+/).filter(Boolean);

/** Decide what a surface is. Returns null to leave it out. opts: { heli, drop, keep, noSpin } */
export function makeClassifier(opts = {}) {
  return (s) => {
    const name = s.name;
    if (opts.keep && opts.keep.test(name)) { /* forced in */ }
    else {
      if (opts.drop && opts.drop.test(name)) return null;
      const people = /(pilot|human|passenger|crew|person|man|woman|guy)/i;
      if (DROP.test(name) && !(KEEP.test(s.own) && people.test(name) && !/(disc|disk|blur|shadow)/i.test(name))) return null;
      for (const t of tokens(name)) if (DROP_TOKENS.has(t) && !KEEP.test(s.own)) return null;
    }
    const own = s.own + " " + (s.mat || "");
    if (!opts.noSpin) {
      const fixed = /(hub|mast|shaft|head|swash|link|rod|damper|cap|axe|gearbox|drive|guard|wiper)/i.test(s.own);
      if (opts.heli && !fixed && ROTOR_T.test(name)) return { cls: "spin", ax: "z" };
      if (opts.heli && !fixed && (ROTOR_M.test(name) || /blade/i.test(s.own))) return { cls: "spin", ax: "y" };
      if (!opts.heli && PROP.test(s.own) && !/(hub|spinner|cone|governor|lever|control|knob|gear|shaft|de.?ice)/i.test(s.own)) return { cls: "spin", ax: "x" };
    }
    if (s.alpha < 0.75 || GLASS.test(own)) return { cls: "glass" };
    const lum = 0.2126 * s.rgb[0] + 0.7152 * s.rgb[1] + 0.0722 * s.rgb[2];
    if (TRIM.test(own) || (!s.tex && lum < 0.13)) return { cls: "trim" };
    return { cls: "body" };
  };
}

// ---------------------------------------------------------------- geometry helpers

function bboxOf(pos, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]) {
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) {
    const v = pos[i + k];
    if (v < lo[k]) lo[k] = v;
    if (v > hi[k]) hi[k] = v;
  }
  return { lo, hi };
}

/** Merge parts into one indexed mesh with vertices welded by position. tri[i] keeps the part number. */
function weld(parts, eps) {
  const map = new Map();
  const pos = [];
  let nt = 0;
  for (const p of parts) nt += p.idx.length / 3;
  const idx = new Uint32Array(nt * 3);
  const owner = new Uint32Array(nt);
  let w = 0, t = 0;
  parts.forEach((p, pi) => {
    const remap = new Int32Array(p.pos.length / 3).fill(-1);
    const id = (i) => {
      if (remap[i] >= 0) return remap[i];
      const x = p.pos[i * 3], y = p.pos[i * 3 + 1], z = p.pos[i * 3 + 2];
      const key = Math.round(x / eps) + "," + Math.round(y / eps) + "," + Math.round(z / eps);
      let v = map.get(key);
      if (v === undefined) { v = pos.length / 3; pos.push(x, y, z); map.set(key, v); }
      return (remap[i] = v);
    };
    for (let i = 0; i < p.idx.length; i += 3) {
      const a = id(p.idx[i]), b = id(p.idx[i + 1]), c = id(p.idx[i + 2]);
      if (a === b || b === c || a === c) continue;
      idx[w++] = a; idx[w++] = b; idx[w++] = c;
      owner[t++] = pi;
    }
  });
  return { pos: Float32Array.from(pos), idx: idx.subarray(0, w), owner: owner.subarray(0, t) };
}

/** Connected pieces: comp[t] for every triangle; triangles of different groups never join. */
function components(nv, idx, group) {
  const nt = idx.length / 3;
  const parent = new Int32Array(nt);
  for (let i = 0; i < nt; i++) parent[i] = i;
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  const first = new Map(); // vertex + group -> a triangle
  for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) {
    const key = idx[t * 3 + k] * 64 + group[t];
    const o = first.get(key);
    if (o === undefined) first.set(key, t);
    else { const a = find(o), b = find(t); if (a !== b) parent[a] = b; }
  }
  const ids = new Map();
  const comp = new Int32Array(nt);
  for (let t = 0; t < nt; t++) {
    const r = find(t);
    let c = ids.get(r);
    if (c === undefined) { c = ids.size; ids.set(r, c); }
    comp[t] = c;
  }
  return { comp, count: ids.size };
}

// A small orthographic z-buffer renderer. Used to find what is visible from
// outside, and to draw the contact sheets.
export function viewBasis(dir, up = [0, 1, 0]) {
  const n = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = n(dir); // from the model towards the eye
  let r = cross(up, f);
  if (Math.hypot(r[0], r[1], r[2]) < 1e-4) r = cross([1, 0, 0], f);
  r = n(r);
  const u = cross(f, r);
  return { r, u, f };
}

export function raster(pos, idx, basis, res, centre, radius, onPixel) {
  const { r, u, f } = basis;
  const nv = pos.length / 3;
  const sx = new Float32Array(nv), sy = new Float32Array(nv), sz = new Float32Array(nv);
  const k = (res * 0.5) / radius;
  for (let i = 0; i < nv; i++) {
    const x = pos[i * 3] - centre[0], y = pos[i * 3 + 1] - centre[1], z = pos[i * 3 + 2] - centre[2];
    sx[i] = (x * r[0] + y * r[1] + z * r[2]) * k + res * 0.5;
    sy[i] = res * 0.5 - (x * u[0] + y * u[1] + z * u[2]) * k;
    sz[i] = x * f[0] + y * f[1] + z * f[2];
  }
  const zb = new Float32Array(res * res).fill(-Infinity);
  const ib = new Int32Array(res * res).fill(-1);
  const nt = idx.length / 3;
  for (let t = 0; t < nt; t++) {
    const a = idx[t * 3], b = idx[t * 3 + 1], c = idx[t * 3 + 2];
    const x0 = sx[a], y0 = sy[a], x1 = sx[b], y1 = sy[b], x2 = sx[c], y2 = sy[c];
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (area === 0) continue;
    let minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))), maxX = Math.min(res - 1, Math.ceil(Math.max(x0, x1, x2)));
    let minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))), maxY = Math.min(res - 1, Math.ceil(Math.max(y0, y1, y2)));
    const inv = 1 / area;
    for (let py = minY; py <= maxY; py++) {
      const cy = py + 0.5;
      for (let px = minX; px <= maxX; px++) {
        const cx = px + 0.5;
        const w0 = ((x1 - cx) * (y2 - cy) - (x2 - cx) * (y1 - cy)) * inv;
        const w1 = ((x2 - cx) * (y0 - cy) - (x0 - cx) * (y2 - cy)) * inv;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * sz[a] + w1 * sz[b] + w2 * sz[c];
        const o = py * res + px;
        if (z > zb[o]) { zb[o] = z; ib[o] = t; }
      }
    }
  }
  if (onPixel) for (let o = 0; o < ib.length; o++) if (ib[o] >= 0) onPixel(ib[o], o);
  return { ib, zb, sx, sy };
}

function sphereDirs() {
  const t = (1 + Math.sqrt(5)) / 2;
  const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const out = v.map((p) => p.slice());
  for (const [a, b, c] of f) for (const [i, j] of [[a, b], [b, c], [c, a]]) out.push([v[i][0] + v[j][0], v[i][1] + v[j][1], v[i][2] + v[j][2]]);
  out.push([0.31, 1, 0.17], [0.31, -1, 0.17], [1, 0.02, 0.01], [-1, 0.02, 0.01], [0.01, 0.02, 1], [0.01, 0.02, -1]);
  return out;
}
const DIRS = sphereDirs();

/** Normals that stay sharp across edges steeper than the crease angle. Returns split vertices. */
function creased(pos, idx, creaseDeg) {
  const nt = idx.length / 3;
  const fn = new Float32Array(nt * 3); // area-weighted face normals
  for (let t = 0; t < nt; t++) {
    const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    fn[t * 3] = uy * vz - uz * vy; fn[t * 3 + 1] = uz * vx - ux * vz; fn[t * 3 + 2] = ux * vy - uy * vx;
  }
  const nv = pos.length / 3;
  const start = new Uint32Array(nv + 1);
  for (let i = 0; i < idx.length; i++) start[idx[i] + 1]++;
  for (let i = 0; i < nv; i++) start[i + 1] += start[i];
  const fill = start.slice(0, nv);
  const adj = new Uint32Array(idx.length);
  for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) adj[fill[idx[t * 3 + k]]++] = t;
  const cosC = Math.cos((creaseDeg * Math.PI) / 180);
  const outPos = [], outNrm = [], outIdx = new Uint32Array(idx.length);
  const seen = new Map();
  for (let t = 0; t < nt; t++) {
    const nx = fn[t * 3], ny = fn[t * 3 + 1], nz = fn[t * 3 + 2];
    const nl = Math.hypot(nx, ny, nz) || 1;
    for (let k = 0; k < 3; k++) {
      const v = idx[t * 3 + k];
      let sx = 0, sy = 0, sz = 0;
      for (let j = start[v]; j < start[v + 1]; j++) {
        const o = adj[j];
        const ox = fn[o * 3], oy = fn[o * 3 + 1], oz = fn[o * 3 + 2];
        const ol = Math.hypot(ox, oy, oz);
        if (!ol) continue;
        const d = (ox * nx + oy * ny + oz * nz) / (ol * nl);
        // Models are two-sided, so a neighbour facing the other way still belongs to the same smooth surface.
        if (o === t || d > cosC) { sx += ox; sy += oy; sz += oz; }
      }
      const l = Math.hypot(sx, sy, sz) || 1;
      const qx = Math.round((sx / l) * 127), qy = Math.round((sy / l) * 127), qz = Math.round((sz / l) * 127);
      const key = v + ":" + qx + "," + qy + "," + qz;
      let id = seen.get(key);
      if (id === undefined) {
        id = outPos.length / 3;
        outPos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
        outNrm.push(qx, qy, qz);
        seen.set(key, id);
      }
      outIdx[t * 3 + k] = id;
    }
  }
  return { pos: Float32Array.from(outPos), nrm: Int8Array.from(outNrm), idx: outIdx };
}

function compact(pos, idx) {
  const remap = new Int32Array(pos.length / 3).fill(-1);
  const out = [];
  const ni = new Uint32Array(idx.length);
  for (let i = 0; i < idx.length; i++) {
    const v = idx[i];
    if (remap[v] < 0) { remap[v] = out.length / 3; out.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); }
    ni[i] = remap[v];
  }
  return { pos: Float32Array.from(out), idx: ni };
}

// ---------------------------------------------------------------- the pipeline

const ORIENT = {
  // FlightGear: nose -X, up +Y, left wing +Z.
  fg: [-1, 0, 0, 0, 1, 0, 0, 0, -1],
  // Already nose +X, up +Y.
  none: [1, 0, 0, 0, 1, 0, 0, 0, 1],
  flip: [-1, 0, 0, 0, 1, 0, 0, 0, -1],
  // Nose +Z or -Z, up +Y.
  "z+": [0, 0, 1, 0, 1, 0, -1, 0, 0],
  "z-": [0, 0, -1, 0, 1, 0, 1, 0, 0],
  // Z up (Blender): nose along -Y / +Y / +X / -X.
  "zup-y-": [0, -1, 0, 0, 0, 1, -1, 0, 0],
  "zup-y+": [0, 1, 0, 0, 0, 1, 1, 0, 0],
  "zup-x+": [1, 0, 0, 0, 0, 1, 0, -1, 0],
  "zup-x-": [-1, 0, 0, 0, 0, 1, 0, 1, 0],
};

function applyMat(parts, M) {
  for (const p of parts) {
    if (p._done) continue;
    const a = p.pos;
    for (let i = 0; i < a.length; i += 3) {
      const x = a[i], y = a[i + 1], z = a[i + 2];
      a[i] = M[0] * x + M[1] * y + M[2] * z;
      a[i + 1] = M[3] * x + M[4] * y + M[5] * z;
      a[i + 2] = M[6] * x + M[7] * y + M[8] * z;
    }
    p._done = true;
  }
  for (const p of parts) delete p._done;
}

/** Guess which way the nose points, for sources with no fixed convention. Returns a note. */
function autoOrient(parts, heli) {
  const body = parts.filter((p) => p.cls !== "spin");
  const { lo, hi } = body.reduce((b, p) => bboxOf(p.pos, b.lo, b.hi), { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] });
  const ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  const mid = [(hi[0] + lo[0]) / 2, (hi[1] + lo[1]) / 2, (hi[2] + lo[2]) / 2];
  const c = [0, 0, 0];
  let n = 0;
  const topX = [0, 0];
  for (const p of body) for (let i = 0; i < p.pos.length; i += 3) {
    c[0] += p.pos[i]; c[1] += p.pos[i + 1]; c[2] += p.pos[i + 2]; n++;
  }
  c[0] /= n; c[1] /= n; c[2] /= n;
  const asymX = Math.abs(c[0] - mid[0]) / (ext[0] || 1), asymZ = Math.abs(c[2] - mid[2]) / (ext[2] || 1);
  let note = "";
  if (asymX < asymZ) { applyMat(parts, ORIENT["z+"]); note += "turned 90; "; }
  // Now the long axis is X. Find the tail: the fin is the highest thing on an aeroplane.
  const b2 = body.reduce((b, p) => bboxOf(p.pos, b.lo, b.hi), { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] });
  const midX = (b2.hi[0] + b2.lo[0]) / 2;
  let sum = 0, cnt = 0, cx = 0;
  const yCut = b2.lo[1] + (b2.hi[1] - b2.lo[1]) * 0.88;
  for (const p of body) for (let i = 0; i < p.pos.length; i += 3) {
    cx += p.pos[i];
    if (p.pos[i + 1] > yCut) { sum += p.pos[i]; cnt++; }
  }
  cx /= n;
  const tailPlus = heli ? cx < midX : cnt > 0 && sum / cnt > midX;
  if (tailPlus) { applyMat(parts, ORIENT.flip); note += "flipped"; }
  void topX;
  return note;
}

export async function build(rawParts, opts = {}) {
  await MeshoptSimplifier.ready;
  const log = [];
  let parts = rawParts.filter((p) => p.idx.length >= 3);
  if (!parts.length) throw new Error("no geometry");
  // Each part owns its vertex array, except AC3D parts of one object, which share one.
  const seenArr = new Set();
  for (const p of parts) { if (seenArr.has(p.pos)) p.pos = p.pos.slice(); seenArr.add(p.pos); }

  if (opts.orient === "auto" || !opts.orient) log.push("auto: " + (autoOrient(parts, opts.heli) || "as is"));
  else applyMat(parts, ORIENT[opts.orient]);
  if (opts.turn) applyMat(parts, ORIENT[opts.turn]);

  // Light beams, shadows and other props reach far outside the aircraft. Find where the bulk of
  // the model is (ignoring the outermost 1.5% of points on each side) and drop what lies well beyond.
  {
    const axes = [[], [], []];
    for (const p of parts) if (p.cls !== "spin") for (const v of new Set(p.idx)) for (let k = 0; k < 3; k++) axes[k].push(p.pos[v * 3 + k]);
    const q = axes.map((a) => { const s = Float64Array.from(a).sort(); return [s[Math.floor(s.length * 0.015)], s[Math.min(s.length - 1, Math.ceil(s.length * 0.985))]]; });
    const ext = q.map(([a, b]) => b - a);
    const diag = Math.hypot(...ext);
    const before = parts.length;
    parts = parts.filter((p) => {
      if (p.cls === "spin") return true;
      const lo2 = [Infinity, Infinity, Infinity], hi2 = [-Infinity, -Infinity, -Infinity];
      for (const v of p.idx) for (let k = 0; k < 3; k++) { const z = p.pos[v * 3 + k]; if (z < lo2[k]) lo2[k] = z; if (z > hi2[k]) hi2[k] = z; }
      const own = Math.hypot(hi2[0] - lo2[0], hi2[1] - lo2[1], hi2[2] - lo2[2]);
      if (own > diag * 1.8 || (p.cls === "glass" && own > diag * 0.55)) return false;
      for (let k = 0; k < 3; k++) {
        const c = (lo2[k] + hi2[k]) / 2;
        const pad = Math.max(ext[k] * 0.4, diag * 0.06);
        if (c < q[k][0] - pad || c > q[k][1] + pad) return false;
      }
      return true;
    });
    if (parts.length !== before) log.push(`outliers ${before - parts.length}`);
  }
  let { lo, hi } = parts.reduce((b, p) => bboxOf(p.pos, b.lo, b.hi), { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] });
  let S = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);

  // ----- weld everything into one vertex pool
  const W = weld(parts, S * 2e-5);
  const CLS = ["body", "glass", "trim", "spin"];
  const nt = W.idx.length / 3;
  const cls = new Uint8Array(nt);
  for (let t = 0; t < nt; t++) cls[t] = CLS.indexOf(parts[W.owner[t]].cls);
  // Spinning parts stay tied to their own object; everything else joins up by class.
  const group = new Uint32Array(nt);
  for (let t = 0; t < nt; t++) group[t] = cls[t];
  const { comp, count } = components(W.pos.length / 3, W.idx, group);

  // ----- drop what cannot be seen from outside, and specks
  const cLo = new Float32Array(count * 3).fill(Infinity), cHi = new Float32Array(count * 3).fill(-Infinity);
  const cTris = new Uint32Array(count), cCls = new Uint8Array(count);
  for (let t = 0; t < nt; t++) {
    const c = comp[t];
    cTris[c]++; cCls[c] = cls[t];
    for (let k = 0; k < 3; k++) {
      const v = W.idx[t * 3 + k] * 3;
      for (let a = 0; a < 3; a++) {
        if (W.pos[v + a] < cLo[c * 3 + a]) cLo[c * 3 + a] = W.pos[v + a];
        if (W.pos[v + a] > cHi[c * 3 + a]) cHi[c * 3 + a] = W.pos[v + a];
      }
    }
  }
  const centre = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const radius = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 * 1.02;
  const RES = opts.res || 640;
  const seenPx = new Float64Array(count), projPx = new Float64Array(count);
  for (const d of DIRS) {
    const basis = viewBasis(d);
    const { sx, sy } = raster(W.pos, W.idx, basis, RES, centre, radius, (t) => { seenPx[comp[t]]++; });
    for (let t = 0; t < nt; t++) {
      const a = W.idx[t * 3], b = W.idx[t * 3 + 1], c = W.idx[t * 3 + 2];
      projPx[comp[t]] += Math.abs((sx[b] - sx[a]) * (sy[c] - sy[a]) - (sx[c] - sx[a]) * (sy[b] - sy[a])) / 2;
    }
  }
  const keepC = new Uint8Array(count);
  let hidden = 0, specks = 0;
  for (let c = 0; c < count; c++) {
    const diag = Math.hypot(cHi[c * 3] - cLo[c * 3], cHi[c * 3 + 1] - cLo[c * 3 + 1], cHi[c * 3 + 2] - cLo[c * 3 + 2]);
    if (cCls[c] === 3) { keepC[c] = 1; continue; }
    if (diag < S * (opts.speck ?? 0.007)) { specks += cTris[c]; continue; }
    const ratio = seenPx[c] / Math.max(projPx[c], 1);
    if (seenPx[c] < 3 || ratio < (opts.minSeen ?? 0.035)) { hidden += cTris[c]; continue; }
    keepC[c] = 1;
  }
  log.push(`in ${nt} tris, hidden ${hidden}, specks ${specks}`);

  // ----- per class index buffers
  const byCls = CLS.map(() => []);
  const spinGroups = new Map(); // component -> triangles
  for (let t = 0; t < nt; t++) {
    if (!keepC[comp[t]]) continue;
    if (cls[t] === 3) {
      const key = W.owner[t];
      let g = spinGroups.get(key);
      if (!g) spinGroups.set(key, (g = []));
      g.push(W.idx[t * 3], W.idx[t * 3 + 1], W.idx[t * 3 + 2]);
    } else byCls[cls[t]].push(W.idx[t * 3], W.idx[t * 3 + 1], W.idx[t * 3 + 2]);
  }

  // Vertices where two classes meet are pinned so no gaps open between glass and skin.
  const nv = W.pos.length / 3;
  const mark = new Uint8Array(nv), lock = new Uint8Array(nv);
  byCls.forEach((a, ci) => { for (const v of a) { if (mark[v] && mark[v] !== ci + 1) lock[v] = 1; mark[v] = ci + 1; } });

  const total = byCls[0].length / 3 + byCls[1].length / 3 + byCls[2].length / 3;
  const target = opts.tris || 10000;
  const dummyAttr = new Float32Array(nv);
  const simplifyTo = (arr, want) => {
    let idx = Uint32Array.from(arr);
    if (idx.length / 3 <= want) return idx;
    let best = idx;
    for (const err of [0.003, 0.006, 0.012, 0.025, 0.05]) {
      const [out] = MeshoptSimplifier.simplifyWithAttributes(idx, W.pos, 3, dummyAttr, 1, [0], lock, Math.floor(want) * 3, err, ["Prune"]);
      best = out;
      if (out.length / 3 <= want * 1.2) break;
    }
    return best;
  };
  const ratio = Math.min(1, target / Math.max(total, 1));
  const out = {};
  CLS.slice(0, 3).forEach((name, ci) => {
    const n = byCls[ci].length / 3;
    if (!n) return;
    const want = ci === 1 ? Math.max(n * ratio, Math.min(n, 600)) : Math.max(n * ratio, Math.min(n, 300));
    out[name] = simplifyTo(byCls[ci], want);
  });

  // ----- spinning parts: gather blades that share an axis into one rotor
  const spins = [];
  const rawSpin = [];
  for (const [pi, arr] of spinGroups) {
    const ax = parts[pi].ax;
    const idx = Uint32Array.from(arr);
    const c = [0, 0, 0];
    let area = 0;
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, d = idx[i + 2] * 3;
      const ux = W.pos[b] - W.pos[a], uy = W.pos[b + 1] - W.pos[a + 1], uz = W.pos[b + 2] - W.pos[a + 2];
      const vx = W.pos[d] - W.pos[a], vy = W.pos[d + 1] - W.pos[a + 1], vz = W.pos[d + 2] - W.pos[a + 2];
      const ar = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
      area += ar;
      for (let k = 0; k < 3; k++) c[k] += ar * (W.pos[a + k] + W.pos[b + k] + W.pos[d + k]) / 3;
    }
    if (!area) continue;
    rawSpin.push({ ax, idx, c: c.map((v) => v / area), area, name: parts[pi].name });
  }
  const axI = { x: 0, y: 1, z: 2 };
  const used = new Set();
  for (let i = 0; i < rawSpin.length; i++) {
    if (used.has(i)) continue;
    let g = [rawSpin[i]];
    used.add(i);
    const a = axI[rawSpin[i].ax];
    const o1 = (a + 1) % 3, o2 = (a + 2) % 3;
    // Blades modelled one by one sit off the axis, so the net is wide.
    const reach = S * (rawSpin[i].ax === "y" ? 0.6 : 0.12);
    for (let j = i + 1; j < rawSpin.length; j++) {
      if (used.has(j) || rawSpin[j].ax !== rawSpin[i].ax) continue;
      if (Math.hypot(rawSpin[j].c[o1] - g[0].c[o1], rawSpin[j].c[o2] - g[0].c[o2]) < reach && Math.abs(rawSpin[j].c[a] - g[0].c[a]) < S * 0.12) { g.push(rawSpin[j]); used.add(j); }
    }
    const measure = () => {
      const idx = [];
      for (const r of g) for (const v of r.idx) idx.push(v);
      const lo2 = [Infinity, Infinity, Infinity], hi2 = [-Infinity, -Infinity, -Infinity];
      for (const v of idx) for (let k = 0; k < 3; k++) { const q = W.pos[v * 3 + k]; if (q < lo2[k]) lo2[k] = q; if (q > hi2[k]) hi2[k] = q; }
      const area = g.reduce((s, r) => s + r.area, 0);
      const cen = [0, 0, 0];
      for (const r of g) for (let k = 0; k < 3; k++) cen[k] += (r.c[k] * r.area) / area;
      const boxC = [(lo2[0] + hi2[0]) / 2, (lo2[1] + hi2[1]) / 2, (lo2[2] + hi2[2]) / 2];
      // The hub: on the axis by weight, in the middle along it.
      const pivot = [cen[0], cen[1], cen[2]];
      pivot[a] = boxC[a];
      let rad = 0;
      for (const v of idx) rad = Math.max(rad, Math.hypot(W.pos[v * 3 + o1] - pivot[o1], W.pos[v * 3 + o2] - pivot[o2]));
      return { idx, pivot, rad, off: Math.hypot(cen[o1] - boxC[o1], cen[o2] - boxC[o2]) };
    };
    let m = measure();
    // A filled disc as wide as the rotor is the "spinning fast" stand-in, not blades.
    const blades = g.filter((r) => {
      let rr = 0;
      for (const v of r.idx) rr = Math.max(rr, Math.hypot(W.pos[v * 3 + o1] - m.pivot[o1], W.pos[v * 3 + o2] - m.pivot[o2]));
      const disc = rr > m.rad * 0.5 && r.area > 0.55 * Math.PI * rr * rr;
      if (disc) {
        log.push(`disc: ${r.name}`);
        // Small ones are jet fan faces: keep them, still and dark, so the intakes are not hollow.
        if (rr < S * 0.04) out.trim = out.trim ? Uint32Array.from([...out.trim, ...r.idx]) : r.idx;
      }
      return !disc;
    });
    if (!blades.length) continue;
    if (blades.length !== g.length) { g = blades; m = measure(); }
    if (m.rad < S * 0.015) continue;
    let sIdx = Uint32Array.from(m.idx);
    if (sIdx.length / 3 > 900) sIdx = MeshoptSimplifier.simplify(sIdx, W.pos, 3, 900 * 3, 0.02, ["Prune"])[0];
    // A balanced rotor has its weight on the axis. If it clearly does not, leave it still rather than wobble.
    if (m.off < m.rad * 0.3) spins.push({ ax: rawSpin[i].ax, idx: sIdx, pivot: m.pivot, rad: m.rad });
    else { out.trim = out.trim ? Uint32Array.from([...out.trim, ...sIdx]) : sIdx; log.push(`still rotor: ${g[0].name}`); }
  }

  // ----- frame: centre, scale, nose +X
  const used2 = [];
  for (const k of Object.keys(out)) used2.push(out[k]);
  for (const s of spins) used2.push(s.idx);
  lo = [Infinity, Infinity, Infinity]; hi = [-Infinity, -Infinity, -Infinity];
  for (const a of used2) for (const v of a) for (let k = 0; k < 3; k++) { const q = W.pos[v * 3 + k]; if (q < lo[k]) lo[k] = q; if (q > hi[k]) hi[k] = q; }
  const c0 = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
  const sc = 2.2 / Math.max(hi[0] - lo[0], hi[2] - lo[2]);
  const P = new Float32Array(W.pos.length);
  for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) P[i + k] = (W.pos[i + k] - c0[k]) * sc;

  const meshes = [];
  for (const name of ["body", "glass", "trim"]) {
    if (!out[name] || !out[name].length) continue;
    const cm = compact(P, out[name]);
    const cr = creased(cm.pos, cm.idx, opts.crease ?? 38);
    meshes.push({ name, ...cr, origin: [0, 0, 0] });
  }
  for (const s of spins) {
    const cm = compact(P, s.idx);
    const pv = s.pivot.map((v, k) => (v - c0[k]) * sc);
    for (let i = 0; i < cm.pos.length; i += 3) for (let k = 0; k < 3; k++) cm.pos[i + k] -= pv[k];
    const cr = creased(cm.pos, cm.idx, 38);
    meshes.push({ name: "spin", ax: s.ax, ...cr, origin: pv });
  }
  if (!meshes.some((m) => m.name === "body")) throw new Error("no body left");

  // ----- where the paint goes: tail, nose and a stripe along the fuselage
  const body = meshes.find((m) => m.name === "body");
  const xmin = (lo[0] - c0[0]) * sc, xmax = (hi[0] - c0[0]) * sc, L = xmax - xmin;
  let bx0 = Infinity, bx1 = -Infinity;
  for (let i = 0; i < body.pos.length; i += 3) { if (body.pos[i] < bx0) bx0 = body.pos[i]; if (body.pos[i] > bx1) bx1 = body.pos[i]; }
  const BL = bx1 - bx0;
  let fz = 0;
  for (let i = 0; i < body.pos.length; i += 3) if (body.pos[i] > bx1 - BL * 0.08) fz = Math.max(fz, Math.abs(body.pos[i + 2]));
  fz = Math.min(0.22, Math.max(0.05, fz * 1.4));
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < body.pos.length; i += 3) {
    const x = body.pos[i];
    if (x > bx0 + BL * 0.45 && x < bx1 - BL * 0.12 && Math.abs(body.pos[i + 2]) < fz * 0.8) { y0 = Math.min(y0, body.pos[i + 1]); y1 = Math.max(y1, body.pos[i + 1]); }
  }
  if (!isFinite(y0)) { y0 = -0.1; y1 = 0.1; }
  const tris = meshes.reduce((s, m) => s + m.idx.length / 3, 0);
  const meta = {
    tailX: +(bx0 + BL * 0.17).toFixed(4), noseX: +(bx1 - BL * 0.075).toFixed(4),
    stripeY: +((y0 + y1) / 2 - (y1 - y0) * 0.08).toFixed(4), stripeH: +Math.max(0.012, (y1 - y0) * 0.075).toFixed(4), fuseZ: +fz.toFixed(4),
    tris, spins: spins.length, size: [+(L).toFixed(3), +((hi[1] - lo[1]) * sc).toFixed(3), +((hi[2] - lo[2]) * sc).toFixed(3)],
  };
  log.push(`out ${tris} tris, ${spins.length} spinning`);
  return { meshes, meta, log };
}

// ---------------------------------------------------------------- GLB out / in

export function writeGLB(file, model, extras = {}) {
  const chunks = [];
  let off = 0;
  const views = [], accessors = [], nodes = [], meshes = [];
  const push = (buf, target) => {
    const pad = (4 - (buf.length % 4)) % 4;
    views.push({ buffer: 0, byteOffset: off, byteLength: buf.length, ...target });
    chunks.push(buf, Buffer.alloc(pad));
    off += buf.length + pad;
    return views.length - 1;
  };
  const MATS = { body: 0, glass: 1, trim: 2, spin: 2 };
  for (const m of model.meshes) {
    const nv = m.pos.length / 3;
    const pb = Buffer.alloc(nv * 8), nb = Buffer.alloc(nv * 4);
    const mn = [32767, 32767, 32767], mx = [-32767, -32767, -32767];
    for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) {
      const q = Math.max(-32767, Math.min(32767, Math.round((m.pos[i * 3 + k] / K) * 32767)));
      pb.writeInt16LE(q, i * 8 + k * 2);
      if (q < mn[k]) mn[k] = q;
      if (q > mx[k]) mx[k] = q;
      nb.writeInt8(m.nrm[i * 3 + k], i * 4 + k);
    }
    const big = nv > 65535;
    const ib = Buffer.alloc(m.idx.length * (big ? 4 : 2));
    for (let i = 0; i < m.idx.length; i++) {
      if (big) ib.writeUInt32LE(m.idx[i], i * 4);
      else ib.writeUInt16LE(m.idx[i], i * 2);
    }
    const pv = push(pb, { byteStride: 8, target: 34962 });
    const nvw = push(nb, { byteStride: 4, target: 34962 });
    const iv = push(ib, { target: 34963 });
    accessors.push({ bufferView: pv, componentType: 5122, normalized: true, count: nv, type: "VEC3", min: mn, max: mx });
    accessors.push({ bufferView: nvw, componentType: 5120, normalized: true, count: nv, type: "VEC3" });
    accessors.push({ bufferView: iv, componentType: big ? 5125 : 5123, count: m.idx.length, type: "SCALAR" });
    const a = accessors.length;
    meshes.push({ primitives: [{ attributes: { POSITION: a - 3, NORMAL: a - 2 }, indices: a - 1, material: MATS[m.name] }] });
    const node = { name: m.name, mesh: meshes.length - 1, scale: [K, K, K] };
    if (m.origin.some((v) => v)) node.translation = m.origin.map((v) => +v.toFixed(5));
    if (m.name === "spin") node.extras = { axis: m.ax };
    nodes.push(node);
  }
  const doc = {
    asset: { version: "2.0", generator: "FinalPing model converter", extras: { ...model.meta, ...extras } },
    extensionsUsed: ["KHR_mesh_quantization"], extensionsRequired: ["KHR_mesh_quantization"],
    scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes,
    materials: [
      { name: "body", pbrMetallicRoughness: { baseColorFactor: [0.93, 0.93, 0.93, 1], metallicFactor: 0.05, roughnessFactor: 0.5 }, doubleSided: true },
      { name: "glass", pbrMetallicRoughness: { baseColorFactor: [0.04, 0.06, 0.09, 1], metallicFactor: 0.5, roughnessFactor: 0.15 }, doubleSided: true },
      { name: "trim", pbrMetallicRoughness: { baseColorFactor: [0.11, 0.11, 0.11, 1], metallicFactor: 0.05, roughnessFactor: 0.7 }, doubleSided: true },
    ],
    accessors, bufferViews: views, buffers: [{ byteLength: off }],
  };
  let json = Buffer.from(JSON.stringify(doc), "utf8");
  json = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const bin = Buffer.concat(chunks);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(json.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(file, Buffer.concat([head, jh, json, bh, bin]));
}

/** Read one of our own GLB files back (the same steps the web app takes). */
export function readOwn(file) {
  const buf = fs.readFileSync(file);
  const jl = buf.readUInt32LE(12);
  const doc = JSON.parse(buf.toString("utf8", 20, 20 + jl));
  const bin = buf.subarray(20 + jl + 8);
  const meshes = doc.nodes.map((n) => {
    const p = doc.meshes[n.mesh].primitives[0];
    const pa = doc.accessors[p.attributes.POSITION], ia = doc.accessors[p.indices];
    const pv = doc.bufferViews[pa.bufferView], iv = doc.bufferViews[ia.bufferView];
    const t = n.translation || [0, 0, 0];
    const pos = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) for (let k = 0; k < 3; k++) pos[i * 3 + k] = (bin.readInt16LE(pv.byteOffset + i * 8 + k * 2) / 32767) * n.scale[0] + t[k];
    const idx = new Uint32Array(ia.count);
    for (let i = 0; i < ia.count; i++) idx[i] = ia.componentType === 5125 ? bin.readUInt32LE(iv.byteOffset + i * 4) : bin.readUInt16LE(iv.byteOffset + i * 2);
    return { name: n.name, pos, idx };
  });
  return { meshes, meta: doc.asset.extras };
}
