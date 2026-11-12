// The 3D aircraft. Eight shapes built from code (no model files). Cards share
// one WebGL renderer that copies onto ordinary 2D canvases, so a screen full of
// aircraft uses a single WebGL context; the Live Map draws the same models
// straight into its own canvas (see MapGL).
//
// Load this with import() from a client component: it pulls in three.js.
// Model axes: nose +X, up +Y, right wing +Z.

import * as T from "three";
import type { Family } from "./paint";

const PI = Math.PI;
const TAU = PI * 2;
type Mat = T.Material;
type Pt = [number, number]; // [position along the fuselage, radius]
type Rotor = { o: T.Object3D; ax: "x" | "y" | "z"; v: number };

const std = (color: T.ColorRepresentation, o: T.MeshStandardMaterialParameters = {}) =>
  new T.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, side: T.DoubleSide, ...o });

let MAT: { body: Mat; dark: Mat; glass: Mat; blade: Mat; disc: Mat } | null = null;
function mats() {
  return (MAT ??= {
    body: std(0xededed),
    dark: std(0x1c1c1c, { roughness: 0.7 }),
    glass: std(0x0b1017, { roughness: 0.15, metalness: 0.5 }),
    blade: std(0x2a2a2a, { transparent: true, opacity: 0.55 }),
    disc: new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, side: T.DoubleSide, depthWrite: false }),
  });
}

function lathe(profile: Pt[], phiStart = 0, phiLen = TAU, k = 1) {
  const pts = profile.map(([x, r]) => new T.Vector2(Math.max(r * k, 0.0001), x));
  const g = new T.LatheGeometry(pts, 30, phiStart, phiLen);
  g.rotateZ(-PI / 2);
  return g;
}

function planform(span: number, root: number, tip: number, sweep: number, t: number) {
  const s = new T.Shape();
  s.moveTo(0, 0); s.lineTo(-sweep, span); s.lineTo(-sweep - tip, span); s.lineTo(-root, 0); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: t * 0.4, bevelSize: t * 0.5, bevelSegments: 2, steps: 1 });
  g.translate(0, 0, -t / 2);
  return g;
}

type WingSpec = { x: number; y: number; span: number; root: number; tip: number; sweep?: number; dih?: number; t?: number };
function wings(o: WingSpec, mat: Mat) {
  const geo = planform(o.span / 2, o.root, o.tip, o.sweep ?? 0, o.t ?? 0.026);
  geo.rotateX(PI / 2);
  const g = new T.Group();
  const r = new T.Mesh(geo, mat);
  const l = new T.Group();
  const lm = new T.Mesh(geo, mat);
  r.rotation.x = lm.rotation.x = -(o.dih ?? 0);
  l.scale.z = -1;
  l.add(lm);
  g.add(r, l);
  g.position.set(o.x, o.y, 0);
  return g;
}

type FinSpec = { x: number; y: number; h: number; root: number; tip: number; sweep?: number; t?: number };
function fin(o: FinSpec, mat: Mat) {
  const m = new T.Mesh(planform(o.h, o.root, o.tip, o.sweep ?? 0, o.t ?? 0.02), mat);
  m.position.set(o.x, o.y, 0);
  return m;
}

