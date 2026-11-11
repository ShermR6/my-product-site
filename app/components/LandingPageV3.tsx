'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import NewsletterSignup from './NewsletterSignup';
import MobileMenu from './MobileMenu';
import { SOCIAL_LINKS } from './Footer';

const Globe = dynamic(() => import('./ui/cobe-globe').then(m => m.Globe), { ssr: false });

/* ─── globe config ───────────────────────────────────────── */
const GLOBE_MARKERS = [
  { id: 'nyc',     location: [40.7128, -74.006]   as [number,number], label: 'New York'    },
  { id: 'lnd',     location: [51.5074, -0.1278]   as [number,number], label: 'London'      },
  { id: 'dxb',     location: [25.2048,  55.2708]  as [number,number], label: 'Dubai'       },
  { id: 'tyo',     location: [35.6762,  139.6503] as [number,number], label: 'Tokyo'       },
  { id: 'syd',     location: [-33.8688, 151.2093] as [number,number], label: 'Sydney'      },
  { id: 'mia',     location: [25.7617, -80.1918]  as [number,number], label: 'Miami'       },
  { id: 'gru',     location: [-23.5505,-46.6333]  as [number,number], label: 'São Paulo'   },
  { id: 'lax',     location: [34.0522, -118.24]   as [number,number], label: 'Los Angeles' },
];
const GLOBE_ARCS = [
  { id: 'nyc-lnd', from: [40.7128,-74.006]  as [number,number], to: [51.5074,-0.1278]  as [number,number], color: [0.22,0.74,0.97] as [number,number,number] },
  { id: 'mia-nyc', from: [25.7617,-80.1918] as [number,number], to: [40.7128,-74.006]  as [number,number], color: [0.22,0.74,0.97] as [number,number,number] },
  { id: 'lax-tyo', from: [34.0522,-118.24]  as [number,number], to: [35.6762, 139.65]  as [number,number], color: [0.22,0.74,0.97] as [number,number,number] },
  { id: 'dxb-syd', from: [25.2048, 55.27]   as [number,number], to: [-33.8688,151.21]  as [number,number], color: [0.22,0.74,0.97] as [number,number,number] },
  { id: 'mia-gru', from: [25.7617,-80.1918] as [number,number], to: [-23.5505,-46.6333] as [number,number], color: [0.22,0.74,0.97] as [number,number,number] },
];

/* ─── animation helpers ──────────────────────────────────── */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  show:    { opacity: 1, y: 0, transition: { duration: 4, ease: EASE } },
};
const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 4, ease: EASE, delay } },
});

/* ─── testimonials ───────────────────────────────────────── */
const TESTIMONIALS = [
  { q:'"Nothing else gets alerts to me this fast. I’ve tried every app out there."', name:'Marcus R.', role:'Aviation photographer', color:'#2E2E2E' },
  { q:'"Our whole club uses Teams mode for airshows. We’ve never missed a single pass since."', name:'Sarah K.', role:'Club president · PAS', color:'#2E2E2E' },
  { q:'"Custom zone filtering means zero noise. Only the planes I actually care about."', name:'James T.', role:'Enthusiast · Denver CO', color:'#2E2E2E' },
  { q:'"Discord alerts go straight to our spotting server. The whole group knows the second something interesting is inbound."', name:'Priya N.', role:'Spotter · Heathrow', color:'#2E2E2E' },
  { q:'"Hooked up the Ground Station and the alerts got scary fast. I’m at the fence line before the gear is even down."', name:'Tom W.', role:'Ground Station owner', color:'#2E2E2E' },
  { q:'"I added the tail numbers I care about to my watchlist and stopped babysitting the radar. FinalPing just tells me."', name:'Elena V.', role:'Photographer · Amsterdam', color:'#2E2E2E' },
  { q:'"It runs quietly in the tray and only speaks up when something enters my zone. Exactly how software should behave."', name:'Derek M.', role:'Retired ATC', color:'#2E2E2E' },
  { q:'"I get a text the moment our students are inbound on their cross-countries. No more guessing when to prep the ramp."', name:'Aisha B.', role:'Flight school dispatcher', color:'#2E2E2E' },
  { q:'"Dropped a zone over the harbour and went about my day. The first alert hit my phone before I could even test it."', name:'Chris P.', role:'Enthusiast · Sydney', color:'#2E2E2E' },
];

