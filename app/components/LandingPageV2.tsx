'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const GlobeScene = dynamic(() => import('./GlobeScene'), { ssr: false });

/* ── tokens ─────────────────────────────────────────────── */
const C = {
  bg:     '#04060F',
  bg2:    '#070B17',
  sky:    '#0EA5E9',
  skyL:   '#38BDF8',
  ora:    '#F97316',
  cyan:   '#00D4FF',
  green:  '#00C853',
  dt:     '#E8EDF8',
  dm:     'rgba(232,237,248,0.5)',
  dm2:    'rgba(232,237,248,0.22)',
  db:     'rgba(255,255,255,0.07)',
  db2:    'rgba(255,255,255,0.04)',
};

/* ── helpers ─────────────────────────────────────────────── */
function Eyebrow({ color = C.cyan, children }: { color?: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:10, fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color, marginBottom:20 }}>
      <span style={{ width:20, height:1, background:color, opacity:.5 }}/>
      {children}
    </div>
  );
}

function LiveDot({ color = C.green }: { color?: string }) {
  return (
    <span style={{ width:7, height:7, background:color, borderRadius:'50%', display:'inline-block', flexShrink:0,
      boxShadow:`0 0 0 2px ${color}33`, animation:'v2-pulse 2.2s infinite' }}/>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function LandingPageV2() {
  const [reveals, setReveals] = useState<Set<string>>(new Set());
  const [alertVis, setAlertVis]   = useState(false);
  const [alertCall, setAlertCall] = useState('');
  const [scrollPct, setScrollPct] = useState(0);
  const navRef = useRef<HTMLElement>(null);

  /* body override */
  useEffect(() => {
    document.body.classList.add('landing-mode');
    document.body.style.background = C.bg;
    return () => {
      document.body.classList.remove('landing-mode');
      document.body.style.background = '';
    };
  }, []);

  /* scroll */
  useEffect(() => {
    const onScroll = () => {
      const p = window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1);
      setScrollPct(p);
      navRef.current?.classList.toggle('v2-nav-scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* demo alert pops */
  useEffect(() => {
    const calls = ['N172AK', 'UAL889', 'DAL201', 'JBU192', 'AAL543'];
    let idx = 0;
    const fire = () => {
      setAlertCall(calls[idx++ % calls.length]);
      setAlertVis(true);
      setTimeout(() => setAlertVis(false), 3200);
    };
    fire();
    const iv = setInterval(fire, 5000);
    return () => clearInterval(iv);
  }, []);

  /* counters */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const to  = parseFloat(el.dataset.to  || '0');
        const suf = el.dataset.suf || '';
        const dec = parseInt(el.dataset.dec   || '0');
        let i = 0; const N = 60;
        const iv = setInterval(() => {
          i++;
          const val = to * (1 - Math.pow(1 - i/N, 4));
          el.textContent = (dec ? val.toFixed(dec) : Math.round(val).toLocaleString()) + suf;
          if (i >= N) { el.textContent = (dec ? to.toFixed(dec) : to.toLocaleString()) + suf; clearInterval(iv); }
        }, 1600 / N);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-to]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const on = (id: string) => reveals.has(id);
  const sr = (id: string, d = 0) =>
    `v2-sr${on(id) ? ' v2-on' : ''}` + (d ? ` v2-d${d}` : '');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

        .v2-root { font-family:'Plus Jakarta Sans',system-ui,sans-serif; }

        /* nav */
        .v2-nav { position:fixed;top:20px;left:50%;transform:translateX(-50%);width:min(calc(100% - 40px),1300px);height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-radius:16px;z-index:1000;border:1px solid transparent;transition:background .4s,border-color .4s,backdrop-filter .5s; }
        .v2-nav-scrolled { background:rgba(4,6,15,0.9)!important;border-color:rgba(255,255,255,0.07)!important;backdrop-filter:blur(24px)!important; }
        .v2-logo { display:flex;align-items:center;gap:10px;font-size:17px;font-weight:800;letter-spacing:-.5px;color:white;text-decoration:none; }
        .v2-logo-mark { width:30px;height:30px;background:linear-gradient(135deg,${C.sky},#0066CC);border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(14,165,233,0.4);animation:v2-glow 2.5s ease-in-out infinite alternate; }
        @keyframes v2-glow { from{box-shadow:0 0 10px rgba(14,165,233,0.3)} to{box-shadow:0 0 30px rgba(14,165,233,0.7)} }
        .v2-nav ul { display:flex;gap:28px;list-style:none;margin:0;padding:0; }
        .v2-nav a { font-size:13px;font-weight:500;color:${C.dm};text-decoration:none;transition:color .2s; }
        .v2-nav a:hover { color:${C.dt}; }
        .v2-dl-btn { display:flex;align-items:center;gap:8px;background:${C.ora};color:white;padding:9px 20px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 20px rgba(249,115,22,0.35);position:relative;overflow:hidden; }
        .v2-dl-btn::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.2),transparent); }
        .v2-dl-btn:hover { transform:translateY(-1px);box-shadow:0 8px 32px rgba(249,115,22,0.55); }

        /* scroll reveals */
        .v2-sr { opacity:0;transform:translateY(40px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1); }
        .v2-on { opacity:1!important;transform:none!important; }
        .v2-d1{transition-delay:.07s}.v2-d2{transition-delay:.14s}.v2-d3{transition-delay:.21s}.v2-d4{transition-delay:.28s}.v2-d5{transition-delay:.35s}

        /* alert toast */
        .v2-toast { position:fixed;top:96px;right:28px;z-index:999;background:rgba(249,115,22,0.12);border:1px solid rgba(249,115,22,0.35);border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(20px);transition:transform .45s cubic-bezier(.16,1,.3,1),opacity .45s;min-width:260px;max-width:320px; }
        .v2-toast-hidden { transform:translateY(-12px) scale(.97);opacity:0;pointer-events:none; }
        .v2-toast-vis   { transform:none;opacity:1; }

        @keyframes v2-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(0,200,83,0.25)}50%{box-shadow:0 0 0 7px rgba(0,200,83,0)} }
        @keyframes v2-ora-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(249,115,22,0.25)}50%{box-shadow:0 0 0 7px rgba(249,115,22,0)} }

        /* feature cards */
        .v2-card { background:${C.bg2};border:1px solid ${C.db};border-radius:20px;overflow:hidden;position:relative;transition:border-color .3s,transform .35s cubic-bezier(.2,.8,.2,1);cursor:default; }
        .v2-card::before { content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(14,165,233,0.06) 0%,transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none; }
        .v2-card:hover { border-color:rgba(14,165,233,0.2)!important;transform:translateY(-4px)!important; }
        .v2-card:hover::before { opacity:1; }

        /* progress */
        .v2-prog { position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,${C.sky},${C.ora});z-index:9999;transition:width .1s linear; }

        /* section heading */
        .v2-h2 { font-size:clamp(42px,5.5vw,76px);font-weight:900;letter-spacing:-3px;line-height:1.02;color:${C.dt};margin-bottom:18px; }

        /* stat glow text */
        .v2-stat-num { font-size:clamp(52px,6vw,88px);font-weight:900;letter-spacing:-3px;line-height:1;background:linear-gradient(135deg,white 0%,${C.skyL} 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }

        /* live feed row */
        .v2-row { display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;font-size:12.5px;opacity:0;transform:translateX(-10px);transition:opacity .4s,transform .4s; }
        .v2-row-vis { opacity:1!important;transform:none!important; }
        .v2-row-new  { background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.18); }
        .v2-row-live { background:rgba(0,200,83,0.06);border:1px solid rgba(0,200,83,0.15); }
        .v2-row-past { background:rgba(255,255,255,0.02);border:1px solid ${C.db}; }

        /* btn */
        .v2-btn-p { display:inline-flex;align-items:center;gap:10px;background:${C.ora};color:white;padding:17px 38px;border-radius:14px;font-weight:700;font-size:16px;text-decoration:none;cursor:pointer;position:relative;overflow:hidden;transition:transform .22s,box-shadow .22s;box-shadow:0 4px 28px rgba(249,115,22,0.4);border:none;font-family:inherit; }
        .v2-btn-p::before { content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.2),transparent 55%); }
        .v2-btn-p:hover { transform:translateY(-2px);box-shadow:0 12px 40px rgba(249,115,22,0.6); }
        .v2-btn-g { display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.06);color:${C.dm};padding:17px 30px;border-radius:14px;font-weight:600;font-size:16px;text-decoration:none;cursor:pointer;border:1px solid ${C.db};transition:all .22s;font-family:inherit; }
        .v2-btn-g:hover { background:rgba(255,255,255,0.1);color:${C.dt}; }

        @media(prefers-reduced-motion:reduce){ .v2-sr{opacity:1;transform:none} * { animation-duration:.01ms!important;transition-duration:.01ms!important } }
      `}</style>

      {/* progress */}
      <div className="v2-prog" style={{ width: `${scrollPct * 100}%` }}/>

      {/* alert toast */}
      <div className={`v2-toast ${alertVis ? 'v2-toast-vis' : 'v2-toast-hidden'}`}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:C.ora, flexShrink:0, animation:'v2-ora-pulse 1.5s infinite' }}/>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.dt, marginBottom:2 }}>Aircraft Entered Zone</div>
          <div style={{ fontSize:11, color:C.dm2 }}>{alertCall} · NYC Zone Alpha · 14,500ft</div>
        </div>
        <div style={{ marginLeft:'auto', fontSize:10, color:C.ora, fontWeight:700, fontFamily:'monospace' }}>2.4s</div>
      </div>

      <div className="v2-root">

        {/* ══ NAV ════════════════════════════════ */}
        <nav ref={navRef} className="v2-nav">
          <Link href="/" className="v2-logo">
            <div className="v2-logo-mark">
              <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" fill="white"/>
                <path d="M10 3L12 8H8L10 3Z" fill="white" opacity=".7"/>
                <path d="M10 17L8 12H12L10 17Z" fill="white" opacity=".7"/>
                <path d="M3 10L8 8V12L3 10Z" fill="white" opacity=".5"/>
                <path d="M17 10L12 12V8L17 10Z" fill="white" opacity=".5"/>
              </svg>
            </div>
            FinalPing
          </Link>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#demo">Demo</a></li>
            <li><Link href="/pricing">Pricing</Link></li>
          </ul>
          <Link href="/download" className="v2-dl-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Free
          </Link>
        </nav>

        {/* ══ HERO ════════════════════════════════ */}
        <section style={{ position:'relative', height:'100vh', overflow:'hidden', background:C.bg, display:'flex', alignItems:'center' }}>
          {/* globe fills right ~65% */}
          <div style={{ position:'absolute', inset:0 }}>
            <GlobeScene style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} className="" />
          </div>

          {/* dark vignette left */}
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, ${C.bg} 30%, ${C.bg}99 50%, transparent 75%)`, pointerEvents:'none' }}/>
          {/* bottom fade */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:200, background:`linear-gradient(to top,${C.bg},transparent)`, pointerEvents:'none' }}/>

          {/* hero text — left side */}
          <div style={{ position:'relative', zIndex:2, paddingLeft:'clamp(32px,8vw,120px)', maxWidth:680 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:9, background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.18)', color:C.cyan, fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', padding:'7px 18px', borderRadius:999, marginBottom:40, animation:'v2-sr .7s .2s both' }}>
              <LiveDot color={C.green}/> Real-time ADS-B · Worldwide
            </div>

            <h1 style={{ fontSize:'clamp(56px,6.5vw,100px)', fontWeight:900, letterSpacing:-4, lineHeight:.93, color:C.dt, marginBottom:28, animation:'v2-sr .8s .35s both' }}>
              Track aircraft.<br/>
              <span style={{ color:C.cyan }}>Get alerted.</span><br/>
              <span style={{ color:C.ora }}>Instantly.</span>
            </h1>

            <p style={{ fontSize:18, color:C.dm, lineHeight:1.78, maxWidth:440, marginBottom:44, animation:'v2-sr .7s .55s both' }}>
              FinalPing monitors real-time ADS-B data and delivers a push alert in under 3 seconds when any aircraft enters your zone — anywhere on Earth.
            </p>

            <div style={{ display:'flex', gap:12, flexWrap:'wrap', animation:'v2-sr .7s .7s both' }}>
              <Link href="/download" className="v2-btn-p">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download for Windows
              </Link>
              <a href="#features" className="v2-btn-g">See all features →</a>
            </div>

            {/* mini stats */}
            <div style={{ display:'flex', gap:36, marginTop:52, animation:'v2-sr .7s .9s both' }}>
              {[['12K+','users'],['2.8s','avg alert'],['1M+','alerts sent']].map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontSize:26, fontWeight:900, letterSpacing:-1, color:C.dt }}>{n}</div>
                  <div style={{ fontSize:11, color:C.dm2, fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* scroll cue */}
          <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, animation:'v2-sr .6s 1.4s both' }}>
            <span style={{ fontSize:9, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:C.dm2 }}>Scroll</span>
            <div style={{ width:1, height:52, background:`linear-gradient(to bottom,${C.sky},transparent)`, animation:'v2-scroll-line 2.2s ease-in-out infinite' }}/>
          </div>

          <style>{`
            @keyframes v2-sr { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
            @keyframes v2-scroll-line { 0%,100%{opacity:.4;transform:scaleY(1)} 50%{opacity:.9;transform:scaleY(1.1)} }
          `}</style>
        </section>

        {/* ══ FEATURES ════════════════════════════ */}
        <section id="features" style={{ background:C.bg, padding:'140px 60px' }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <div data-reveal="feat-h" className={sr('feat-h')}>
              <Eyebrow>Features</Eyebrow>
              <h2 className="v2-h2">Everything you need<br/>to <span style={{ color:C.cyan }}>never miss a flight.</span></h2>
            </div>

            {/* BENTO GRID */}
            <div style={{ marginTop:60, display:'grid', gridTemplateColumns:'repeat(12,1fr)', gridTemplateRows:'auto', gap:16 }}>

              {/* LARGE: Live alert demo — spans 8 cols */}
              <div data-reveal="feat-1" className={`v2-card ${sr('feat-1')}`}
                style={{ gridColumn:'span 8', padding:36 }}
                onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx',`${(e.clientX-r.left)/r.width*100}%`); e.currentTarget.style.setProperty('--my',`${(e.clientY-r.top)/r.height*100}%`); }}>
                <Eyebrow color={C.ora}>Live Feed</Eyebrow>
                <h3 style={{ fontSize:28, fontWeight:800, letterSpacing:-1.2, color:C.dt, marginBottom:8 }}>Real-time alert stream</h3>
                <p style={{ fontSize:14, color:C.dm, lineHeight:1.7, marginBottom:28, maxWidth:380 }}>Every aircraft entry, every exit — logged with millisecond timestamps.</p>
                <AlertFeed />
              </div>

              {/* Speed stat — spans 4 cols */}
              <div data-reveal="feat-2" className={`v2-card ${sr('feat-2', 1)}`}
                style={{ gridColumn:'span 4', padding:36, display:'flex', flexDirection:'column', justifyContent:'space-between', background:`linear-gradient(145deg,${C.bg2},#060D28)` }}>
                <Eyebrow color={C.cyan}>Speed</Eyebrow>
                <div>
                  <div className="v2-stat-num" data-to="2.8" data-suf="s" data-dec="1">0s</div>
                  <p style={{ fontSize:13, color:C.dm, marginTop:8, lineHeight:1.6 }}>Average time from ADS-B detection to your notification.</p>
                </div>
                <div style={{ marginTop:24, padding:'10px 14px', background:'rgba(0,212,255,0.07)', border:`1px solid rgba(0,212,255,0.15)`, borderRadius:10, fontSize:11, color:C.cyan, fontWeight:700, letterSpacing:1 }}>
                  SUB-3 SECOND GUARANTEE
                </div>
              </div>

              {/* Custom Zones — spans 4 cols */}
              <div data-reveal="feat-3" className={`v2-card ${sr('feat-3', 1)}`}
                style={{ gridColumn:'span 4', padding:36 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(14,165,233,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.sky} strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>
                </div>
                <h3 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.8, color:C.dt, marginBottom:8 }}>Custom Zones</h3>
                <p style={{ fontSize:14, color:C.dm, lineHeight:1.7, marginBottom:20 }}>Draw any shape on the map. Circle, polygon, or corridor — if it fits on Earth, FinalPing tracks it.</p>
                <ZoneVisual />
              </div>

              {/* Smart Filters — spans 4 cols */}
              <div data-reveal="feat-4" className={`v2-card ${sr('feat-4', 2)}`}
                style={{ gridColumn:'span 4', padding:36 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(249,115,22,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ora} strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                </div>
                <h3 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.8, color:C.dt, marginBottom:8 }}>Smart Filters</h3>
                <p style={{ fontSize:14, color:C.dm, lineHeight:1.7, marginBottom:20 }}>Altitude, aircraft type, airline, callsign pattern. Only get alerted for the aircraft you actually care about.</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {[['Jets only',true],['>10,000ft',true],['Commercial',true],['Military',false],['Turboprops',false]].map(([l,on]) => (
                    <span key={l as string} style={{ padding:'5px 12px', borderRadius:999, fontSize:11, fontWeight:700, background: on ? 'rgba(14,165,233,0.13)' : 'rgba(255,255,255,0.04)', border: on ? '1px solid rgba(14,165,233,0.3)' : `1px solid ${C.db}`, color: on ? C.skyL : C.dm2 }}>{l}</span>
                  ))}
                </div>
              </div>

              {/* Teams — spans 4 cols */}
              <div data-reveal="feat-5" className={`v2-card ${sr('feat-5', 3)}`}
                style={{ gridColumn:'span 4', padding:36 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(0,200,83,0.1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <h3 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.8, color:C.dt, marginBottom:8 }}>Teams Mode</h3>
                <p style={{ fontSize:14, color:C.dm, lineHeight:1.7, marginBottom:20 }}>Share zones with your crew. One aircraft entering the zone alerts everyone simultaneously.</p>
                <div style={{ display:'flex', alignItems:'center', gap:-8 }}>
                  {[['AJ','#0EA5E9'],['MK','#F97316'],['SR','#8B5CF6'],['PL','#333']].map(([i,bg],idx) => (
                    <div key={idx} style={{ width:32, height:32, borderRadius:'50%', background:bg as string, border:`2px solid ${C.bg2}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'white', marginLeft: idx ? -10 : 0, zIndex:4-idx, position:'relative' }}>{i}</div>
                  ))}
                  <span style={{ marginLeft:14, fontSize:12, color:C.dm, fontWeight:600 }}>+ shared alerts</span>
                </div>
              </div>

              {/* Platform — spans 4 cols */}
              <div data-reveal="feat-6" className={`v2-card ${sr('feat-6', 4)}`}
                style={{ gridColumn:'span 4', padding:36, background:`linear-gradient(145deg,#0A1220,#060D1F)` }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.dm2, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:28 }}>Platform</div>
                <svg style={{ display:'block', marginBottom:20 }} width="44" height="44" viewBox="0 0 88 88" fill="none">
                  <rect width="40" height="40" fill={C.sky} opacity=".9"/>
                  <rect x="48" width="40" height="40" fill={C.sky} opacity=".7"/>
                  <rect y="48" width="40" height="40" fill={C.sky} opacity=".7"/>
                  <rect x="48" y="48" width="40" height="40" fill={C.sky} opacity=".5"/>
                </svg>
                <h3 style={{ fontSize:22, fontWeight:800, letterSpacing:-0.8, color:C.dt, marginBottom:6 }}>Windows App</h3>
                <p style={{ fontSize:13, color:C.dm, lineHeight:1.6, marginBottom:20 }}>Native desktop app. Runs silently in the system tray, alerts to notification center.</p>
                <span style={{ fontSize:11, color:C.dm2 }}>macOS coming soon</span>
              </div>

            </div>
          </div>
        </section>

        {/* ══ STATEMENT ════════════════════════════ */}
        <section style={{ background:`linear-gradient(135deg,${C.bg} 0%,#0A1530 50%,${C.bg} 100%)`, padding:'120px 60px', textAlign:'center', position:'relative', overflow:'hidden', borderTop:`1px solid ${C.db}`, borderBottom:`1px solid ${C.db}` }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:500, background:`radial-gradient(circle,rgba(14,165,233,0.08) 0%,transparent 65%)`, filter:'blur(40px)', pointerEvents:'none' }}/>
          <div data-reveal="stmt" className={sr('stmt')} style={{ position:'relative', zIndex:1, maxWidth:900, margin:'0 auto' }}>
            <p style={{ fontSize:'clamp(15px,1.8vw,20px)', color:C.dm2, fontStyle:'italic', marginBottom:40, lineHeight:1.65 }}>
              "Before FinalPing, I'd be outside waiting. Not knowing if it already left. Not knowing if I'd missed it. That was before."
            </p>
            <h2 style={{ fontSize:'clamp(52px,8vw,120px)', fontWeight:900, letterSpacing:-5, lineHeight:.9, color:C.dt }}>
              Now you know<br/><span style={{ color:C.cyan }}>instantly.</span>
            </h2>
          </div>
        </section>

        {/* ══ DEMO ════════════════════════════════ */}
        <section id="demo" style={{ background:C.bg, padding:'140px 60px' }}>
          <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1.1fr', gap:100, alignItems:'center' }}>
            <div data-reveal="demo-l" className={sr('demo-l')}>
              <Eyebrow color={C.cyan}>Live Demo</Eyebrow>
              <h2 className="v2-h2">Your airspace,<br/><span style={{ color:C.sky }}>always watching.</span></h2>
              <p style={{ fontSize:16, color:C.dm, lineHeight:1.82, marginBottom:36 }}>The FinalPing feed updates the instant an aircraft enters, updates its position, or exits. All in one clean stream.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {[
                  { icon:'⚡', color:C.cyan, title:'Sub-3s from detection to desktop', desc:'ADS-B → processing → push notification in under 3 seconds.' },
                  { icon:'🔇', color:C.ora,  title:'Zero false alerts', desc:'Smart filtering ensures every alert is relevant. No spam.' },
                  { icon:'📡', color:C.green, title:'Global ADS-B coverage', desc:'180+ countries. If there\'s a signal, we track it.' },
                ].map((f,i) => (
                  <div key={i} style={{ display:'flex', gap:14, padding:18, background:C.bg2, border:`1px solid ${C.db}`, borderRadius:14, cursor:'default', transition:'border-color .25s', alignItems:'flex-start' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(14,165,233,0.25)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.db}}>
                    <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, background:'rgba(255,255,255,0.04)', flexShrink:0 }}>{f.icon}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.dt, marginBottom:4 }}>{f.title}</div>
                      <div style={{ fontSize:12, color:C.dm, lineHeight:1.65 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div data-reveal="demo-r" className={sr('demo-r')}>
              <DemoWindow />
            </div>
          </div>
        </section>

        {/* ══ STATS ════════════════════════════════ */}
        <section style={{ background:C.bg2, borderTop:`1px solid ${C.db}`, borderBottom:`1px solid ${C.db}` }}>
          <div style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {[
              { to:12000, suf:'K+', label:'Active users', color:C.skyL },
              { to:2.8,   suf:'s',  label:'Avg alert time', color:C.ora, dec:1 },
              { to:1000000, suf:'M+', label:'Alerts delivered', color:C.green },
              { to:180,   suf:'+',  label:'Countries', color:C.cyan },
            ].map((s,i) => (
              <div key={i} data-reveal={`stat-${i}`} className={sr(`stat-${i}`, i+1)}
                style={{ padding:'52px 36px', borderRight: i<3 ? `1px solid ${C.db}` : 'none', textAlign:'center', cursor:'default', transition:'background .3s', position:'relative' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(14,165,233,0.03)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <div className="v2-stat-num" data-to={s.to} data-suf={s.suf} data-dec={s.dec||0} style={{ color:s.color, WebkitTextFillColor:s.color, background:'none' }}>0{s.suf}</div>
                <div style={{ fontSize:11, fontWeight:700, color:C.dm2, textTransform:'uppercase', letterSpacing:'1.2px', marginTop:8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ TESTIMONIALS ════════════════════════ */}
        <section style={{ background:C.bg, padding:'140px 60px' }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <div data-reveal="testi-h" className={sr('testi-h')}>
              <Eyebrow>From the community</Eyebrow>
              <h2 className="v2-h2">Trusted by <span style={{ color:C.cyan }}>spotters worldwide.</span></h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginTop:64 }}>
              {[
                { q:'"Nothing else comes close to 2.8 seconds. I\'ve tried everything."', name:'Marcus R.', role:'Aviation photographer', color:'#0EA5E9' },
                { q:'"Our whole club uses Teams mode for airshows. We\'ve never missed a pass since."', name:'Sarah K.', role:'Club president · PAS', color:'#F97316' },
                { q:'"Custom zone filtering means zero noise. Only the planes I care about."', name:'James T.', role:'Enthusiast · Denver CO', color:'#8B5CF6' },
              ].map((t,i) => (
                <div key={i} data-reveal={`tc-${i}`} className={`v2-card ${sr(`tc-${i}`,i+1)}`}
                  style={{ padding:36 }}
                  onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--mx',`${(e.clientX-r.left)/r.width*100}%`);e.currentTarget.style.setProperty('--my',`${(e.clientY-r.top)/r.height*100}%`)}}>
                  <div style={{ fontSize:20, color:'#FBBF24', marginBottom:18, letterSpacing:2 }}>★★★★★</div>
                  <p style={{ fontSize:15, color:C.dm, lineHeight:1.82, fontStyle:'italic', marginBottom:28 }}>{t.q}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${t.color},${t.color}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'white', flexShrink:0 }}>{t.name.slice(0,2)}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.dt }}>{t.name}</div>
                      <div style={{ fontSize:11, color:C.dm2, marginTop:2 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PRICING ═════════════════════════════ */}
        <section id="pricing" style={{ background:C.bg2, padding:'140px 60px', borderTop:`1px solid ${C.db}` }}>
          <div style={{ maxWidth:860, margin:'0 auto', textAlign:'center' }}>
            <div data-reveal="price-h" className={sr('price-h')}>
              <Eyebrow color={C.cyan}>Pricing</Eyebrow>
              <h2 className="v2-h2">Simple.<br/>Honest.</h2>
              <p style={{ fontSize:17, color:C.dm, marginBottom:64, lineHeight:1.8 }}>Free forever. Upgrade only when your crew does.</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, textAlign:'left' }}>
              <PricingCard
                tier="Personal" price="0" per="forever free" hot={false}
                features={['3 alert zones','Real-time ADS-B','Push notifications','Basic filters']}
                btnLabel="Download Free" btnClass="v2-btn-g"
                reveals={reveals} revId="pc-0"
              />
              <PricingCard
                tier="Pro Teams" price="12" per="per member / month" hot={true}
                features={['Unlimited zones','Shared team zones','All filters','Priority polling','Alert history']}
                btnLabel="Start Free Trial" btnClass="v2-btn-p"
                reveals={reveals} revId="pc-1"
              />
            </div>
          </div>
        </section>

        {/* ══ CTA ════════════════════════════════ */}
        <section style={{ background:`linear-gradient(135deg,#030912 0%,#0A1530 50%,#060B1F 100%)`, padding:'160px 60px', textAlign:'center', position:'relative', overflow:'hidden', borderTop:`1px solid ${C.db}` }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:1000, height:600, background:`radial-gradient(ellipse,rgba(14,165,233,0.1) 0%,transparent 65%)`, pointerEvents:'none' }}/>
          <div data-reveal="cta" className={sr('cta')} style={{ position:'relative', zIndex:1 }}>
            <Eyebrow color={C.cyan}>Get started</Eyebrow>
            <h2 style={{ fontSize:'clamp(56px,9vw,128px)', fontWeight:900, letterSpacing:-5, lineHeight:.9, color:C.dt, marginBottom:24 }}>
              The sky is<br/><span style={{ color:C.cyan }}>watching.</span>
            </h2>
            <p style={{ fontSize:17, color:C.dm, lineHeight:1.78, marginBottom:52, maxWidth:400, margin:'0 auto 52px' }}>
              Download FinalPing free and get your first alert in under 60 seconds.
            </p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/download" className="v2-btn-p">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download for Windows — Free
              </Link>
              <a href="#features" className="v2-btn-g">Explore features →</a>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════ */}
        <footer style={{ background:'#020508', padding:'32px 60px', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, fontSize:15, fontWeight:800, color:'rgba(255,255,255,0.7)' }}>
            <div style={{ width:22, height:22, background:`linear-gradient(135deg,${C.sky},#0066CC)`, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" fill="white"/><path d="M10 3L12 8H8L10 3Z" fill="white" opacity=".7"/></svg>
            </div>
            FinalPing
          </div>
          <div style={{ display:'flex', gap:22 }}>
            {['Privacy','Terms','GitHub','Support'].map(l => (
              <Link key={l} href="#" style={{ color:'rgba(255,255,255,0.2)', fontSize:12.5, textDecoration:'none', transition:'color .2s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.55)')}
                onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.2)')}>{l}</Link>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,0.18)' }}>
            <LiveDot/> All systems operational
          </div>
        </footer>
      </div>
    </>
  );
}

/* ── sub-components ──────────────────────────────────────── */

function AlertFeed() {
  const feedRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState([
    { call:'N172AK', info:'Boeing 737 · Zone Alpha · 14,500ft · 420kts', cls:'v2-row-new',  badge:'NEW',  bc:'rgba(249,115,22,0.18)',  btc:'#FB923C', dc:'#F97316', ts:'14:23:07' },
    { call:'UAL889', info:'Boeing 777 · Zone Alpha · 31,200ft · 510kts', cls:'v2-row-live', badge:'LIVE', bc:'rgba(0,200,83,0.14)',     btc:'#4ADE80', dc:'#00C853', ts:'14:21:52' },
    { call:'DAL1201',info:'Airbus A320 · Zone Beta · 22,000ft · 390kts',  cls:'v2-row-past', badge:'EXIT', bc:'rgba(255,255,255,0.05)', btc:'rgba(232,237,248,0.3)', dc:'rgba(232,237,248,0.25)', ts:'14:19:34' },
    { call:'AAL543', info:'Boeing 777 · Zone Alpha · 35,000ft · 560kts',  cls:'v2-row-past', badge:'PAST', bc:'rgba(255,255,255,0.05)', btc:'rgba(232,237,248,0.3)', dc:'rgba(232,237,248,0.25)', ts:'14:17:08' },
  ]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.querySelectorAll('.v2-row').forEach((r,i) => setTimeout(() => r.classList.add('v2-row-vis'), i*200));
        obs.unobserve(e.target);
      });
    }, { threshold:.2 });
    if (feedRef.current) obs.observe(feedRef.current);

    const calls = [
      { call:'JBU192', info:'Airbus A320 · Zone Alpha · 24,000ft · 460kts', cls:'v2-row-new',  badge:'NEW',  bc:'rgba(249,115,22,0.18)',  btc:'#FB923C', dc:'#F97316', ts:'' },
      { call:'SWA210', info:'Boeing 737 · Zone Beta · 18,500ft · 440kts',   cls:'v2-row-live', badge:'LIVE', bc:'rgba(0,200,83,0.14)',     btc:'#4ADE80', dc:'#00C853', ts:'' },
    ];
    let fi = 0;
    const iv = setInterval(() => {
      const now = new Date();
      const f = { ...calls[fi++%calls.length], ts:`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}` };
      setRows(prev => [f, ...prev.slice(0, 5)]);
    }, 5000);
    return () => { obs.disconnect(); clearInterval(iv); };
  }, []);

  return (
    <div ref={feedRef} style={{ display:'flex', flexDirection:'column', gap:7 }}>
      {rows.map((r,i) => (
        <div key={`${r.call}-${i}`} className={`v2-row ${r.cls} v2-row-vis`} style={{ animationDelay:`${i*.1}s` }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:r.dc, flexShrink:0 }}/>
          <span style={{ fontWeight:800, fontFamily:'monospace', fontSize:12.5, color:r.dc, letterSpacing:.5 }}>{r.call}</span>
          <span style={{ fontSize:12, color:C.dm, flex:1 }}>{r.info}</span>
          <span style={{ fontSize:10, fontWeight:700, padding:'3px 7px', borderRadius:999, background:r.bc, color:r.btc }}>{r.badge}</span>
          <span style={{ fontSize:10.5, color:C.dm2, fontFamily:'monospace', whiteSpace:'nowrap' }}>{r.ts}</span>
        </div>
      ))}
    </div>
  );
}

function ZoneVisual() {
  return (
    <div style={{ position:'relative', height:100, borderRadius:12, overflow:'hidden', background:'#0A1628' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(14,165,233,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(14,165,233,0.07) 1px,transparent 1px)', backgroundSize:'28px 28px' }}/>
      <div style={{ position:'absolute', top:'50%', left:'50%', width:80, height:80, borderRadius:'50%', transform:'translate(-50%,-50%)', background:'rgba(14,165,233,0.05)', border:'1.5px dashed rgba(14,165,233,0.45)', animation:'v2-zone 3s ease-in-out infinite' }}/>
      {[['38%','46%',C.ora],['54%','38%','#22C55E'],['44%','60%',C.sky]].map(([t,l,c],i) => (
        <div key={i} style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:c as string, top:t, left:l }}/>
      ))}
      <style>{`@keyframes v2-zone{0%,100%{box-shadow:0 0 0 0 rgba(14,165,233,0.2)}50%{box-shadow:0 0 0 14px rgba(14,165,233,0)}}`}</style>
    </div>
  );
}

function DemoWindow() {
  return (
    <div style={{ background:C.bg, border:`1px solid ${C.db}`, borderRadius:20, overflow:'hidden', boxShadow:'0 44px 88px rgba(0,0,0,0.35),0 18px 36px rgba(0,0,0,0.2)' }}>
      <div style={{ padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderBottom:`1px solid ${C.db}`, display:'flex', alignItems:'center', gap:7 }}>
        <div style={{ width:9, height:9, borderRadius:'50%', background:'#FF5F57' }}/><div style={{ width:9, height:9, borderRadius:'50%', background:'#FEBC2E' }}/><div style={{ width:9, height:9, borderRadius:'50%', background:'#28C840' }}/>
        <div style={{ marginLeft:12, display:'flex', gap:2 }}>
          {['Alert Feed','Zones','Settings'].map((t,i) => (
            <span key={t} style={{ fontSize:11, padding:'4px 12px', borderRadius:5, color: i===0 ? C.dt : C.dm2, background: i===0 ? 'rgba(255,255,255,0.07)' : 'transparent' }}>{t}</span>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, fontSize:11, color:C.dm2 }}>
          <LiveDot/> Live
        </div>
      </div>
      <AlertFeed />
      <div style={{ padding:'10px 14px 14px', borderTop:`1px solid ${C.db}`, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:C.dm2 }}><LiveDot color={C.sky}/>2.1s avg latency</span>
        <span style={{ marginLeft:'auto', fontSize:10, color:C.dm2, fontFamily:'monospace' }}>5 alerts today</span>
      </div>
    </div>
  );
}

function PricingCard({ tier, price, per, hot, features, btnLabel, btnClass, reveals, revId }: {
  tier:string; price:string; per:string; hot:boolean; features:string[]; btnLabel:string; btnClass:string; reveals:Set<string>; revId:string;
}) {
  const on = reveals.has(revId);
  return (
    <div data-reveal={revId} className={`v2-card v2-sr${on?' v2-on':''}`}
      style={{ padding:44, background: hot ? 'linear-gradient(145deg,#060D1F,#0A1530)' : C.bg2, border: hot ? `1px solid rgba(14,165,233,0.2)` : `1px solid ${C.db}`, position:'relative', overflow:'visible', cursor:'default', transition:'transform .35s cubic-bezier(.2,.8,.2,1)' }}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'}
      onMouseLeave={e=>e.currentTarget.style.transform=''}>
      {hot && <div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', background:C.sky, color:'white', fontSize:9.5, fontWeight:800, padding:'5px 22px', borderRadius:'0 0 12px 12px', textTransform:'uppercase', letterSpacing:1 }}>Most Popular</div>}
      <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', color:C.dm2, marginBottom:10, marginTop: hot ? 12 : 0 }}>{tier}</div>
      <div style={{ fontSize:68, fontWeight:900, letterSpacing:-3.5, lineHeight:1, color:C.dt }}>
        <sup style={{ fontSize:22, fontWeight:500, letterSpacing:0, verticalAlign:'top', marginTop:14, display:'inline-block' }}>$</sup>{price}
      </div>
      <div style={{ fontSize:12.5, color:C.dm2, marginTop:5, marginBottom:20 }}>{per}</div>
      <div style={{ height:1, background:C.db, margin:'18px 0' }}/>
      <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:12, marginBottom:32 }}>
        {features.map(f => (
          <li key={f} style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, color:C.dm }}>
            <div style={{ width:17, height:17, borderRadius:5, background:'rgba(14,165,233,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>{f}
          </li>
        ))}
      </ul>
      <button className={btnClass} style={{ width:'100%', justifyContent:'center', fontSize:14, padding:'14px 20px', fontFamily:'inherit' }}>{btnLabel}</button>
    </div>
  );
}