type V3 = [number, number, number];
function strut(a: V3, b: V3, r: number, mat: Mat, rEnd = r) {
  const A = new T.Vector3(...a);
  const B = new T.Vector3(...b);
  const d = B.clone().sub(A);
  const m = new T.Mesh(new T.CylinderGeometry(rEnd, r, d.length(), 10), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  return m;
}

function wheel(x: number, y: number, z: number, r: number) {
  const g = new T.CylinderGeometry(r, r, r * 0.7, 14);
  g.rotateX(PI / 2);
  const m = new T.Mesh(g, mats().dark);
  m.position.set(x, y, z);
  return m;
}

function prop(r: number, pairs: number) {
  const M = mats();
  const g = new T.Group();
  const spinner = new T.Mesh(new T.ConeGeometry(r * 0.17, r * 0.42, 16), M.dark);
  spinner.rotation.z = -PI / 2;
  spinner.position.x = r * 0.2;
  g.add(spinner);
  const rot = new T.Group();
  for (let i = 0; i < pairs; i++) {
    const b = new T.Mesh(new T.BoxGeometry(0.012, r * 2, r * 0.13), M.blade);
    b.rotation.x = (i * PI) / pairs;
    rot.add(b);
  }
  const disc = new T.Mesh(new T.CircleGeometry(r, 40), M.disc);
  disc.rotation.y = PI / 2;
  rot.add(disc);
  rot.position.x = r * 0.08;
  g.add(rot);
  return { g, rot };
}

export type Model = { pivot: T.Group; tilt: T.Group; accent: T.MeshStandardMaterial; rotors: Rotor[] };

/** solid = paint the whole aircraft (on the map); otherwise white with painted tail, nose and stripe. */
export function buildModel(fam: Family, hex: string, solid: boolean): Model {
  const M = mats();
  const g = new T.Group();
  const rotors: Rotor[] = [];
  const A = std(hex, { roughness: 0.42 });
  const B: Mat = solid ? A : M.body;
  const D = M.dark;
  const G = M.glass;

  const shell = (p: Pt[], ps: number, pl: number, mat: Mat, k: number, sy = 1, sz = 1) => {
    const m = new T.Mesh(lathe(p, ps, pl, k), mat);
    m.scale.set(1, sy, sz);
    g.add(m);
  };
  const fus = (p: Pt[], sy?: number, sz?: number) => shell(p, 0, TAU, B, 1, sy, sz);
  const wrap = (p: Pt[], mat: Mat, sy?: number, sz?: number) => shell(p, 0, TAU, mat, 1.014, sy, sz);
  /** Glass over the top of the fuselage; margin trims it in from the sides. */
  const top = (p: Pt[], margin: number, sy?: number, sz?: number) => shell(p, PI + margin, PI - 2 * margin, G, 1.014, sy, sz);
  /** A stripe down both sides. off > 0 sits above the centre line. */
  const side = (p: Pt[], off: number, w: number, mat: Mat, sy?: number, sz?: number) => {
    shell(p, -off - w / 2, w, mat, 1.012, sy, sz);
    shell(p, PI + off - w / 2, w, mat, 1.012, sy, sz);
  };
  const addProp = (x: number, y: number, z: number, r: number, pairs: number) => {
    const p = prop(r, pairs);
    p.g.position.set(x, y, z);
    g.add(p.g);
    rotors.push({ o: p.rot, ax: "x", v: 0.5 });
  };
  const tail = (x: number, y: number, tTail = false) => {
    if (tTail) {
      g.add(fin({ x: x + 0.08, y: y + 0.04, h: 0.5, root: 0.44, tip: 0.26, sweep: 0.3 }, A));
      g.add(wings({ x: x - 0.19, y: y + 0.545, span: 0.9, root: 0.24, tip: 0.14, sweep: 0.08, t: 0.02 }, B));
    } else {
      g.add(wings({ x: x - 0.04, y, span: 0.88, root: 0.27, tip: 0.16, sweep: 0.07, t: 0.022 }, B));
      g.add(fin({ x: x + 0.02, y: y + 0.01, h: 0.42, root: 0.36, tip: 0.17, sweep: 0.2 }, A));
    }
  };
  const gear = (nx: number, mx: number, mz: number, y: number, from: number) => {
    g.add(wheel(nx, y, 0, 0.055), strut([nx - 0.02, -0.1, 0], [nx, y, 0], 0.012, B));
    for (const s of [1, -1]) g.add(wheel(mx, y, s * mz, 0.06), strut([mx + 0.05, from, s * mz * 0.55], [mx, y, s * mz], 0.014, B));
  };

  if (fam === "highwing") {
    const sy = 1.12, sz = 0.88;
    fus([[-1, 0.03], [-0.85, 0.06], [-0.5, 0.1], [-0.15, 0.19], [0.2, 0.2], [0.42, 0.18], [0.55, 0.15], [0.82, 0.13], [0.86, 0.1], [0.87, 0]], sy, sz);
    wrap([[0.56, 0.149], [0.82, 0.13], [0.86, 0.1], [0.872, 0]], A, sy, sz);
    top([[-0.12, 0.188], [0.2, 0.2], [0.42, 0.18], [0.5, 0.162]], -0.2, sy, sz);
    side([[-0.9, 0.05], [-0.85, 0.06], [-0.5, 0.1], [-0.15, 0.19], [0.2, 0.2], [0.42, 0.18], [0.55, 0.15]], -0.5, 0.18, A, sy, sz);
    g.add(wings({ x: 0.4, y: 0.235, span: 2.7, root: 0.4, tip: 0.3, sweep: 0.02, dih: 0.015, t: 0.035 }, B));
    for (const s of [1, -1]) g.add(strut([0.2, -0.16, s * 0.15], [0.22, 0.225, s * 0.62], 0.012, B));
    tail(-0.66, 0.04);
    addProp(0.875, 0, 0, 0.25, 1);
    gear(0.62, 0.02, 0.3, -0.37, -0.17);
  } else if (fam === "lowwing") {
    const sy = 1.05, sz = 0.9;
    fus([[-1, 0.03], [-0.8, 0.07], [-0.45, 0.12], [-0.1, 0.19], [0.2, 0.2], [0.45, 0.17], [0.8, 0.13], [0.86, 0.09], [0.872, 0]], sy, sz);
    wrap([[0.6, 0.153], [0.8, 0.13], [0.86, 0.09], [0.874, 0]], A, sy, sz);
    top([[-0.22, 0.166], [-0.1, 0.19], [0.2, 0.2], [0.4, 0.176], [0.47, 0.167]], 0.1, sy, sz);
    side([[-0.9, 0.05], [-0.8, 0.07], [-0.45, 0.12], [-0.22, 0.166]], 0, 0.2, A, sy, sz);
    g.add(wings({ x: 0.32, y: -0.13, span: 2.5, root: 0.46, tip: 0.27, sweep: 0.05, dih: 0.1, t: 0.035 }, B));
    tail(-0.66, 0.04);
    addProp(0.877, 0, 0, 0.25, 1);
    gear(0.6, 0.02, 0.42, -0.36, -0.1);
  } else if (fam === "twin" || fam === "tprop2") {
    const tp = fam === "tprop2";
    const sy = 1.05, sz = 0.92;
    fus([[-1, 0.03], [-0.8, 0.07], [-0.4, 0.14], [0, 0.2], [0.3, 0.2], [0.55, 0.16], [0.8, 0.09], [0.95, 0.03], [0.97, 0]], sy, sz);
    top([[-0.1, 0.185], [0, 0.2], [0.3, 0.2], [0.5, 0.168], [0.56, 0.157]], tp ? 0.3 : 0.15, sy, sz);
    if (tp) side([[-0.5, 0.125], [-0.4, 0.14], [-0.12, 0.182]], 0.3, 0.12, G, sy, sz);
    side([[-0.9, 0.05], [-0.8, 0.07], [-0.4, 0.14], [0, 0.2], [0.3, 0.2], [0.55, 0.16], [0.8, 0.09]], -0.3, 0.14, A, sy, sz);
    g.add(wings({ x: 0.3, y: -0.11, span: tp ? 2.5 : 2.6, root: 0.48, tip: 0.24, sweep: 0.05, dih: 0.1, t: 0.032 }, B));
    const nacelle: Pt[] = tp
      ? [[-0.5, 0.02], [-0.3, 0.07], [0.1, 0.09], [0.36, 0.075], [0.42, 0.04], [0.425, 0]]
      : [[-0.4, 0.02], [-0.25, 0.07], [0.1, 0.095], [0.3, 0.085], [0.34, 0.05], [0.345, 0]];
    for (const s of [1, -1]) {
      const n = new T.Mesh(lathe(nacelle), A);
      n.position.set(0.22, -0.06, s * 0.5);
      g.add(n);
      addProp(0.22 + (tp ? 0.425 : 0.345), -0.06, s * 0.5, 0.21, tp ? 2 : 1);
    }
    tail(-0.66, 0.04, tp);
  } else if (fam === "tprop") {
    const sy = 1.05, sz = 0.92;
    fus([[-1, 0.04], [-0.75, 0.09], [-0.4, 0.17], [0, 0.21], [0.35, 0.21], [0.55, 0.17], [0.8, 0.11], [0.93, 0.07], [0.95, 0]], sy, sz);
    wrap([[0.72, 0.129], [0.8, 0.11], [0.93, 0.07], [0.952, 0]], A, sy, sz);
    top([[0.2, 0.21], [0.35, 0.21], [0.5, 0.18], [0.56, 0.167]], 0.25, sy, sz);
    side([[-0.35, 0.175], [0, 0.21], [0.2, 0.21]], 0.35, 0.13, G, sy, sz);
    side([[-0.9, 0.06], [-0.75, 0.09], [-0.4, 0.17], [0, 0.21], [0.35, 0.21], [0.55, 0.17], [0.72, 0.129]], -0.25, 0.14, A, sy, sz);
    g.add(wings({ x: 0.24, y: -0.14, span: 2.26, root: 0.4, tip: 0.2, sweep: 0.04, dih: 0.1, t: 0.032 }, B));
    tail(-0.68, 0.04, true);
    addProp(0.955, 0, 0, 0.24, 2);
  } else if (fam === "jet") {
    fus([[-1, 0.03], [-0.8, 0.1], [-0.5, 0.17], [0, 0.19], [0.4, 0.19], [0.65, 0.15], [0.85, 0.08], [0.97, 0.02], [0.98, 0]], 1, 0.95);
    top([[0.5, 0.174], [0.65, 0.15], [0.76, 0.1115]], 0.5, 1, 0.95);
    side([[-0.3, 0.178], [0, 0.19], [0.4, 0.19]], 0.3, 0.1, G, 1, 0.95);
    side([[-0.8, 0.1], [-0.5, 0.17], [0, 0.19], [0.4, 0.19], [0.65, 0.15], [0.85, 0.08]], -0.15, 0.13, A, 1, 0.95);
    g.add(wings({ x: 0.2, y: -0.12, span: 2.1, root: 0.5, tip: 0.17, sweep: 0.32, dih: 0.07, t: 0.028 }, B));
    for (const s of [1, -1]) {
      const n = new T.Mesh(lathe([[-0.22, 0.04], [-0.12, 0.075], [0.12, 0.085], [0.2, 0.075]]), A);
      n.position.set(-0.5, 0.1, s * 0.3);
      const intake = new T.Mesh(new T.CircleGeometry(0.07, 24), D);
      intake.rotation.y = PI / 2;
      intake.position.set(-0.31, 0.1, s * 0.3);
      g.add(n, intake, strut([-0.5, 0.1, s * 0.14], [-0.5, 0.1, s * 0.26], 0.02, B));
    }
    g.add(fin({ x: -0.52, y: 0.12, h: 0.48, root: 0.5, tip: 0.28, sweep: 0.36 }, A));
    g.add(wings({ x: -0.84, y: 0.605, span: 0.86, root: 0.26, tip: 0.13, sweep: 0.14, t: 0.02 }, B));
  } else if (fam === "airliner") {
    fus([[-1, 0.02], [-0.85, 0.07], [-0.6, 0.115], [-0.3, 0.12], [0.7, 0.12], [0.85, 0.1], [0.95, 0.05], [0.985, 0.015], [0.99, 0]]);
    top([[0.82, 0.104], [0.85, 0.1], [0.91, 0.07]], 0.75);
    side([[-0.55, 0.116], [-0.3, 0.12], [0.7, 0.12], [0.78, 0.1093]], 0.3, 0.05, G);
    wrap([[-0.85, 0.07], [-0.6, 0.115], [-0.45, 0.1175]], A);
    g.add(wings({ x: 0.25, y: -0.07, span: 1.84, root: 0.5, tip: 0.1, sweep: 0.5, dih: 0.1, t: 0.03 }, B));
    for (const s of [1, -1]) {
      const n = new T.Mesh(lathe([[-0.16, 0.035], [-0.08, 0.06], [0.1, 0.068], [0.16, 0.06]]), A);
      n.position.set(0.1, -0.115, s * 0.33);
      const intake = new T.Mesh(new T.CircleGeometry(0.056, 24), D);
      intake.rotation.y = PI / 2;
      intake.position.set(0.25, -0.115, s * 0.33);
      g.add(n, intake);
    }
    g.add(wings({ x: -0.7, y: 0.03, span: 0.76, root: 0.25, tip: 0.09, sweep: 0.2, dih: 0.1, t: 0.02 }, B));
    g.add(fin({ x: -0.62, y: 0.09, h: 0.36, root: 0.38, tip: 0.12, sweep: 0.3 }, A));
  } else {
    // helicopter
    fus([[-0.4, 0.02], [-0.28, 0.13], [0, 0.24], [0.3, 0.25], [0.5, 0.2], [0.62, 0.1], [0.66, 0]], 1, 0.85);
    shell([[0.08, 0.2427], [0.3, 0.25], [0.5, 0.2], [0.62, 0.1], [0.655, 0.01]], PI - 0.5, PI + 1, G, 1.014, 1, 0.85);
    wrap([[-0.4, 0.02], [-0.28, 0.13], [0, 0.24]], A, 1, 0.85);
    g.add(strut([-0.3, 0.1, 0], [-1.2, 0.16, 0], 0.05, B, 0.022));
    g.add(fin({ x: -1.08, y: -0.04, h: 0.36, root: 0.2, tip: 0.1, sweep: 0.1 }, A));
    const tr = new T.Group();
    tr.add(new T.Mesh(new T.BoxGeometry(0.03, 0.36, 0.008), M.blade), new T.Mesh(new T.CircleGeometry(0.18, 24), M.disc));
    tr.position.set(-1.2, 0.16, 0.05);
    g.add(tr);
    rotors.push({ o: tr, ax: "z", v: 0.6 });
    g.add(strut([0.1, 0.24, 0], [0.1, 0.41, 0], 0.02, D));
    const mr = new T.Group();
    const md = new T.Mesh(new T.CircleGeometry(1, 48), M.disc);
    md.rotation.x = -PI / 2;
    // On map markers the rotor is painted too, or the helicopter is just a sliver from above.
    const blade = solid ? A : M.blade;
    const cross = new T.Mesh(new T.BoxGeometry(2, 0.012, 0.07), blade);
    cross.rotation.y = PI / 2;
    mr.add(new T.Mesh(new T.BoxGeometry(2, 0.012, 0.07), blade), md);
    if (solid) mr.add(cross);
    mr.position.set(0.1, 0.42, 0);
    g.add(mr);
    rotors.push({ o: mr, ax: "y", v: 0.33 });
    for (const s of [1, -1]) {
      g.add(
        strut([-0.35, -0.36, s * 0.22], [0.5, -0.36, s * 0.22], 0.014, D),
        strut([-0.1, -0.18, s * 0.12], [-0.1, -0.36, s * 0.22], 0.01, D),
        strut([0.3, -0.18, s * 0.12], [0.3, -0.36, s * 0.22], 0.01, D),
      );
    }
  }

  // Centre it and scale it so every type fills the same frame.
  const box = new T.Box3().setFromObject(g);
  const size = box.getSize(new T.Vector3());
  const c = box.getCenter(new T.Vector3());
  g.position.set(-c.x, -c.y, -c.z);
  const fit = new T.Group();
  fit.add(g);
  fit.scale.setScalar(2.2 / Math.max(size.x, size.z));
  const tilt = new T.Group();
  tilt.add(fit);
  const pivot = new T.Group();
  pivot.add(tilt);
  return { pivot, tilt, accent: A, rotors };
}

export function destroyModel(m: Model) {
  m.pivot.traverse((o) => { if (o instanceof T.Mesh) o.geometry.dispose(); });
  m.accent.dispose();
}

/** The same three lights everywhere a model is shown. */
export function lightScene(scene: T.Scene) {
  const key = new T.DirectionalLight(0xffffff, 2.8);
  key.position.set(3, 5, 4);
  const rim = new T.DirectionalLight(0xffffff, 1.1);
  rim.position.set(-4, 2, -3);
  scene.add(new T.HemisphereLight(0xffffff, 0x202020, 2.6), key, rim);
}

// ----- the shared renderer -----

const BW = 1400;
const BH = 900;
let R: T.WebGLRenderer | null = null;
let scene: T.Scene | null = null;
let failed = false;

function renderer(): T.WebGLRenderer | null {
  if (R || failed) return R;
  try {
    R = new T.WebGLRenderer({ alpha: true, antialias: true });
    R.setPixelRatio(1);
    R.setSize(BW, BH, false);
    R.setClearColor(0x000000, 0);
    scene = new T.Scene();
    lightScene(scene);
  } catch {
    failed = true; // no WebGL here; callers fall back to flat icons
    R = null;
  }
  return R;
}

function draw(model: Model, cam: T.Camera, w: number, h: number, ctx: CanvasRenderingContext2D) {
  if (!R || !scene) return;
  scene.add(model.pivot);
  R.setViewport(0, 0, w, h);
  R.setScissor(0, 0, w, h);
  R.setScissorTest(true);
  R.clear();
  R.render(scene, cam);
  scene.remove(model.pivot);
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(R.domElement, 0, BH - h, w, h, 0, 0, w, h);
}

// ----- turning models on cards -----

export type ViewOptions = { family: Family; color: string; speed?: number; start?: number };
export type ViewHandle = { setColor: (hex: string) => void; dispose: () => void };

type View = {
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; model: Model; cam: T.PerspectiveCamera;
  ang: number; speed: number; drag: boolean; dirty: boolean; off: () => void;
};
const views = new Set<View>();
let raf = 0;
let tick = 0;
const still = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function frame() {
  raf = views.size ? requestAnimationFrame(frame) : 0;
  tick++;
  const calm = still();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const v of views) {
    // About 30 frames a second is plenty for a slow turn; dragging gets every frame.
    if (!v.drag && !v.dirty && (calm || tick % 2)) continue;
    const c = v.canvas;
    if (!c.offsetParent) continue;
    const r = c.getBoundingClientRect();
    if (r.width < 2 || r.bottom < 0 || r.top > window.innerHeight) continue;
    const w = Math.min(Math.round(r.width * dpr), BW);
    const h = Math.min(Math.round(r.height * dpr), BH);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      v.cam.aspect = w / h;
      const d = 4.3 * Math.max(1, 1.75 / v.cam.aspect);
      v.cam.position.set(0, d * 0.28, d * 0.96);
      v.cam.lookAt(0, 0, 0);
      v.cam.updateProjectionMatrix();
    }
    if (!calm) {
      if (!v.drag) v.ang += v.speed * 2;
      for (const o of v.model.rotors) o.o.rotation[o.ax] += o.v * 2;
    }
    v.model.pivot.rotation.y = v.ang;
    draw(v.model, v.cam, w, h, v.ctx);
    v.dirty = false;
  }
}

/** Show a slowly turning model on this canvas. Returns null when WebGL isn't available. */
export function mount(canvas: HTMLCanvasElement, o: ViewOptions): ViewHandle | null {
  const ctx = canvas.getContext("2d");
  if (!ctx || !renderer()) return null;
  const model = buildModel(o.family, o.color, false);
  model.tilt.rotation.z = 0.05;
  const v: View = {
    canvas, ctx, model, cam: new T.PerspectiveCamera(24, 1, 0.1, 50),
    ang: o.start ?? -0.6, speed: o.speed ?? 0.006, drag: false, dirty: true, off: () => {},
  };
  let px = 0;
  const down = (e: PointerEvent) => { v.drag = true; px = e.clientX; canvas.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (v.drag) { v.ang += (e.clientX - px) * 0.012; px = e.clientX; } };
  const up = () => { v.drag = false; v.dirty = true; };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  v.off = () => {
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
  };
  views.add(v);
  if (!raf) raf = requestAnimationFrame(frame);
  return {
    setColor(hex) { model.accent.color.set(hex); v.dirty = true; },
    dispose() { views.delete(v); v.off(); destroyModel(model); },
  };
}
