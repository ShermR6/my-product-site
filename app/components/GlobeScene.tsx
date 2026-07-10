'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ── lat/lng → 3D ───────────────────────────────────────── */
function llToV3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

/* ── great-circle arc ───────────────────────────────────── */
function makeArc(lat1: number, lon1: number, lat2: number, lon2: number, r: number, lift = 1.18) {
  const a = llToV3(lat1, lon1, r);
  const b = llToV3(lat2, lon2, r);
  const m = a.clone().add(b).normalize().multiplyScalar(r * lift);
  const curve = new THREE.QuadraticBezierCurve3(a, m, b);
  return { curve, geo: new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)) };
}

/* ── flight routes ──────────────────────────────────────── */
const ROUTES = [
  { a: [40.7, -74.0],  b: [51.5,  -0.1],  call: 'UAL889',  alert: false },  // NYC → LDN
  { a: [34.1, -118.2], b: [35.7,  139.7], call: 'JAL61',   alert: false },  // LAX → TYO
  { a: [25.2,  55.3],  b: [1.3,   103.8], call: 'EK353',   alert: false },  // DXB → SIN
  { a: [33.9,  151.2], b: [22.3,  114.2], call: 'QFA101',  alert: false },  // SYD → HKG
  { a: [41.9, -87.6],  b: [48.9,    2.4], call: 'UAL990',  alert: false },  // ORD → CDG
  { a: [25.8, -80.3],  b: [40.7,  -74.0], call: 'N172AK',  alert: true  },  // MIA → NYC (ALERTED)
] as const;

