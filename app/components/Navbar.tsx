// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
      <div className="container">
        <div className="nav-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MobileMenu />
          <Link className="brand" href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <svg width="28" height="28" viewBox="0 0 120 120" style={{ flexShrink: 0 }} aria-hidden="true">
              <circle cx="60" cy="60" r="40" fill="none" stroke="var(--text)" strokeWidth="7.5"
                      strokeDasharray="195.4 48.9" strokeLinecap="round"/>
              <path fill="var(--accent)" transform="translate(87.5,32.5) rotate(225) scale(1.28)"
                    d="M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: -0.4 }}>
              Final<span style={{ color: "var(--accent)" }}>Ping</span>
            </span>
          </Link>
          </div>

          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <Link className="nav-link" href="/">Product</Link>
            <Link className="nav-link" href="/pricing">Pricing</Link>
            <Link className="nav-link" href="/download">Download</Link>
            <Link className="nav-link" href="/contact">Contact Us</Link>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/download" className="nav-dl-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download<span className="nav-dl-long">&nbsp;Free</span>
            </Link>
            {session ? (
              <Link href="/dashboard" className="nav-signin-btn">Dashboard</Link>
            ) : (
              <Link href="/login" className="nav-signin-btn">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