function TestimonialsColumn({ items, duration, className }: { items: typeof TESTIMONIALS; duration: number; className?: string }) {
  return (
    <div className={className} style={{ flex:'1 1 0', maxWidth:400, minWidth:0 }}>
      <motion.div
        animate={{ y: '-50%' }}
        transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        style={{ display:'flex', flexDirection:'column', gap:20, paddingBottom:20 }}
      >
        {[0,1].map(dup => (
          <React.Fragment key={dup}>
            {items.map((t,i) => (
              <div key={i} className="v3-card" style={{ padding:32 }} aria-hidden={dup===1}>
                <div style={{ fontSize:16, color:'#FAFAFA', marginBottom:14, letterSpacing:2 }}>★★★★★</div>
                <p style={{ fontSize:14.5, color:'#D4D4D4', lineHeight:1.78, fontStyle:'italic', marginBottom:24, marginTop:0 }}>{t.q}</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${t.color},${t.color}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>{t.name.slice(0,2)}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#FAFAFA' }}>{t.name}</div>
                    <div style={{ fontSize:11, color:'#8A8A8A', marginTop:2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function LandingPageV3() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { data: session } = useSession();

  /* body: black, full-bleed */
  useEffect(() => {
    document.body.classList.add('landing-mode');
    document.body.style.background = '#0A0A0A';
    return () => {
      document.body.classList.remove('landing-mode');
      document.body.style.background = '';
    };
  }, []);

  /* nav scroll state */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* animated counters */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const to  = parseFloat(el.dataset.to  || '0');
        const suf = el.dataset.suf || '';
        const dec = parseInt(el.dataset.dec   || '0');
        let i = 0;
        const N = 60;
        const iv = setInterval(() => {
          i++;
          const val = to * (1 - Math.pow(1 - i / N, 4));
          el.textContent = (dec ? val.toFixed(dec) : Math.round(val).toLocaleString()) + suf;
          if (i >= N) { el.textContent = (dec ? to.toFixed(dec) : to.toLocaleString()) + suf; clearInterval(iv); }
        }, 1600 / N);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-to]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .v3-root, .v3-root * { font-family:var(--font-sans),system-ui,sans-serif; box-sizing:border-box; }
        .v3-nav { position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:1000;width:min(calc(100% - 32px),1280px);height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-radius:14px;transition:background .35s,border-color .35s,box-shadow .35s; }
        .v3-nav-default { background:rgba(10,10,10,0.78);border:1px solid #232323;backdrop-filter:blur(16px); }
        .v3-nav-scrolled { background:rgba(10,10,10,0.94);border:1px solid #2E2E2E;box-shadow:0 8px 30px rgba(0,0,0,0.5);backdrop-filter:blur(24px); }
        .v3-nav-link { font-size:13.5px;font-weight:500;color:#A3A3A3;text-decoration:none;transition:color .18s; }
        .v3-nav-link:hover { color:#FAFAFA; }
        .v3-dl-btn { display:inline-flex;align-items:center;white-space:nowrap;gap:7px;background:#FAFAFA;color:#0A0A0A;padding:9px 18px;border-radius:999px;font-size:13px;font-weight:700;text-decoration:none;transition:background .2s; }
        .v3-dl-btn:hover { background:#E5E5E5; }
        .v3-signin-btn { display:inline-flex;align-items:center;white-space:nowrap;background:transparent;color:#FAFAFA;padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;text-decoration:none;border:1px solid #2E2E2E;transition:border-color .18s,color .18s; }
        .v3-signin-btn:hover { border-color:#5C5C5C;color:#FAFAFA; }
        /* card */
        .v3-card { background:#131313;border:1px solid #232323;border-radius:20px;transition:border-color .25s,transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s; }
        .v3-card:hover { border-color:#3A3A3A;transform:translateY(-3px); }
        /* marquee */
        .v3-marquee-inner { display:flex;gap:0;animation:v3-marquee 28s linear infinite;width:max-content; }
        @keyframes v3-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        /* plane ping */
        @keyframes v3-ping { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.55);opacity:0} }
        /* stat nums */
        .v3-stat-num { font-size:clamp(44px,5vw,72px);font-weight:900;letter-spacing:-3px;line-height:1;color:#FAFAFA; }
        /* buttons */
        .v3-btn-primary { display:inline-flex;align-items:center;gap:9px;background:#FAFAFA;color:#0A0A0A;padding:16px 32px;border-radius:999px;font-size:15px;font-weight:700;text-decoration:none;transition:transform .2s,background .2s;border:none;font-family:inherit;cursor:pointer; }
        .v3-btn-primary:hover { transform:translateY(-2px);background:#E5E5E5; }
        .v3-btn-ghost { display:inline-flex;align-items:center;gap:7px;background:transparent;color:#FAFAFA;padding:16px 28px;border-radius:999px;font-size:15px;font-weight:600;text-decoration:none;border:1px solid #2E2E2E;transition:all .2s;font-family:inherit;cursor:pointer; }
        .v3-btn-ghost:hover { border-color:#5C5C5C;color:#FAFAFA; }
        /* pricing popular */
        .v3-popular-badge { position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:#FAFAFA;color:#0A0A0A;font-size:9.5px;font-weight:800;padding:5px 20px;border-radius:0 0 10px 10px;letter-spacing:1.2px;text-transform:uppercase;white-space:nowrap; }
        /* testimonial columns */
        .v3-tcol-2, .v3-tcol-3 { display:none; }
        @media(min-width:768px){ .v3-tcol-2{display:block} }
        @media(min-width:1100px){ .v3-tcol-3{display:block} }
        /* footer */
        .v3-footer-grid { display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:44px; }
        @media(max-width:900px){ .v3-footer-grid{grid-template-columns:1fr 1fr;gap:36px} }
        @media(max-width:560px){ .v3-footer-grid{grid-template-columns:1fr} }
        .v3-flink { display:block;color:rgba(255,255,255,0.42);font-size:13px;text-decoration:none;padding:4px 0;transition:color .18s; }
        .v3-flink:hover { color:#FAFAFA; }
        .v3-social { display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.55);transition:color .18s,border-color .18s,transform .18s; }
        .v3-social:hover { color:#FAFAFA;border-color:#FAFAFA;transform:translateY(-2px); }
        /* mobile */
        @media(max-width:900px){
          .v3-nav ul { display:none !important; }
          .v3-root section, .v3-root footer { padding-left:20px !important; padding-right:20px !important; }
          .v3-hero { flex-direction:column !important; padding:32px 20px 48px !important; gap:44px !important; }
          .v3-hero > div { max-width:100% !important; flex:none !important; width:100%; }
          .v3-hero h1 { font-size:clamp(40px,11.5vw,64px) !important; letter-spacing:-2px !important; }
          .v3-hero-globe { justify-content:center !important; }
          .v3-hero-globe > div { width:min(420px,86vw) !important; }
          .v3-grid3, .v3-grid2 { grid-template-columns:1fr !important; }
          .v3-grid4 { grid-template-columns:repeat(2,1fr) !important; }
          .v3-grid4 > div { padding:32px 16px !important; border-right:none !important; }
        }
        @media(max-width:560px){
          .v3-nav { padding:0 12px; }
          .v3-dl-btn { padding:8px 11px; font-size:12px; }
          .v3-signin-btn { padding:7px 11px; font-size:12px; }
          .nav-dl-long { display:none; }
        }
        @media(prefers-reduced-motion:reduce){ .v3-marquee-inner{animation:none} *, *::before, *::after {animation-duration:.01ms!important;transition-duration:.01ms!important;animation-iteration-count:1!important} }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav ref={navRef} className={`v3-nav ${scrolled ? 'v3-nav-scrolled' : 'v3-nav-default'}`}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <MobileMenu />
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <svg width="30" height="30" viewBox="0 0 120 120" style={{ flexShrink:0 }} aria-hidden="true">
            <circle cx="60" cy="60" r="40" fill="none" stroke="#0EA5E9" strokeWidth="7.5"
                    strokeDasharray="195.4 48.9" strokeLinecap="round"/>
            <path fill="#FAFAFA" transform="translate(87.5,32.5) rotate(225) scale(1.28)"
                  d="M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z"/>
          </svg>
          <span style={{ fontSize:16, fontWeight:800, color:'#FAFAFA', letterSpacing:-.4 }}>FinalPing</span>
        </Link>
        </div>
        <ul style={{ display:'flex', gap:28, listStyle:'none', margin:0, padding:0 }}>
          <li><Link href="/" className="v3-nav-link">Product</Link></li>
          <li><Link href="/pricing" className="v3-nav-link">Pricing</Link></li>
          <li><Link href="/download" className="v3-nav-link">Download</Link></li>
          <li><Link href="/contact" className="v3-nav-link">Contact Us</Link></li>
        </ul>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Link href="/app" className="v3-dl-btn">Open app</Link>
          {session
            ? <Link href="/dashboard" className="v3-signin-btn">Dashboard</Link>
            : <Link href="/login" className="v3-signin-btn">Sign In</Link>}
        </div>
      </nav>

      <div className="v3-root">

        {/* ── HERO ────────────────────────────────────────────── */}
        <section style={{ minHeight:'85vh', background:'#0A0A0A', display:'flex', alignItems:'center', paddingTop:80, overflow:'hidden', position:'relative' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:-80, right:-100, width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.035) 0%,transparent 70%)', pointerEvents:'none' }}/>

          <div className="v3-hero" style={{ maxWidth:1280, margin:'0 auto', padding:'60px 40px', display:'flex', alignItems:'center', gap:0, width:'100%' }}>
            <div style={{ flex:'1 1 0', minWidth:0, maxWidth:580 }}>
              <motion.div initial="hidden" animate="show" variants={{ hidden:{}, show:{} }}>
                <motion.div variants={stagger(0)} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#131313', border:'1px solid #232323', color:'#D4D4D4', fontSize:11, fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', padding:'6px 14px', borderRadius:999, marginBottom:28 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#38BDF8', boxShadow:'0 0 0 3px rgba(56,189,248,0.2)', display:'inline-block', animation:'v3-ping 2s infinite' }}/>
                  Live · Real-time ADS-B · Worldwide
                </motion.div>

                <motion.h1 variants={stagger(0.18)} style={{ fontSize:'clamp(48px,5.5vw,82px)', fontWeight:900, letterSpacing:-4, lineHeight:.92, color:'#FAFAFA', marginBottom:24 }}>
                  Know when<br/>
                  your aircraft is<br/>
                  <span style={{ color:'#38BDF8' }}>on final</span>
                </motion.h1>

                <motion.p variants={stagger(0.36)} style={{ fontSize:17, color:'#A3A3A3', lineHeight:1.78, marginBottom:36, maxWidth:440 }}>
                  FinalPing monitors real-time ADS-B data and alerts you the moment any aircraft is detected in your zone — anywhere on Earth.
                </motion.p>

                <motion.div variants={stagger(0.54)} style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:48 }}>
                  <Link href="/download" className="v3-btn-primary">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download for Windows — Free
                  </Link>
                  <a href="#demo" className="v3-btn-ghost">See how it works →</a>
                </motion.div>

                <motion.div variants={stagger(0.72)} style={{ display:'flex', gap:32 }}>
                  {[['1,200+','Active users'],['30s','Avg alert time'],['1M+','Alerts delivered']].map(([n,l]) => (
                    <div key={l}>
                      <div style={{ fontSize:24, fontWeight:900, letterSpacing:-1, color:'#FAFAFA' }}>{n}</div>
                      <div style={{ fontSize:11, color:'#8A8A8A', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginTop:2 }}>{l}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            <div className="v3-hero-globe" style={{ flex:'1 1 0', minWidth:0, display:'flex', justifyContent:'flex-end', alignItems:'center', position:'relative' }}>
              <motion.div
                initial={{ opacity:0, scale:.9 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ duration:1.1, ease:[0.16,1,0.3,1], delay:.3 }}
                style={{ width:'min(580px,50vw)', position:'relative' }}
              >
                <Globe
                  markers={GLOBE_MARKERS}
                  arcs={GLOBE_ARCS}
                  dark={1}
                  baseColor={[0.32,0.32,0.32]}
                  markerColor={[0.22,0.74,0.97]}
                  arcColor={[0.22,0.74,0.97]}
                  glowColor={[0.09,0.09,0.09]}
                  mapBrightness={5}
                  markerSize={0.04}
                  speed={0.001}
                  theta={0.25}
                  diffuse={1.5}
                  mapSamples={16000}
                  className="w-full"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ─────────────────────────────────────────── */}
        <div style={{ background:'#0E0E0E', borderTop:'1px solid #232323', borderBottom:'1px solid #232323', padding:'14px 0', overflow:'hidden' }}>
          <div className="v3-marquee-inner">
            {[...Array(2)].map((_,rep) => (
              <React.Fragment key={rep}>
                {['N172AK','NYC ZONE','UAL889','DAL1201','LONDON','JBU192','DUBAI','AAL543','TOKYO','SWA210','MIAMI','EK353','SYDNEY','QFA101','CHICAGO','SINGAPORE','PARIS','TORONTO'].map((t,i) => (
                  <span key={`${rep}-${i}`} style={{ display:'inline-flex', alignItems:'center', gap:20, padding:'0 28px', fontSize:11, fontWeight:700, color:'#8A8A8A', letterSpacing:'2px', textTransform:'uppercase', whiteSpace:'nowrap', flexShrink:0 }}>
                    {t}
                    <span style={{ width:4, height:4, borderRadius:'50%', background:'#3A3A3A', display:'inline-block', flexShrink:0 }}/>
                  </span>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS — single flythrough ────────────────── */}
        <HowItWorks />

        {/* ── FEATURES ────────────────────────────────────────── */}
        <section id="features" style={{ background:'#0E0E0E', padding:'120px 40px', borderTop:'1px solid #232323' }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <motion.div initial="hidden" whileInView="show" viewport={{ once:true, margin:'-80px' }} variants={{ hidden:{}, show:{ transition:{ staggerChildren:.08 } } }}>
              <motion.p variants={fadeUp} style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:'#8A8A8A', marginBottom:14 }}>Features</motion.p>
              <motion.h2 variants={fadeUp} style={{ fontSize:'clamp(36px,4vw,60px)', fontWeight:900, letterSpacing:-2.5, lineHeight:1, color:'#FAFAFA', marginBottom:16 }}>
                Everything you need<br/>to track what matters.
              </motion.h2>
              <motion.p variants={fadeUp} style={{ fontSize:16, color:'#A3A3A3', marginBottom:60, maxWidth:440, lineHeight:1.75 }}>
                Real-time. Accurate. Delivered to you before anyone else knows.
              </motion.p>
            </motion.div>

            <div className="v3-grid3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
              {[
                {
                  title: 'Instant Alerts',
                  desc: 'Alerts fire automatically the moment ADS-B detection finds your aircraft — around 30 seconds via cloud, under 10 with a Ground Station.',
                },
                {
                  title: 'Custom Zones',
                  desc: 'Drop a point anywhere on Earth and set the distance that matters to you — FinalPing draws the zone and watches it.',
                },
                {
                  title: 'Shared Monitoring',
                  desc: 'Invite your crew. One aircraft entering a zone alerts your whole team simultaneously with Teams mode.',
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  className="v3-card"
                  initial={{ opacity:0, y:24 }}
                  whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true, margin:'-60px' }}
                  transition={{ duration:.65, ease:[0.16,1,0.3,1], delay: i * .07 }}
                  style={{ padding:36 }}
                >
                  <h3 style={{ fontSize:20, fontWeight:800, color:'#FAFAFA', letterSpacing:-.6, margin:'0 0 12px' }}>{f.title}</h3>
                  <p style={{ fontSize:14, color:'#A3A3A3', lineHeight:1.78, margin:0 }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* extra 2 features */}
            <div className="v3-grid2" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20, marginTop:20 }}>
              {[
                {
                  title:'Integrations', desc:'Route alerts wherever you\'ll see them fastest. The moment an aircraft enters your zone, every channel you\'ve connected fires at once.',
                  pills:['Discord','Slack','SMS','Email'],
                  active:[true,true,true,true],
                },
                {
                  title:'Global ADS-B Coverage', desc:'180+ countries. Live feed from ground stations worldwide. If there\'s a signal, FinalPing receives it.',
                  pills:['North America','Europe','Asia-Pacific','Middle East'],
                  active:[true,true,true,true],
                },
              ].map((f,i) => (
                <motion.div
                  key={i}
                  className="v3-card"
                  initial={{ opacity:0, y:24 }}
                  whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true, margin:'-60px' }}
                  transition={{ duration:.65, ease:[0.16,1,0.3,1], delay: i*.07 }}
                  style={{ padding:36 }}
                >
                  <h3 style={{ fontSize:20, fontWeight:800, color:'#FAFAFA', letterSpacing:-.6, marginBottom:10 }}>{f.title}</h3>
                  <p style={{ fontSize:14, color:'#A3A3A3', lineHeight:1.78, marginBottom:22 }}>{f.desc}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                    {f.pills.map((p,pi) => (
                      <span key={p} style={{ padding:'5px 13px', borderRadius:999, fontSize:12, fontWeight:600, background: f.active[pi] ? '#1A1A1A' : '#131313', border: f.active[pi] ? '1px solid #2E2E2E' : '1px solid #232323', color: f.active[pi] ? '#D4D4D4' : '#8A8A8A' }}>{p}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ───────────────────────────────────────────── */}
        <section style={{ background:'#0A0A0A', borderTop:'1px solid #232323', borderBottom:'1px solid #232323' }}>
          <div className="v3-grid4" style={{ maxWidth:1280, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)' }}>
            {[
              { to:1200,  suf:'+',  label:'Active users',       dec:0, color:'#FAFAFA' },
              { to:30,    suf:'s',  label:'Avg alert time',     dec:0, color:'#FAFAFA' },
              { to:1,     suf:'M+', label:'Alerts delivered',   dec:0, color:'#FAFAFA' },
              { to:180,   suf:'+',  label:'Countries covered',  dec:0, color:'#FAFAFA' },
            ].map((s,i) => (
              <motion.div
                key={i}
                initial={{ opacity:0 }}
                whileInView={{ opacity:1 }}
                viewport={{ once:true }}
                transition={{ duration:.5, delay: i*.06 }}
                style={{ padding:'56px 36px', borderRight: i<3 ? '1px solid #232323' : 'none', textAlign:'center', position:'relative' }}
              >
                <div
                  className="v3-stat-num"
                  data-to={s.to} data-suf={s.suf} data-dec={s.dec}
                  style={{ color: s.color, WebkitTextFillColor: s.color }}
                >
                  0{s.suf}
                </div>
                <div style={{ fontSize:12, fontWeight:600, color:'#8A8A8A', textTransform:'uppercase', letterSpacing:'1.2px', marginTop:8 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS ────────────────────────────────────── */}
        <section style={{ background:'#0E0E0E', padding:'120px 40px', borderTop:'1px solid #232323' }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <motion.div initial="hidden" whileInView="show" viewport={{ once:true, margin:'-80px' }} variants={{ hidden:{}, show:{ transition:{ staggerChildren:.08 } } }}>
              <motion.p variants={fadeUp} style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:'#8A8A8A', marginBottom:14 }}>Testimonials</motion.p>
              <motion.h2 variants={fadeUp} style={{ fontSize:'clamp(36px,4vw,56px)', fontWeight:900, letterSpacing:-2, lineHeight:1.05, color:'#FAFAFA', marginBottom:56 }}>
                Trusted by spotters<br/>worldwide.
              </motion.h2>
            </motion.div>
            <div style={{
              display:'flex', justifyContent:'center', gap:20,
              maxHeight:700, overflow:'hidden',
              maskImage:'linear-gradient(to bottom,transparent,black 12%,black 88%,transparent)',
              WebkitMaskImage:'linear-gradient(to bottom,transparent,black 12%,black 88%,transparent)',
            }}>
              <TestimonialsColumn items={TESTIMONIALS.slice(0,3)} duration={16} />
              <TestimonialsColumn items={TESTIMONIALS.slice(3,6)} duration={21} className="v3-tcol-2" />
              <TestimonialsColumn items={TESTIMONIALS.slice(6,9)} duration={18} className="v3-tcol-3" />
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section style={{ background:'#0E0E0E', borderTop:'1px solid #232323', padding:'140px 40px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:800, height:500, background:'radial-gradient(ellipse,rgba(255,255,255,0.05) 0%,transparent 65%)', pointerEvents:'none' }}/>
          <motion.div
            initial={{ opacity:0, y:20 }}
            whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }}
            transition={{ duration:.7, ease:[0.16,1,0.3,1] }}
            style={{ position:'relative', zIndex:1 }}
          >
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:'rgba(163,163,163,0.8)', marginBottom:20 }}>Get started</p>
            <h2 style={{ fontSize:'clamp(52px,7vw,108px)', fontWeight:900, letterSpacing:-5, lineHeight:.9, color:'#fff', marginBottom:20 }}>
              The sky is always<br/>on.
            </h2>
            <p style={{ fontSize:17, color:'rgba(163,163,163,0.7)', lineHeight:1.78, marginBottom:48, maxWidth:380, margin:'0 auto 48px' }}>
              Download FinalPing free and receive your first alert in under 60 seconds.
            </p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/download" className="v3-btn-primary" style={{ fontSize:16, padding:'17px 36px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download for Windows — Free
              </Link>
              <Link href="/pricing" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'rgba(163,163,163,0.7)', fontSize:15, fontWeight:600, textDecoration:'none', padding:'17px 28px', border:'1.5px solid rgba(163,163,163,0.2)', borderRadius:999, transition:'all .2s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='#5C5C5C';(e.currentTarget as HTMLElement).style.color='#FAFAFA'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='rgba(163,163,163,0.2)';(e.currentTarget as HTMLElement).style.color='rgba(163,163,163,0.7)'}}>
                View pricing →
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <footer style={{ background:'#0A0A0A', padding:'64px 40px 0', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <div className="v3-footer-grid">
              {/* Brand + newsletter */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14, fontSize:15, fontWeight:800, color:'rgba(255,255,255,0.85)' }}>
                  <svg width="26" height="26" viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="40" fill="none" stroke="#0EA5E9" strokeWidth="7.5"
                            strokeDasharray="195.4 48.9" strokeLinecap="round"/>
                    <path fill="#FAFAFA" transform="translate(87.5,32.5) rotate(225) scale(1.28)"
                          d="M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z"/>
                  </svg>
                  <span>FinalPing</span>
                </div>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.42)', lineHeight:1.7, margin:'0 0 18px', maxWidth:300 }}>
                  Get product updates, new releases, and feature announcements. No spam.
                </p>
                <NewsletterSignup dark />
              </div>

              {/* Product */}
              <div>
                <h3 style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.75)', margin:'0 0 12px', letterSpacing:'1.2px', textTransform:'uppercase' }}>Product</h3>
                <Link href="/" className="v3-flink">Product</Link>
                <Link href="/pricing" className="v3-flink">Pricing</Link>
                <Link href="/download" className="v3-flink">Download</Link>
                <Link href="/groundstationkit" className="v3-flink">Ground Station Kit</Link>
              </div>

              {/* Support */}
              <div>
                <h3 style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.75)', margin:'0 0 12px', letterSpacing:'1.2px', textTransform:'uppercase' }}>Support</h3>
                <Link href="/contact" className="v3-flink">Contact Us</Link>
                <Link href="/docs" className="v3-flink">Help &amp; Docs</Link>
                <Link href="/changelog" className="v3-flink">Changelog</Link>
                <Link href="/status" className="v3-flink">Status</Link>
              </div>

              {/* Connect */}
              <div>
                <h3 style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.75)', margin:'0 0 12px', letterSpacing:'1.2px', textTransform:'uppercase' }}>Connect</h3>
                <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                  <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="v3-social" title="Join us on Discord" aria-label="Join us on Discord">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  </a>
                  <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" className="v3-social" title="Follow us on X" aria-label="Follow us on X">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                </div>
                <a href="mailto:aircraftalerts@finalpingapp.com" className="v3-flink" style={{ fontSize:12.5 }}>aircraftalerts@finalpingapp.com</a>
              </div>
            </div>

            {/* Bottom bar */}
            <div style={{ marginTop:48, padding:'22px 0', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.28)' }}>© {new Date().getFullYear()} FinalPing. All rights reserved.</div>
              <div style={{ display:'flex', gap:20 }}>
                <Link href="/privacy" style={{ color:'rgba(255,255,255,0.75)', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>Privacy</Link>
                <Link href="/terms" style={{ color:'rgba(255,255,255,0.75)', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>Terms</Link>
                <Link href="/refund-policy" style={{ color:'rgba(255,255,255,0.75)', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>Refunds</Link>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'rgba(255,255,255,0.28)' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#FAFAFA', display:'inline-block', boxShadow:'0 0 0 3px rgba(250,250,250,0.15)' }}/>
                All systems operational
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ── how it works — 5-step boxes ────────────────────────── */
const STEPS = [
  {
    n:1, title:'Download FinalPing', color:'#FAFAFA',
    lead:"Download the Windows desktop app, sign in, and you're up and running in about a minute.",
    bullets:['Windows desktop app','Runs in the tray or with the app open','Set up in about a minute'],
  },
  {
    n:2, title:'Set your zone', color:'#FAFAFA',
    lead:'Drop a point anywhere and FinalPing draws a circular alert zone around it — no drawing required.',
    bullets:['Circular zones, drawn for you','Center on any airport, runway, or region','Zone count depends on your license tier'],
  },
  {
    n:3, title:'Add your aircraft', color:'#FAFAFA',
    lead:'Watching for a specific plane? Add its tail number or callsign to your personal watchlist.',
    bullets:['Track by tail number or callsign','Build a personal watchlist','Never miss the ones you care about'],
  },
  {
    n:4, title:'Aircraft enters', color:'#FAFAFA',
    lead:'We watch live ADS-B data around the clock and alert you the moment an aircraft crosses your zone.',
    bullets:['Live ADS-B from 180+ countries','Around-the-clock monitoring',"Alerts fire the moment it's detected"],
  },
  {
    n:5, title:"You're notified instantly", color:'#FAFAFA',
    lead:"The instant an aircraft is detected, FinalPing sends an alert to wherever you'll see it fastest.",
    bullets:['SMS, email, Slack, Discord & more','~30s via cloud, under 10s with Ground Station','Alerts your whole team with Teams'],
  },
];

function HowItWorks() {
  return (
    <section id="demo" style={{ background:'#0A0A0A', padding:'120px 40px', borderTop:'1px solid #232323' }}>
      <div style={{ maxWidth:1140, margin:'0 auto' }}>

        {/* section headline */}
        <motion.div
          initial={{ opacity:0, y:20 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true, margin:'-80px' }}
          transition={{ duration:.6, ease:[0.16,1,0.3,1] }}
          style={{ textAlign:'center', maxWidth:640, margin:'0 auto 64px' }}
        >
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', color:'#8A8A8A', margin:'0 0 14px' }}>How it works</p>
          <h2 style={{ fontSize:'clamp(32px,4vw,52px)', fontWeight:900, letterSpacing:-2, lineHeight:1.05, color:'#FAFAFA', margin:'0 0 16px' }}>
            Boundary crossed.<br/>You&apos;re first to know.
          </h2>
          <p style={{ fontSize:17, color:'#A3A3A3', margin:0, lineHeight:1.6 }}>
            From install to first alert in five simple steps.
          </p>
        </motion.div>

        {/* step boxes */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:20, justifyContent:'center' }}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              className="v3-card"
              initial={{ opacity:0, y:24 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:'-60px' }}
              transition={{ duration:.6, ease:[0.16,1,0.3,1], delay: i*.08 }}
              style={{ flex:'1 1 300px', maxWidth:340, padding:'30px 28px 32px', display:'flex', flexDirection:'column' }}
            >
              <div style={{ fontSize:32, fontWeight:900, letterSpacing:-1, color:step.color, lineHeight:1, marginBottom:12 }}>Step {step.n}</div>
              <h3 style={{ fontSize:20, fontWeight:800, color:'#FAFAFA', letterSpacing:-.6, margin:'0 0 10px' }}>{step.title}</h3>
              <p style={{ fontSize:14, color:'#A3A3A3', lineHeight:1.7, margin:'0 0 18px' }}>{step.lead}</p>

              <ul style={{ listStyle:'none', margin:'auto 0 0', padding:0, display:'flex', flexDirection:'column', gap:9 }}>
                {step.bullets.map((b) => (
                  <li key={b} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13.5, color:'#D4D4D4', fontWeight:500 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={step.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
