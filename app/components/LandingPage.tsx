'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

/* ── Plane SVG ── */
function PlaneSVG() {
  return (
    <svg width="200" height="460" viewBox="0 0 380 820" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B8C8E8"/>
          <stop offset="40%" stopColor="#E8EDF8"/>
          <stop offset="55%" stopColor="#C8D4EE"/>
          <stop offset="100%" stopColor="#8898B8"/>
        </linearGradient>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8898B8"/>
          <stop offset="100%" stopColor="#5068A8"/>
        </linearGradient>
        <filter id="pf"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <ellipse cx="191" cy="415" rx="22" ry="320" fill="rgba(0,0,80,0.3)" filter="url(#pf)"/>
      <path d="M180,90 Q172,200 168,350 L168,560 Q168,620 180,680 Q186,720 190,760 Q194,720 200,680 Q212,620 212,560 L212,350 Q208,200 200,90 Q196,60 190,30 Q184,60 180,90Z" fill="url(#fg)" stroke="#9AAAC8" strokeWidth="0.8"/>
      <ellipse cx="190" cy="38" rx="6" ry="9" fill="#9AAAC8"/>
      <path d="M182,120 Q185,100 188,80 L186,80 Q183,100 180,120Z" fill="rgba(255,255,255,0.5)"/>
      <path d="M186,200 L186,620 Q188,640 190,650 Q192,640 194,620 L194,200Z" fill="rgba(0,40,120,0.08)"/>
      <path d="M172,280 Q120,350 20,500 L15,510 Q10,515 12,520 L20,520 Q80,520 130,490 Q155,475 168,455 L168,480 Q158,510 140,520 Q120,530 90,535 L85,540 L90,545 Q125,542 158,528 Q172,520 175,505 L178,640 Q178,660 182,660 L182,280Z" fill="url(#wg)" stroke="#6878A8" strokeWidth="0.6"/>
      <path d="M208,280 Q260,350 360,500 L365,510 Q370,515 368,520 L360,520 Q300,520 250,490 Q225,475 212,455 L212,480 Q222,510 240,520 Q260,530 290,535 L295,540 L290,545 Q255,542 222,528 Q208,520 205,505 L202,640 Q202,660 198,660 L198,280Z" fill="url(#wg)" stroke="#6878A8" strokeWidth="0.6"/>
      <line x1="80" y1="517" x2="168" y2="458" stroke="#5068A8" strokeWidth="0.8" opacity="0.6"/>
      <line x1="300" y1="517" x2="212" y2="458" stroke="#5068A8" strokeWidth="0.8" opacity="0.6"/>
      <ellipse cx="110" cy="435" rx="18" ry="9" fill="#708090" stroke="#506070" strokeWidth="0.8"/>
      <rect x="92" y="435" width="36" height="42" rx="6" fill="#708090" stroke="#506070" strokeWidth="0.7"/>
      <ellipse cx="110" cy="477" rx="18" ry="9" fill="#405060"/>
      <ellipse cx="110" cy="435" rx="14" ry="5" fill="#2A3848"/>
      <ellipse cx="270" cy="435" rx="18" ry="9" fill="#708090" stroke="#506070" strokeWidth="0.8"/>
      <rect x="252" y="435" width="36" height="42" rx="6" fill="#708090" stroke="#506070" strokeWidth="0.7"/>
      <ellipse cx="270" cy="477" rx="18" ry="9" fill="#405060"/>
      <ellipse cx="270" cy="435" rx="14" ry="5" fill="#2A3848"/>
      <path d="M180,685 Q150,700 110,715 L108,720 Q130,720 165,710 L178,706Z" fill="url(#wg)" stroke="#6878A8" strokeWidth="0.6"/>
      <path d="M200,685 Q230,700 270,715 L272,720 Q250,720 215,710 L202,706Z" fill="url(#wg)" stroke="#6878A8" strokeWidth="0.6"/>
      <path d="M188,650 Q184,680 182,730 L198,730 Q196,680 192,650Z" fill="#9AAAC8" stroke="#8090B0" strokeWidth="0.6"/>
      <g fill="#1A2A48" opacity="0.85">
        {[155,170,185,200,215,230,245,260,275,290,305].map(y => (
          <g key={y}><rect x="174" y={y} width="8" height="6" rx="2"/><rect x="198" y={y} width="8" height="6" rx="2"/></g>
        ))}
      </g>
    </svg>
  );
}