/* ── globe component ────────────────────────────────────── */
export default function GlobeScene({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current!;
    const W = mount.clientWidth, H = mount.clientHeight;

    /* ── renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    /* ── scene / camera ── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
    camera.position.set(0, 0, 3);

    /* ── STARS ── */
    const starGeo = new THREE.BufferGeometry();
    const starPos: number[] = [];
    for (let i = 0; i < 3000; i++) {
      starPos.push(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200,
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.7 });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ── EARTH SPHERE ── */
    const earthGeo  = new THREE.SphereGeometry(1, 64, 64);
    const earthMat  = new THREE.MeshPhongMaterial({
      color:     0x060D1F,
      emissive:  0x0A1428,
      shininess: 15,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    /* ── LAT/LON GRID ── */
    const gridMat = new THREE.LineBasicMaterial({ color: 0x0EA5E9, transparent: true, opacity: 0.06 });
    for (let lat = -80; lat <= 80; lat += 20) {
      const pts: THREE.Vector3[] = [];
      for (let lon = -180; lon <= 180; lon += 2) pts.push(llToV3(lat, lon, 1.001));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lon = -180; lon < 180; lon += 20) {
      const pts: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 2) pts.push(llToV3(lat, lon, 1.001));
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    /* ── ATMOSPHERE GLOW ── */
    const atmGeo = new THREE.SphereGeometry(1.08, 64, 64);
    const atmMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      uniforms: { c: { value: 0.3 }, p: { value: 4.5 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        uniform float c;
        uniform float p;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(0.0,0.0,1.0)), p);
          gl_FragColor = vec4(0.05, 0.35, 0.9, 1.0) * intensity;
        }
      `,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    /* ── INNER GLOW RING ── */
    const glowInner = new THREE.SphereGeometry(1.02, 64, 64);
    const glowMat   = new THREE.ShaderMaterial({
      side: THREE.FrontSide,
      transparent: true,
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rim = 1.0 - dot(vNormal, vec3(0.0,0.0,1.0));
          rim = pow(rim, 3.0);
          gl_FragColor = vec4(0.05, 0.5, 1.0, rim * 0.15);
        }
      `,
    });
    scene.add(new THREE.Mesh(glowInner, glowMat));

    /* ── LIGHTS ── */
    scene.add(new THREE.AmbientLight(0x1a2a4a, 2));
    const sun = new THREE.DirectionalLight(0x4488ff, 1.5);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    /* ── FLIGHT ARCS + PLANES ── */
    const arcObjs: {
      line:   THREE.Line;
      dot:    THREE.Mesh;
      curve:  THREE.QuadraticBezierCurve3;
      t:      number;
      speed:  number;
      alert:  boolean;
      call:   string;
      label:  THREE.Sprite;
    }[] = [];

    const spriteMat = new THREE.SpriteMaterial({ color: 0x00ff88, depthTest: false });

    ROUTES.forEach((route, i) => {
      const color = route.alert ? 0xF97316 : 0x00D4FF;
      const { curve, geo } = makeArc(route.a[0], route.a[1], route.b[0], route.b[1], 1);

      /* arc line */
      const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: route.alert ? 0.9 : 0.55 });
      const line = new THREE.Line(geo, lineMat);
      scene.add(line);

      /* plane dot */
      const dotGeo = new THREE.SphereGeometry(route.alert ? 0.022 : 0.015, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color, transparent: true });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      scene.add(dot);

      /* callsign label via canvas sprite */
      const cvs = document.createElement('canvas');
      cvs.width = 160; cvs.height = 40;
      const cctx = cvs.getContext('2d')!;
      cctx.clearRect(0, 0, 160, 40);
      cctx.fillStyle = route.alert ? '#F97316' : '#00D4FF';
      cctx.font = 'bold 22px monospace';
      cctx.fillText(route.call, 4, 28);
      const tex  = new THREE.CanvasTexture(cvs);
      const smat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
      const label = new THREE.Sprite(smat);
      label.scale.set(0.28, 0.07, 1);
      scene.add(label);

      arcObjs.push({
        line, dot, curve, label,
        t: (i / ROUTES.length),
        speed: 0.0008 + Math.random() * 0.0004,
        alert: route.alert,
        call: route.call,
      });
    });

    /* ── ALERT ZONE at NYC ── */
    const zoneCenter = llToV3(40.7, -74.0, 1.002);
    const zonePts: THREE.Vector3[] = [];
    for (let a = 0; a <= Math.PI * 2; a += 0.05) {
      const lat = 40.7 + Math.cos(a) * 8;
      const lon = -74.0 + Math.sin(a) * 12;
      zonePts.push(llToV3(lat, lon, 1.002));
    }
    const zoneLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(zonePts),
      new THREE.LineBasicMaterial({ color: 0xF97316, transparent: true, opacity: 0.7 }),
    );
    scene.add(zoneLine);

    /* pulsing zone fill disc */
    const discGeo = new THREE.CircleGeometry(0.14, 32);
    const discMat = new THREE.MeshBasicMaterial({ color: 0xF97316, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.lookAt(zoneCenter.clone().multiplyScalar(2));
    disc.position.copy(zoneCenter);
    scene.add(disc);

    /* ── RESIZE ── */
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    /* ── MOUSE DRAG ── */
    let isDragging = false, prevMouse = { x: 0, y: 0 };
    let rotX = 0, rotY = 0, velX = 0, velY = 0;

    const onDown = (e: MouseEvent) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; velX = velY = 0; };
    const onUp   = () => { isDragging = false; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      velX = dx * 0.005;
      velY = dy * 0.005;
      rotY += dx * 0.005;
      rotX += dy * 0.003;
      rotX = Math.max(-0.8, Math.min(0.8, rotX));
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    renderer.domElement.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);

    /* ── ANIMATE ── */
    let frame = 0;
    let animId: number;
    const autoRotSpeed = 0.0012;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      frame++;

      /* auto-rotate with inertia */
      if (!isDragging) {
        velX *= 0.92;
        velY *= 0.92;
        rotX += velX;
        rotY += velY + autoRotSpeed;
        rotX = Math.max(-0.8, Math.min(0.8, rotX));
      }
      earth.rotation.x = rotX;
      earth.rotation.y = rotY;
      zoneLine.rotation.copy(earth.rotation);
      disc.position.copy(zoneCenter.clone().applyEuler(earth.rotation));

      /* arc/plane sync to globe rotation */
      arcObjs.forEach(obj => {
        obj.t = (obj.t + obj.speed) % 1;
        const pos = obj.curve.getPoint(obj.t).applyEuler(earth.rotation);
        obj.dot.position.copy(pos);
        obj.label.position.copy(pos.clone().multiplyScalar(1.06));
        obj.label.material.opacity = 0.9;

        /* pulse alert plane dot */
        if (obj.alert) {
          const pulse = 0.8 + 0.2 * Math.sin(frame * 0.12);
          (obj.dot.material as THREE.MeshBasicMaterial).opacity = pulse;
        }
      });

      /* arc rotation to match globe */
      arcObjs.forEach(obj => { obj.line.rotation.copy(earth.rotation); });

      /* zone disc pulse */
      const zonePulse = 0.04 + 0.04 * Math.sin(frame * 0.06);
      discMat.opacity = zonePulse;

      /* star slow drift */
      (scene.children[0] as THREE.Points).rotation.y += 0.00005;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      renderer.domElement.removeEventListener('mousedown', onDown);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} style={{ cursor: 'grab', ...style }} />;
}
