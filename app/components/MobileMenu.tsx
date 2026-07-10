// app/components/MobileMenu.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const LINKS = [
  { href: "/", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
  { href: "/groundstationkit", label: "Ground Station Kit" },
  { href: "/contact", label: "Contact Us" },
  { href: "/docs", label: "Help & Docs" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // Close when navigating to another page
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock page scroll while the drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  return (
    <>
      <button className="fp-burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Portal to body: the navs are centered with a CSS transform, which
          would otherwise trap this fixed-position drawer inside the pill. */}
      {open && createPortal(
        <>
          <div className="fp-drawer-backdrop" onClick={() => setOpen(false)} />
          <div className="fp-drawer" role="dialog" aria-label="Site menu">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="24" height="24" viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="40" fill="none" stroke="var(--text)" strokeWidth="7.5"
                          strokeDasharray="195.4 48.9" strokeLinecap="round"/>
                  <path fill="var(--accent)" transform="translate(87.5,32.5) rotate(225) scale(1.28)"
                        d="M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z"/>
                </svg>
                <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", letterSpacing: -0.4 }}>
                  Final<span style={{ color: "var(--accent)" }}>Ping</span>
                </span>
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" style={{
                width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)",
                background: "transparent", color: "var(--muted)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              {LINKS.map(l => (
                <Link key={l.href} href={l.href} className="fp-drawer-link" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <Link href="/download" className="nav-dl-btn" style={{ justifyContent: "center", padding: "12px" }} onClick={() => setOpen(false)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Free
              </Link>
              {session ? (
                <Link href="/dashboard" className="nav-signin-btn" style={{ justifyContent: "center", padding: "11px" }} onClick={() => setOpen(false)}>Dashboard</Link>
              ) : (
                <Link href="/login" className="nav-signin-btn" style={{ justifyContent: "center", padding: "11px" }} onClick={() => setOpen(false)}>Sign In</Link>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