/* ── Icon helpers ── */
const IcoDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoCheckGray = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function LandingPage() {
  const curRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const ctlRef  = useRef<HTMLDivElement>(null);
  const ctrRef  = useRef<HTMLDivElement>(null);
  const hsOuterRef = useRef<HTMLDivElement>(null);
  const hsTrackRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const navRef  = useRef<HTMLElement>(null);

  const [planeVis, setPlaneVis] = useState(false);
  const [panel, setPanel] = useState(0);
  const [reveals, setReveals] = useState<Set<string>>(new Set());

  /* body class + cursor */
  useEffect(() => {
    document.body.classList.add('landing-mode');
    return () => document.body.classList.remove('landing-mode');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPlaneVis(true), 800);
    return () => clearTimeout(t);
  }, []);

  /* scroll + cursor RAF loop */
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    let lastY = 0, vel = 0;
    let rafId: number;
    let hover = false;

    const moveCursor = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (curRef.current) { curRef.current.style.left = mx + 'px'; curRef.current.style.top = my + 'px'; }
    };
    const mouseDown = () => ringRef.current?.classList.add('lp-ring-click');
    const mouseUp   = () => ringRef.current?.classList.remove('lp-ring-click');

    const loop = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ringRef.current) { ringRef.current.style.left = rx + 'px'; ringRef.current.style.top = ry + 'px'; }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const onScroll = () => {
      const sy = window.scrollY;
      const maxS = Math.max(document.body.scrollHeight - window.innerHeight, 1);

      if (progRef.current) progRef.current.style.width = (sy / maxS * 100) + '%';
      if (navRef.current) navRef.current.classList.toggle('lp-nav-scrolled', sy > 60);

      const p = Math.min(sy / maxS, 1);
      const yVh = 120 - p * 180;
      const dv = sy - lastY;
      vel += (dv - vel) * 0.13; lastY = sy;
      const tilt = Math.max(-9, Math.min(9, vel * 0.3));
      if (planeRef.current) {
        planeRef.current.style.transform = `translateX(calc(-50% + ${tilt * 1.4}px)) translateY(${yVh}vh) rotate(${tilt * 0.45}deg)`;
      }
      const ch = Math.max(24, Math.min(200, 36 + Math.abs(vel) * 9));
      const co = Math.min(0.65, 0.18 + Math.abs(vel) * 0.04).toFixed(2);
      [ctlRef, ctrRef].forEach(r => { if (r.current) { r.current.style.height = ch + 'px'; r.current.style.opacity = co; } });

      const outer = hsOuterRef.current, track = hsTrackRef.current;
      if (outer && track) {
        const rect = outer.getBoundingClientRect();
        const prog = Math.max(0, Math.min(1, -rect.top / (outer.offsetHeight - window.innerHeight)));
        track.style.transform = `translateX(-${prog * (track.scrollWidth - window.innerWidth)}px)`;
        setPanel(Math.round(prog * 3));
      }
    };

    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mousedown', mouseDown);
    document.addEventListener('mouseup', mouseUp);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* hover ring swell */
    const swell = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      el.addEventListener('mouseenter', () => ringRef.current?.classList.add('lp-ring-hover'));
      el.addEventListener('mouseleave', () => ringRef.current?.classList.remove('lp-ring-hover'));
    };

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mousedown', mouseDown);
      document.removeEventListener('mouseup', mouseUp);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  /* scroll reveal */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = (e.target as HTMLElement).dataset.reveal;
          if (id) setReveals(prev => new Set(prev).add(id));
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* counter animations */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = parseFloat(el.dataset.count || '0');
        const suffix = el.dataset.suffix || '';
        const dec = parseInt(el.dataset.dec || '0');
        const steps = 60, dur = 1600;
        let i = 0;
        const iv = setInterval(() => {
          i++;
          const ease = 1 - Math.pow(1 - i / steps, 4);
          const val = target * ease;
          el.textContent = (dec ? val.toFixed(dec) : Math.round(val).toLocaleString()) + suffix;
          if (i >= steps) { el.textContent = (dec ? target.toFixed(dec) : target.toLocaleString()) + suffix; clearInterval(iv); }
        }, dur / steps);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* demo feed reveals */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const alerts = e.target.querySelectorAll('.lp-da');
        alerts.forEach((a, i) => setTimeout(() => a.classList.add('lp-da-vis'), i * 220));
        obs.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    if (feedRef.current) obs.observe(feedRef.current);
    return () => obs.disconnect();
  }, []);

  /* live alert inject */
  useEffect(() => {
    const flights = [
      { call:'N4721G', type:'Cessna 172', zone:'Zone Alpha', alt:'4,800ft', spd:'120kts', cls:'lp-da-new', badge:'NEW', bc:'lp-badge-n', dc:'#FB923C', tc:'#FB923C' },
      { call:'JBU1892', type:'Airbus A320', zone:'Zone Beta', alt:'28,000ft', spd:'480kts', cls:'lp-da-live', badge:'LIVE', bc:'lp-badge-l', dc:'#4ADE80', tc:'#4ADE80' },
      { call:'FDX3801', type:'Boeing 777F', zone:'Zone Alpha', alt:'33,000ft', spd:'540kts', cls:'lp-da-past', badge:'PAST', bc:'lp-badge-p', dc:'rgba(232,237,248,0.3)', tc:'rgba(232,237,248,0.6)' },
    ];
    let fi = 0;
    const iv = setInterval(() => {
      if (!feedRef.current) return;
      const f = flights[fi++ % flights.length];
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
      const div = document.createElement('div');
      div.className = `lp-da ${f.cls}`;
      div.innerHTML = `<div class="lp-da-dot" style="background:${f.dc}"></div><span class="lp-da-call" style="color:${f.tc}">${f.call}</span><span class="lp-da-info">${f.type} · ${f.zone} · ${f.alt} · ${f.spd}</span><span class="lp-da-badge ${f.bc}">${f.badge}</span><span class="lp-da-time">${ts}</span>`;
      feedRef.current.insertBefore(div, feedRef.current.firstChild);
      requestAnimationFrame(() => div.classList.add('lp-da-vis'));
      while (feedRef.current.children.length > 8) feedRef.current.removeChild(feedRef.current.lastChild!);
    }, 4200);
    return () => clearInterval(iv);
  }, []);

  /* 3D tilt on testi cards */
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLDivElement>('.lp-tc');
    cards.forEach(card => {
      const mm = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform = `translateY(-5px) rotateX(${-y*8}deg) rotateY(${x*8}deg)`;
        card.style.setProperty('--tx', `${(e.clientX-r.left)/r.width*100}%`);
        card.style.setProperty('--ty', `${(e.clientY-r.top)/r.height*100}%`);
      };
      const ml = () => { card.style.transform = ''; };
      card.addEventListener('mousemove', mm);
      card.addEventListener('mouseleave', ml);
    });
  }, []);

  /* magnetic buttons */
  useEffect(() => {
    const btns = document.querySelectorAll<HTMLElement>('.lp-mag');
    btns.forEach(btn => {
      const mm = (e: MouseEvent) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width  / 2) * 0.35;
        const y = (e.clientY - r.top  - r.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px,${y}px) translateY(-2px)`;
      };
      const ml = () => { btn.style.transform = ''; };
      btn.addEventListener('mousemove', mm);
      btn.addEventListener('mouseleave', ml);
    });
  }, []);

  const sr = (id: string) => reveals.has(id);

  /* ── colours / tokens ── */
  const dark  = '#060D1F';
  const dark2 = '#0D1B35';
  const sky   = '#0EA5E9';
  const skyL  = '#38BDF8';
  const ora   = '#F97316';
  const dt    = '#E8EDF8';
  const dm    = 'rgba(232,237,248,0.5)';
  const dm2   = 'rgba(232,237,248,0.25)';
  const db    = 'rgba(255,255,255,0.07)';
  const light = '#FAFBFF';
  const light2= '#F0F9FF';
  const lb    = 'rgba(14,74,110,0.09)';
  const lm    = '#64748B';
  const lm2   = '#94A3B8';
  const lt    = '#0C1428';

  return (
    <>
      {/* ── GLOBAL FIXED LAYER ─────────────────────── */}
      <style>{`
        .lp-cur{position:fixed;width:7px;height:7px;background:#0EA5E9;border-radius:50%;pointer-events:none;z-index:9998;transform:translate(-50%,-50%);mix-blend-mode:screen;will-change:transform}
        .lp-ring{position:fixed;width:32px;height:32px;border:1.5px solid rgba(14,165,233,0.35);border-radius:50%;pointer-events:none;z-index:9997;transform:translate(-50%,-50%);will-change:transform;transition:width .25s,height .25s,border-color .25s,background .25s}
        .lp-ring-hover{width:48px!important;height:48px!important;border-color:rgba(14,165,233,0.6)!important;background:rgba(14,165,233,0.05)}
        .lp-ring-click{width:20px!important;height:20px!important;background:rgba(14,165,233,0.2)}
        .lp-prog{position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,#0EA5E9,#F97316);z-index:9999;width:0;transition:width .1s linear}
        .lp-plane-wrap{position:fixed;left:50%;top:0;height:100vh;transform:translateX(-50%);pointer-events:none;z-index:3;overflow:visible}
        .lp-plane{position:absolute;left:50%;transform:translateX(-50%) translateY(120vh);opacity:0;will-change:transform;filter:drop-shadow(0 32px 64px rgba(14,165,233,0.1)) drop-shadow(0 8px 20px rgba(0,0,0,0.4));transition:opacity 1.2s}
        .lp-plane-vis{opacity:.28!important}
        .lp-ct{position:absolute;width:1.5px;border-radius:999px;background:linear-gradient(to top,rgba(14,165,233,0.5),transparent);pointer-events:none;bottom:-8px}
        .lp-ctl{left:calc(50% - 51px)}.lp-ctr{left:calc(50% + 49px)}

        .lp-nav{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:min(calc(100% - 32px),1320px);height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-radius:16px;z-index:1000;transition:background .4s,border-color .4s,backdrop-filter .5s;border:1px solid transparent}
        .lp-nav-scrolled{background:rgba(6,13,31,0.88)!important;border-color:rgba(255,255,255,0.07)!important;backdrop-filter:blur(28px)!important}
        .lp-logo{display:flex;align-items:center;gap:9px;font-size:16px;font-weight:800;letter-spacing:-0.4px;color:white;text-decoration:none}
        .lp-logo-mark{width:28px;height:28px;background:linear-gradient(135deg,#0EA5E9,#0284C7);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 0 1px rgba(255,255,255,0.1) inset,0 4px 12px rgba(14,165,233,0.4);animation:lp-logo-glow 2s ease-in-out infinite alternate}
        .lp-nav-links{display:flex;gap:24px;list-style:none;margin:0;padding:0}
        .lp-nav-links a{font-size:13px;font-weight:500;color:rgba(232,237,248,0.5);text-decoration:none;transition:color .2s}
        .lp-nav-links a:hover{color:#E8EDF8}
        .lp-nav-btn{display:flex;align-items:center;gap:7px;background:#F97316;color:white;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 16px rgba(249,115,22,0.4);position:relative;overflow:hidden}
        .lp-nav-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.18),transparent)}
        .lp-nav-btn:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(249,115,22,0.55)}

        .lp-sr{opacity:0;transform:translateY(44px);transition:opacity .85s cubic-bezier(.18,.9,.2,1),transform .85s cubic-bezier(.18,.9,.2,1)}
        .lp-srl{opacity:0;transform:translateX(-36px);transition:opacity .85s cubic-bezier(.18,.9,.2,1),transform .85s cubic-bezier(.18,.9,.2,1)}
        .lp-srr{opacity:0;transform:translateX(36px);transition:opacity .85s cubic-bezier(.18,.9,.2,1),transform .85s cubic-bezier(.18,.9,.2,1)}
        .lp-sr-on,.lp-srl-on,.lp-srr-on{opacity:1!important;transform:none!important}
        .lp-d1{transition-delay:.08s}.lp-d2{transition-delay:.18s}.lp-d3{transition-delay:.28s}.lp-d4{transition-delay:.38s}.lp-d5{transition-delay:.48s}

        .lp-da{display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:8px;font-size:12.5px;opacity:0;transform:translateX(-12px);transition:opacity .4s,transform .4s}
        .lp-da-vis{opacity:1!important;transform:translateX(0)!important}
        .lp-da-new{background:rgba(249,115,22,0.09);border:1px solid rgba(249,115,22,0.2)}
        .lp-da-live{background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.15)}
        .lp-da-past{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07)}
        .lp-da-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .lp-da-call{font-weight:800;font-family:monospace;font-size:13px;letter-spacing:.5px}
        .lp-da-info{color:rgba(232,237,248,0.5);flex:1;font-size:12px}
        .lp-da-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px}
        .lp-badge-n{background:rgba(249,115,22,0.18);color:#FB923C}
        .lp-badge-l{background:rgba(34,197,94,0.14);color:#4ADE80}
        .lp-badge-p{background:rgba(255,255,255,0.06);color:rgba(232,237,248,0.25)}
        .lp-da-time{font-size:10.5px;color:rgba(232,237,248,0.25);font-family:monospace;white-space:nowrap}

        .lp-tc{background:${dark2};border:1px solid ${db};border-radius:20px;padding:36px;cursor:default;transition:border-color .3s,transform .35s cubic-bezier(.2,.8,.2,1);position:relative;overflow:hidden}
        .lp-tc::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--tx,50%) var(--ty,50%),rgba(14,165,233,0.055) 0%,transparent 60%);opacity:0;transition:opacity .3s}
        .lp-tc:hover{border-color:rgba(14,165,233,0.22)!important;transform:translateY(-5px)!important}
        .lp-tc:hover::before{opacity:1}

        .lp-hpd{width:7px;height:7px;border-radius:50%;background:#94A3B8;transition:all .3s}
        .lp-hpd-on{background:#0EA5E9!important;width:22px!important;border-radius:999px!important}

        .lp-zone-ring{position:absolute;top:50%;left:50%;width:160px;height:160px;border:2px dashed rgba(14,165,233,0.5);border-radius:50%;transform:translate(-50%,-50%);animation:lp-zone 3s ease-in-out infinite}
        .lp-blip{position:absolute;width:10px;height:10px;border-radius:50%}
        .lp-blip::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:1px solid currentColor;opacity:.4;animation:lp-blip 1.8s ease-out infinite}
        .lp-b1{animation:lp-b1 5s ease-in-out infinite}
        .lp-b2{animation:lp-b2 7s ease-in-out infinite;animation-delay:-2s}
        .lp-b3{animation:lp-b3 6s ease-in-out infinite;animation-delay:-1s}

        .lp-tr-fill{fill:none;stroke:#0EA5E9;stroke-width:6;stroke-linecap:round;stroke-dasharray:502;stroke-dashoffset:0;animation:lp-timer 3s cubic-bezier(.4,0,.2,1) infinite}

        .lp-btn-p{display:inline-flex;align-items:center;gap:10px;background:#F97316;color:white;padding:16px 36px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;cursor:pointer;position:relative;overflow:hidden;transition:transform .22s,box-shadow .22s;box-shadow:0 4px 24px rgba(249,115,22,0.4),0 1px 3px rgba(0,0,0,0.2);border:none;font-family:inherit}
        .lp-btn-p::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.22),transparent 55%)}
        .lp-btn-p:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(249,115,22,0.55),0 4px 10px rgba(0,0,0,0.2)}
        .lp-btn-g{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);color:rgba(232,237,248,0.5);padding:16px 28px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none;cursor:pointer;border:1px solid rgba(255,255,255,0.07);transition:all .22s;font-family:inherit}
        .lp-btn-g:hover{background:rgba(255,255,255,0.09);color:#E8EDF8;border-color:rgba(255,255,255,0.13)}

        .lp-live-dot{width:6px;height:6px;background:#22C55E;border-radius:50%;box-shadow:0 0 0 2px rgba(34,197,94,0.2);animation:lp-live-pulse 2.2s infinite;display:inline-block}
        .lp-scroll-line{width:1px;height:56px;background:linear-gradient(to bottom,#0EA5E9,transparent);animation:lp-scroll-line 2.2s ease-in-out infinite}

        .lp-ww{overflow:hidden;display:inline-block;vertical-align:bottom}
        .lp-w{display:inline-block;transform:translateY(105%);animation:lp-word-rise .85s cubic-bezier(.18,.9,.2,1) forwards}

        @media(prefers-reduced-motion:reduce){.lp-w{transform:translateY(0);animation:none}.lp-sr,.lp-srl,.lp-srr{opacity:1;transform:none}}
      `}</style>

      {/* Fixed overlay elements */}
      <div ref={progRef} className="lp-prog" />
      <div ref={curRef}  className="lp-cur" />
      <div ref={ringRef} className="lp-ring" />

      {/* Plane */}
      <div className="lp-plane-wrap">
        <div ref={planeRef} className={`lp-plane${planeVis ? ' lp-plane-vis' : ''}`}>
          <div ref={ctlRef} className="lp-ct lp-ctl" />
          <div ref={ctrRef} className="lp-ct lp-ctr" />
          <PlaneSVG />
        </div>
      </div>

      {/* ── NAV ──────────────────────────────── */}
      <nav ref={navRef} className="lp-nav">
        <Link href="/" className="lp-logo">
          <div className="lp-logo-mark">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="white"/>
              <path d="M10 3L12 8H8L10 3Z" fill="white" opacity="0.7"/>
              <path d="M10 17L8 12H12L10 17Z" fill="white" opacity="0.7"/>
              <path d="M3 10L8 8V12L3 10Z" fill="white" opacity="0.5"/>
              <path d="M17 10L12 12V8L17 10Z" fill="white" opacity="0.5"/>
            </svg>
          </div>
          FinalPing
        </Link>
        <ul className="lp-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#demo">Live Demo</a></li>
          <li><Link href="/pricing">Pricing</Link></li>
        </ul>
        <Link href="/download" className="lp-nav-btn lp-mag">
          <IcoDownload /> Download Free
        </Link>
      </nav>

      {/* ── HERO ─────────────────────────────── */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'140px 24px 100px', position:'relative', overflow:'hidden', background:dark }}>
        {/* mesh orbs */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', width:900, height:900, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,233,0.1) 0%,transparent 65%)', top:-250, left:-180, animation:'lp-mesh1 16s ease-in-out infinite alternate', filter:'blur(60px)' }}/>
          <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(249,115,22,0.07) 0%,transparent 65%)', bottom:-100, right:-150, animation:'lp-mesh2 13s ease-in-out infinite alternate', filter:'blur(60px)' }}/>
          <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,233,0.05) 0%,transparent 65%)', top:'45%', left:'52%', animation:'lp-mesh3 20s ease-in-out infinite alternate', filter:'blur(60px)' }}/>
        </div>
        {/* grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(14,165,233,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.04) 1px,transparent 1px)', backgroundSize:'72px 72px', maskImage:'radial-gradient(ellipse 75% 75% at 50% 45%,black 0%,transparent 100%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:1100 }}>
          {/* live badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:9, background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.18)', color:skyL, fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', padding:'7px 18px', borderRadius:999, marginBottom:44, animation:'lp-fade-rise 0.7s 0.2s both' }}>
            <span className="lp-live-dot"/> Real-time ADS-B · Windows
          </div>

          {/* headline */}
          <h1 style={{ fontSize:'clamp(58px,9vw,136px)', fontWeight:900, letterSpacing:-5, lineHeight:0.91, marginBottom:32, color:dt }}>
            <span className="lp-ww"><span className="lp-w" style={{ animationDelay:'0.4s' }}>The&nbsp;</span></span>
            <span className="lp-ww"><span className="lp-w" style={{ animationDelay:'0.52s', color:sky }}>moment</span></span>
            <br/>
            <span className="lp-ww"><span className="lp-w" style={{ animationDelay:'0.66s' }}>an&nbsp;</span></span>
            <span className="lp-ww"><span className="lp-w" style={{ animationDelay:'0.76s' }}>aircraft&nbsp;</span></span>
            <span className="lp-ww"><span className="lp-w" style={{ animationDelay:'0.86s' }}>enters.</span></span>
            <br/>
            <span className="lp-ww"><span className="lp-w" style={{ animationDelay:'1.0s', color:ora }}>You&nbsp;</span></span>
            <span className="lp-ww"><span className="lp-w" style={{ animationDelay:'1.1s', color:ora }}>know.</span></span>
          </h1>

          <p style={{ fontSize:18, lineHeight:1.78, color:dm, maxWidth:460, margin:'0 auto 52px', animation:'lp-fade-rise 0.7s 1.15s both' }}>
            FinalPing watches the sky 24/7 and alerts you in under 3 seconds the moment any aircraft enters your custom zone.
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', animation:'lp-fade-rise 0.7s 1.35s both' }}>
            <Link href="/download" className="lp-btn-p lp-mag"><IcoDownload /> Download for Windows — Free</Link>
            <a href="#demo" className="lp-btn-g lp-mag">See it in action &nbsp;→</a>
          </div>
        </div>

        {/* scroll hint */}
        <div style={{ position:'absolute', bottom:36, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:10, animation:'lp-fade-rise 0.7s 1.9s both' }}>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:dm2 }}>Scroll</span>
          <div className="lp-scroll-line"/>
        </div>
      </section>

      {/* ── STAT STRIP ───────────────────────── */}
      <section style={{ background:light, borderTop:`1px solid ${lb}` }}>
        <div style={{ maxWidth:1320, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
          {[
            { count:'12000', suffix:'K+', label:'Active Users' },
            { count:'2.8', suffix:'s', dec:'1', label:'Avg Alert Time' },
            { count:'1000000', suffix:'M+', label:'Alerts Delivered' },
            { count:'180', suffix:'+', label:'Countries Covered' },
          ].map((s, i) => (
            <div key={i} data-reveal={`stat-${i}`}
              className={`lp-sr lp-d${i+1} ${sr(`stat-${i}`) ? 'lp-sr-on' : ''}`}
              style={{ padding:'52px 36px', borderRight: i < 3 ? `1px solid ${lb}` : 'none', textAlign:'center', cursor:'default', transition:'background .3s', position:'relative' }}
              onMouseEnter={e => (e.currentTarget.style.background = light2)}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <div data-count={s.count} data-suffix={s.suffix} data-dec={s.dec || '0'}
                style={{ fontSize:54, fontWeight:900, letterSpacing:-2.5, lineHeight:1, marginBottom:8, background:`linear-gradient(140deg,${lt} 0%,#1E4080 100%)`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>0{s.suffix}</div>
              <div style={{ fontSize:11, fontWeight:700, color:lm2, textTransform:'uppercase', letterSpacing:'1.2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATEMENT ────────────────────────── */}
      <section style={{ background:dark, padding:'160px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(14,165,233,0.06) 0%,transparent 65%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', filter:'blur(80px)' }}/>
        </div>
        <div style={{ maxWidth:860, margin:'0 auto', position:'relative', zIndex:1 }}>
          <p data-reveal="stmt-pre" className={`lp-sr ${sr('stmt-pre') ? 'lp-sr-on' : ''}`}
            style={{ fontSize:'clamp(15px,1.8vw,20px)', color:dm2, fontWeight:400, lineHeight:1.65, marginBottom:52, fontStyle:'italic' }}>
            "I saw it climbing overhead and didn't even know it was coming.<br/>That was before FinalPing."
          </p>
          <h2 data-reveal="stmt-h" className={`lp-sr lp-d1 ${sr('stmt-h') ? 'lp-sr-on' : ''}`}
            style={{ fontSize:'clamp(48px,7.5vw,108px)', fontWeight:900, letterSpacing:-4, lineHeight:0.94, color:dt }}>
            The sky just<br/><span style={{ color:sky }}>notified you.</span>
          </h2>
          <p data-reveal="stmt-p" className={`lp-sr lp-d2 ${sr('stmt-p') ? 'lp-sr-on' : ''}`}
            style={{ fontSize:'clamp(17px,2vw,22px)', color:dm, lineHeight:1.75, marginTop:36, fontWeight:400 }}>
            No more scanning the sky and wondering. FinalPing tracks ADS-B signals across the globe and fires a push alert the instant any aircraft crosses into your zone.
          </p>
        </div>
      </section>

      {/* ── HORIZONTAL SCROLL FEATURES ───────── */}
      <div ref={hsOuterRef} id="features" style={{ height:'calc(100vh * 4)', position:'relative' }}>
        <div style={{ position:'sticky', top:0, height:'100vh', overflow:'hidden', background:light }}>
          <div ref={hsTrackRef} style={{ display:'flex', width:'calc(100vw * 4)', height:'100%', willChange:'transform' }}>

            {/* Panel 1: Custom Zones */}
            <HPanel num="01" tag="Feature 01" tagColor={sky} title="Custom Alert Zones" desc="Draw any shape anywhere on earth. A circle over your backyard or a polygon over an entire city — FinalPing monitors it all.">
              <div style={{ width:'100%', maxWidth:480, background:dark2, border:`1px solid ${db}`, borderRadius:24, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.22),0 16px 32px rgba(0,0,0,0.16)' }}>
                <PVBar/>
                <div style={{ padding:12 }}>
                  <div style={{ position:'relative', height:260, borderRadius:16, overflow:'hidden', background:'#0A1628' }}>
                    <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(14,165,233,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.07) 1px,transparent 1px)', backgroundSize:'36px 36px' }}/>
                    <div style={{ position:'absolute', top:'50%', left:'50%', width:160, height:160, borderRadius:'50%', transform:'translate(-50%,-50%)', background:'rgba(14,165,233,0.06)' }}/>
                    <div className="lp-zone-ring"/>
                    <div className="lp-blip lp-b1" style={{ background:sky, color:sky, top:'38%', left:'48%' }}/>
                    <div className="lp-blip lp-b2" style={{ background:'#22C55E', color:'#22C55E', top:'55%', left:'57%' }}/>
                    <div className="lp-blip lp-b3" style={{ background:ora, color:ora, top:'42%', left:'36%' }}/>
                    <div style={{ position:'absolute', top:10, left:12, fontSize:10, fontWeight:700, color:'rgba(14,165,233,0.7)', letterSpacing:1 }}>ZONE-ALPHA</div>
                    <div style={{ position:'absolute', bottom:8, right:10, fontSize:9, fontFamily:'monospace', color:'rgba(232,237,248,0.25)' }}>40.7128°N 74.0060°W · r=12nm</div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, padding:'0 4px' }}>
                    <span style={{ fontSize:11, color:'rgba(14,165,233,0.8)', fontWeight:700 }}>3 aircraft in zone</span>
                    <span style={{ fontSize:11, color:'rgba(232,237,248,0.3)', fontFamily:'monospace' }}>LIVE</span>
                  </div>
                </div>
              </div>
            </HPanel>

            {/* Panel 2: Sub-3s Alerts */}
            <HPanel num="02" tag="Feature 02" tagColor={ora} title="Sub-3s Alert Speed" desc="ADS-B data refreshes every second. FinalPing processes each frame and pushes a notification to your desktop before the aircraft even settles into your zone.">
              <div style={{ width:'100%', maxWidth:480, background:dark2, border:`1px solid ${db}`, borderRadius:24, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.22)' }}>
                <PVBar/>
                <div style={{ padding:24 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'8px 0 16px' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:sky, letterSpacing:1, textTransform:'uppercase', marginBottom:16 }}>Average alert time</div>
                    <div style={{ position:'relative', width:180, height:180, marginBottom:20 }}>
                      <svg viewBox="0 0 180 180" style={{ width:180, height:180, transform:'rotate(-90deg)' }}>
                        <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="6"/>
                        <circle cx="90" cy="90" r="80" className="lp-tr-fill"/>
                      </svg>
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:48, fontWeight:900, letterSpacing:-2, lineHeight:1, color:dt }}>2.8</span>
                        <span style={{ fontSize:11, color:dm2, letterSpacing:1, fontWeight:600, textTransform:'uppercase' }}>seconds</span>
                      </div>
                    </div>
                    <div style={{ background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.25)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, width:'100%', animation:'lp-toast 3s ease-in-out 0.7s infinite' }}>
                      <div style={{ width:32, height:32, background:ora, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.95 7.05a19.7 19.7 0 01-3-8.59A2 2 0 012.93 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8.73A16 16 0 0015.05 16l1.56-1.56a2 2 0 012.12-.45c.907.339 1.85.573 2.81.7A2 2 0 0123 16.92z"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:dt }}>Aircraft Entered Zone</div>
                        <div style={{ fontSize:11, color:dm2, marginTop:2 }}>N172AK · Boeing 737 · 14,500ft</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </HPanel>

            {/* Panel 3: Smart Filters */}
            <HPanel num="03" tag="Feature 03" tagColor={sky} title="Smart Filters" desc="Only care about jets above 10,000ft? Filter by altitude, aircraft type, callsign, airline, or registration. Your alerts, your rules — zero noise.">
              <div style={{ width:'100%', maxWidth:480, background:dark2, border:`1px solid ${db}`, borderRadius:24, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.22)' }}>
                <PVBar/>
                <div style={{ padding:0 }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'16px 16px 0' }}>
                    {[['Jets only',true],['Alt >10,000ft',true],['Turboprops',false],['Commercial',true],['Military',false],['Helicopters',false]].map(([label,on]) => (
                      <div key={label as string} style={{ padding:'5px 12px', borderRadius:999, fontSize:11, fontWeight:700, letterSpacing:.3, background: on ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)', border: on ? '1px solid rgba(14,165,233,0.35)' : `1px solid ${db}`, color: on ? skyL : dm2 }}>{label}</div>
                    ))}
                  </div>
                  {[
                    { call:'UAL1234', type:'Boeing 737 · 24,500ft', color:ora, badge:'ALERT', bc:'rgba(249,115,22,0.18)', btc:'#FB923C' },
                    { call:'DAL892',  type:'Airbus A320 · 31,000ft', color:sky, badge:'14:22', bc:'rgba(14,165,233,0.1)', btc:skyL },
                    { call:'AAL543',  type:'Boeing 777 · 35,000ft', color:'#22C55E', badge:'14:18', bc:'rgba(34,197,94,0.1)', btc:'#4ADE80' },
                  ].map((r, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderTop:`1px solid ${db}`, marginTop: i===0 ? 12 : 0 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:r.color, flexShrink:0 }}/>
                      <span style={{ fontWeight:800, fontFamily:'monospace', fontSize:13, color:dt, letterSpacing:.5 }}>{r.call}</span>
                      <span style={{ fontSize:12, color:dm, flex:1 }}>{r.type}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, background:r.bc, color:r.btc }}>{r.badge}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderTop:`1px solid ${db}`, opacity:.4 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:dm2, flexShrink:0 }}/>
                    <span style={{ fontWeight:800, fontFamily:'monospace', fontSize:13, color:dm2, letterSpacing:.5 }}>N3829K</span>
                    <span style={{ fontSize:12, color:dm2, flex:1 }}>Cessna 172 · 2,800ft</span>
                    <span style={{ fontSize:10, color:dm2 }}>filtered</span>
                  </div>
                </div>
              </div>
            </HPanel>

            {/* Panel 4: Teams */}
            <HPanel num="04" tag="Feature 04" tagColor={ora} title="Teams Mode" desc="Share zones across your whole crew. When anyone gets an alert, everyone does. Perfect for aviation clubs, airshows, and spotter groups.">
              <div style={{ width:'100%', maxWidth:480, background:dark2, border:`1px solid ${db}`, borderRadius:24, overflow:'hidden', boxShadow:'0 40px 80px rgba(0,0,0,0.22)' }}>
                <PVBar/>
                <div style={{ padding:20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:dt }}>Spotter Crew · 5 members</span>
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#4ADE80', fontWeight:600 }}><span className="lp-live-dot"/>3 online</span>
                  </div>
                  <div style={{ display:'flex', marginBottom:16 }}>
                    {[['AJ','linear-gradient(135deg,#0EA5E9,#0284C7)',true],['MK','linear-gradient(135deg,#F97316,#EA580C)',true],['SR','linear-gradient(135deg,#8B5CF6,#7C3AED)',true],['PL','#2A3848',false],['TW','#2A3848',false]].map(([initials,bg,online],i) => (
                      <div key={i} style={{ width:34, height:34, borderRadius:'50%', border:`2px solid ${dark2}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color: online ? 'white' : dm2, background:bg as string, marginLeft: i > 0 ? -10 : 0, position:'relative', zIndex:5-i, flexShrink:0 }}>
                        {initials}
                        {online && <div style={{ position:'absolute', bottom:0, right:0, width:9, height:9, background:'#22C55E', borderRadius:'50%', border:`1.5px solid ${dark2}` }}/>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {[
                      { initials:'AJ', bg:'linear-gradient(135deg,#0EA5E9,#0284C7)', text:'AJ got an alert · N172AK entered Zone Alpha', time:'just now' },
                      { initials:'MK', bg:'linear-gradient(135deg,#F97316,#EA580C)', text:'MK updated Zone Beta boundary', time:'3 min ago' },
                      { initials:'SR', bg:'linear-gradient(135deg,#8B5CF6,#7C3AED)', text:'SR added filter: Commercial jets only', time:'8 min ago' },
                    ].map((item, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'9px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:`1px solid ${db}` }}>
                        <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'white', background:item.bg, flexShrink:0 }}>{item.initials}</div>
                        <div>
                          <div style={{ fontSize:12, color:dm, lineHeight:1.5 }}>{item.text}</div>
                          <div style={{ fontSize:10, color:dm2, marginTop:2 }}>{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </HPanel>

          </div>

          {/* progress dots */}
          <div style={{ position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)', display:'flex', gap:7, zIndex:10 }}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`lp-hpd${panel===i ? ' lp-hpd-on' : ''}`}/>
            ))}
          </div>
        </div>
      </div>

      {/* ── DEMO SECTION ─────────────────────── */}
      <section id="demo" style={{ background:light2, padding:'140px 24px', borderTop:`1px solid ${lb}` }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1.15fr', gap:100, alignItems:'center' }}>
          <div data-reveal="demo-l" className={`lp-srl ${sr('demo-l') ? 'lp-srl-on' : ''}`}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:20, color:sky }}>
              <span style={{ width:24, height:1, background:sky, opacity:.45, display:'inline-block' }}/>Live Feed
            </div>
            <h2 style={{ fontSize:'clamp(40px,5.5vw,72px)', fontWeight:900, letterSpacing:-3, lineHeight:1.02, color:lt, marginBottom:16 }}>
              Your airspace,<br/>in real time.
            </h2>
            <p style={{ fontSize:16, color:lm, lineHeight:1.82, maxWidth:440, marginBottom:36 }}>
              The FinalPing alert feed updates live as aircraft enter, transit, and leave your zones. Every alert timestamped to the millisecond.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, bg:'rgba(14,165,233,0.1)', title:'Sub-3s delivery', desc:'From ADS-B detection to Windows notification in under 3 seconds.' },
                { ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><path d="M22 17H2a3 3 0 000 6h20a3 3 0 000-6z"/><path d="M6 17V7a6 6 0 0112 0v10"/></svg>, bg:'rgba(249,115,22,0.1)', title:'Zero missed alerts', desc:'Runs in the background, even when the app window is closed.' },
                { ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, bg:'rgba(34,197,94,0.1)', title:'Full flight data', desc:'Callsign, aircraft type, altitude, speed, heading — all in the alert.' },
              ].map((f,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:18, background:'white', border:`1px solid ${lb}`, borderRadius:12, transition:'border-color .25s,box-shadow .25s', cursor:'default' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(14,165,233,0.3)';e.currentTarget.style.boxShadow='0 6px 24px rgba(14,165,233,0.08)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=lb;e.currentTarget.style.boxShadow=''}}>
                  <div style={{ width:36, height:36, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:f.bg, flexShrink:0 }}>{f.ico}</div>
                  <div><div style={{ fontSize:13, fontWeight:700, color:lt, marginBottom:3 }}>{f.title}</div><div style={{ fontSize:12, color:lm, lineHeight:1.6 }}>{f.desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div data-reveal="demo-r" className={`lp-srr ${sr('demo-r') ? 'lp-srr-on' : ''}`}>
            <div style={{ background:dark, border:`1px solid ${db}`, borderRadius:20, overflow:'hidden', boxShadow:'0 44px 88px rgba(0,0,0,0.22),0 18px 36px rgba(0,0,0,0.14)' }}>
              <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.025)', borderBottom:`1px solid ${db}`, display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:'#FF5F57' }}/><div style={{ width:9, height:9, borderRadius:'50%', background:'#FEBC2E' }}/><div style={{ width:9, height:9, borderRadius:'50%', background:'#28C840' }}/>
                <div style={{ marginLeft:16, display:'flex', gap:2 }}>
                  {['Alert Feed','Zones','Settings'].map((t,i) => (
                    <div key={t} style={{ fontSize:11, padding:'4px 12px', borderRadius:5, color: i===0 ? dt : dm2, background: i===0 ? 'rgba(255,255,255,0.07)' : 'transparent' }}>{t}</div>
                  ))}
                </div>
              </div>
              <div ref={feedRef} style={{ padding:12, display:'flex', flexDirection:'column', gap:7, minHeight:280 }}>
                {[
                  { call:'N172AK', type:'Boeing 737 · Zone Alpha · 14,500ft · 420kts', cls:'lp-da-new', badge:'NEW', bc:'lp-badge-n', dc:'#FB923C', tc:'#FB923C', ts:'14:23:07' },
                  { call:'UAL889', type:'Boeing 777 · Zone Alpha · 31,200ft · 510kts', cls:'lp-da-live', badge:'LIVE', bc:'lp-badge-l', dc:'#4ADE80', tc:'#4ADE80', ts:'14:21:52' },
                  { call:'DAL1201',type:'Airbus A320 · Zone Beta · 22,000ft · 390kts',cls:'lp-da-past',badge:'EXIT',bc:'lp-badge-p',dc:'rgba(232,237,248,0.3)',tc:'rgba(232,237,248,0.6)',ts:'14:19:34' },
                  { call:'AAL543', type:'Boeing 777 · Zone Alpha · 35,000ft · 560kts', cls:'lp-da-past', badge:'PAST',bc:'lp-badge-p',dc:'rgba(232,237,248,0.3)',tc:'rgba(232,237,248,0.6)',ts:'14:17:08' },
                ].map((a,i) => (
                  <div key={i} className={`lp-da ${a.cls}`} style={{ animationDelay: `${i*0.15}s` }}>
                    <div className="lp-da-dot" style={{ background:a.dc }}/>
                    <span className="lp-da-call" style={{ color:a.tc }}>{a.call}</span>
                    <span className="lp-da-info">{a.type}</span>
                    <span className={`lp-da-badge ${a.bc}`}>{a.badge}</span>
                    <span className="lp-da-time">{a.ts}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding:'10px 16px', borderTop:`1px solid ${db}`, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:dm2 }}><span className="lp-live-dot"/>Live · 2.1s latency</span>
                <span style={{ marginLeft:'auto', fontSize:10.5, color:dm2, fontFamily:'monospace' }}>5 alerts today</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────── */}
      <section style={{ background:dark, padding:'140px 24px' }}>
        <div style={{ maxWidth:1280, margin:'0 auto' }}>
          <div data-reveal="testi-h" className={`lp-sr ${sr('testi-h') ? 'lp-sr-on' : ''}`}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:20, color:sky }}>
              <span style={{ width:24, height:1, background:sky, opacity:.45, display:'inline-block' }}/>Reviews
            </div>
            <h2 style={{ fontSize:'clamp(40px,5.5vw,72px)', fontWeight:900, letterSpacing:-3, lineHeight:1.02, color:dt, marginBottom:72 }}>
              Loved by<br/><span style={{ color:sky }}>spotters worldwide.</span>
            </h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
            {[
              { stars:5, text:'"I\'ve tried every flight tracker out there. FinalPing is the only one that actually wakes me up in time. 2.8 seconds is insane. Nothing else comes close."', initials:'MR', bg:'linear-gradient(135deg,#0EA5E9,#0284C7)', name:'Marcus R.', role:'Aviation photographer · Portland, OR' },
              { stars:5, text:'"Our club uses the Teams version for airshow coverage. Everyone gets the same alert simultaneously. We haven\'t missed a single pass in two seasons."', initials:'SK', bg:'linear-gradient(135deg,#F97316,#EA580C)', name:'Sarah K.', role:'Club president · Pacific Aviation Spotters' },
              { stars:5, text:'"The custom zone drawing is so good. I drew a precise corridor over my property and FinalPing only alerts me for the planes I care about. Zero noise."', initials:'JT', bg:'linear-gradient(135deg,#8B5CF6,#7C3AED)', name:'James T.', role:'Enthusiast · Denver, CO' },
            ].map((t, i) => (
              <div key={i} data-reveal={`tc-${i}`} className={`lp-tc lp-sr lp-d${i+1} ${sr(`tc-${i}`) ? 'lp-sr-on' : ''}`}>
                <div style={{ display:'flex', gap:3, marginBottom:18, fontSize:15, color:'#FBBF24' }}>{'★'.repeat(t.stars)}</div>
                <p style={{ fontSize:15, lineHeight:1.82, color:dm, fontStyle:'italic', marginBottom:28 }}>{t.text}</p>
                <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'white', background:t.bg, flexShrink:0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:dt }}>{t.name}</div>
                    <div style={{ fontSize:11, color:dm2, marginTop:2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────── */}
      <section id="pricing" style={{ background:light, padding:'140px 24px', borderTop:`1px solid ${lb}` }}>
        <div style={{ maxWidth:860, margin:'0 auto', textAlign:'center' }}>
          <div data-reveal="price-h" className={`lp-sr ${sr('price-h') ? 'lp-sr-on' : ''}`}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:20, color:sky, justifyContent:'center' }}>
              <span style={{ width:24, height:1, background:sky, opacity:.45, display:'inline-block' }}/>Pricing
            </div>
            <h2 style={{ fontSize:'clamp(40px,5.5vw,72px)', fontWeight:900, letterSpacing:-3, lineHeight:1.02, color:lt, marginBottom:12 }}>Simple, honest pricing.</h2>
            <p style={{ fontSize:16, color:lm, lineHeight:1.82, marginBottom:64 }}>Start free. Upgrade when your crew does.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, textAlign:'left' }}>
            {/* Free */}
            <div data-reveal="pc-0" className={`lp-sr ${sr('pc-0') ? 'lp-sr-on' : ''}`}
              style={{ background:'white', border:`1.5px solid ${lb}`, borderRadius:24, padding:44, position:'relative', overflow:'hidden', transition:'transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s', cursor:'default' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow='0 24px 60px rgba(0,0,0,0.09)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', color:lm2, marginBottom:10 }}>Personal</div>
              <div style={{ fontSize:68, fontWeight:900, letterSpacing:-3.5, lineHeight:1, color:lt }}><sup style={{ fontSize:22, fontWeight:500, letterSpacing:0, verticalAlign:'top', marginTop:14, display:'inline-block' }}>$</sup>0</div>
              <div style={{ fontSize:12.5, color:lm2, marginTop:5, marginBottom:18 }}>forever free</div>
              <div style={{ height:1, background:lb, margin:'18px 0' }}/>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:11, marginBottom:32 }}>
                {['Up to 3 alert zones','Real-time ADS-B tracking','Windows push notifications','Basic filters (altitude, type)'].map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, color:lm }}>
                    <div style={{ width:17, height:17, borderRadius:5, background:'rgba(14,165,233,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcoCheck/></div>{f}
                  </li>
                ))}
                <li style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, color:lm2, opacity:.6 }}>
                  <div style={{ width:17, height:17, borderRadius:5, background:'rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcoCheckGray/></div>Teams mode (Pro)
                </li>
              </ul>
              <button className="lp-mag" style={{ width:'100%', padding:14, borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', border:'none', fontFamily:'inherit', background:lt, color:'white', transition:'all .2s' }}
                onMouseEnter={e=>{e.currentTarget.style.background=sky;e.currentTarget.style.boxShadow='0 6px 24px rgba(14,165,233,0.4)'}}
                onMouseLeave={e=>{e.currentTarget.style.background=lt;e.currentTarget.style.boxShadow=''}}>
                Download Free
              </button>
            </div>

            {/* Pro Teams */}
            <div data-reveal="pc-1" className={`lp-sr lp-d1 ${sr('pc-1') ? 'lp-sr-on' : ''}`}
              style={{ background:dark, border:'1.5px solid transparent', borderRadius:24, padding:44, position:'relative', overflow:'hidden', transition:'transform .35s cubic-bezier(.2,.8,.2,1)', cursor:'default' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              <div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', background:sky, color:'white', fontSize:9.5, fontWeight:800, padding:'5px 20px', borderRadius:'0 0 12px 12px', textTransform:'uppercase', letterSpacing:1 }}>Most Popular</div>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', color:dm2, marginBottom:10, marginTop:12 }}>Pro Teams</div>
              <div style={{ fontSize:68, fontWeight:900, letterSpacing:-3.5, lineHeight:1, color:'white' }}><sup style={{ fontSize:22, fontWeight:500, letterSpacing:0, verticalAlign:'top', marginTop:14, display:'inline-block' }}>$</sup>12</div>
              <div style={{ fontSize:12.5, color:dm2, marginTop:5, marginBottom:18 }}>per member / month</div>
              <div style={{ height:1, background:db, margin:'18px 0' }}/>
              <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:11, marginBottom:32 }}>
                {['Unlimited alert zones','Shared zones across team','All advanced filters','Priority 1s polling rate','Alert history + export'].map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, color:dm }}>
                    <div style={{ width:17, height:17, borderRadius:5, background:'rgba(14,165,233,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcoCheck/></div>{f}
                  </li>
                ))}
              </ul>
              <button className="lp-mag" style={{ width:'100%', padding:14, borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', border:'none', fontFamily:'inherit', background:ora, color:'white', boxShadow:'0 4px 20px rgba(249,115,22,0.35)', transition:'all .2s' }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 32px rgba(249,115,22,0.55)';e.currentTarget.style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 4px 20px rgba(249,115,22,0.35)';e.currentTarget.style.transform=''}}>
                Start Teams Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section style={{ background:dark, padding:'160px 24px', textAlign:'center', position:'relative', overflow:'hidden', borderTop:`1px solid ${db}` }}>
        <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:900, height:600, background:'radial-gradient(circle,rgba(14,165,233,0.09) 0%,transparent 65%)', filter:'blur(40px)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <div data-reveal="cta-h" className={`lp-sr ${sr('cta-h') ? 'lp-sr-on' : ''}`}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:20, color:sky, justifyContent:'center' }}>
              <span style={{ width:24, height:1, background:sky, opacity:.45, display:'inline-block' }}/>Download
            </div>
            <h2 style={{ fontSize:'clamp(50px,8vw,120px)', fontWeight:900, letterSpacing:-5, lineHeight:0.93, color:dt, marginBottom:24 }}>
              The sky is<br/><span style={{ color:sky }}>talking.</span>
            </h2>
            <p style={{ fontSize:17, color:dm, lineHeight:1.78, marginBottom:48, maxWidth:420, marginLeft:'auto', marginRight:'auto' }}>
              Download FinalPing free and start hearing it within 60 seconds.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/download" className="lp-btn-p lp-mag"><IcoDownload /> Download for Windows — Free</Link>
              <a href="https://github.com" className="lp-btn-g lp-mag">View on GitHub →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer style={{ background:'#030812', padding:'32px 60px', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:22, height:22, background:'linear-gradient(135deg,#0EA5E9,#0284C7)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" fill="white"/><path d="M10 3L12 8H8L10 3Z" fill="white" opacity="0.7"/></svg>
          </div>
          FinalPing
        </div>
        <div style={{ display:'flex', gap:22 }}>
          {[['Privacy','#'],['Terms','#'],['GitHub','#'],['Support','#']].map(([label,href]) => (
            <Link key={label} href={href} style={{ color:'rgba(255,255,255,0.22)', fontSize:12.5, textDecoration:'none', transition:'color .2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.55)')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.22)')}>{label}</Link>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, color:'rgba(255,255,255,0.18)' }}>
          <span className="lp-live-dot"/>All systems operational
        </div>
      </footer>
    </>
  );
}

/* ── Shared sub-components ── */
function PVBar() {
  return (
    <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.02)' }}>
      <div style={{ width:9, height:9, borderRadius:'50%', background:'#FF5F57' }}/>
      <div style={{ width:9, height:9, borderRadius:'50%', background:'#FEBC2E' }}/>
      <div style={{ width:9, height:9, borderRadius:'50%', background:'#28C840' }}/>
    </div>
  );
}

function HPanel({ num, tag, tagColor, title, desc, children }: {
  num: string; tag: string; tagColor: string; title: string; desc: string; children: React.ReactNode;
}) {
  const lt = '#0C1428', lm = '#64748B', lb = 'rgba(14,74,110,0.09)';
  return (
    <div style={{ width:'100vw', height:'100%', flexShrink:0, display:'grid', gridTemplateColumns:'1fr 1fr', alignItems:'center', padding:'0 80px 0 100px', borderLeft:`1px solid ${lb}` }}>
      <div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:10, fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:20, color:tagColor }}>
          <span style={{ width:24, height:1, background:tagColor, opacity:.45, display:'inline-block' }}/>{tag}
        </div>
        <div style={{ fontSize:110, fontWeight:900, letterSpacing:-7, lineHeight:1, marginBottom:24, background:'linear-gradient(135deg,rgba(14,74,110,0.08) 0%,rgba(14,165,233,0.12) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{num}</div>
        <h3 style={{ fontSize:'clamp(38px,4.2vw,64px)', fontWeight:900, letterSpacing:-2.5, lineHeight:1.04, color:lt, marginBottom:18 }}>{title}</h3>
        <p style={{ fontSize:16, color:lm, lineHeight:1.85, maxWidth:380 }}>{desc}</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', padding:'60px 40px' }}>
        {children}
      </div>
    </div>
  );
}
