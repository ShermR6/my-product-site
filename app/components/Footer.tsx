// app/components/footer.tsx
import Link from "next/link";
import NewsletterSignup from "./NewsletterSignup";

// TODO: replace X with the real profile URL when the account exists
export const SOCIAL_LINKS = {
  discord: "https://discord.gg/4ha3ZF8pGk",
  x: "https://x.com/finalping",
};

const PRODUCT_LINKS = [
  { href: "/", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
  { href: "/groundstationkit", label: "Ground Station Kit" },
];

const SUPPORT_LINKS = [
  { href: "/contact", label: "Contact Us" },
  { href: "/docs", label: "Help & Docs" },
  { href: "/changelog", label: "Changelog" },
  { href: "/status", label: "Status" },
];

function SocialButton({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={label}
      className="fp-social-btn"
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="footer" style={{ padding: "48px 0 0", fontSize: 13 }}>
      <style>{`
        .fp-footer-grid { display:grid; grid-template-columns:1.4fr 1fr 1fr 1fr; gap:40px; }
        @media(max-width:900px){ .fp-footer-grid { grid-template-columns:1fr 1fr; } }
        @media(max-width:560px){ .fp-footer-grid { grid-template-columns:1fr; } }
        .fp-footer-link { display:block; color:var(--muted); text-decoration:none; font-size:13px; padding:4px 0; transition:color .18s; }
        .fp-footer-link:hover { color:var(--accent); }
        .fp-social-btn { display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%; border:1px solid var(--border); color:var(--muted); background:transparent; transition:color .18s, border-color .18s, transform .18s; }
        .fp-social-btn:hover { color:var(--accent); border-color:var(--accent); transform:translateY(-2px); }
      `}</style>
      <div className="container">
        <div className="fp-footer-grid">
          {/* Brand + newsletter */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
              <svg width="26" height="26" viewBox="0 0 120 120" style={{ flexShrink: 0 }} aria-hidden="true">
                <circle cx="60" cy="60" r="40" fill="none" stroke="var(--text)" strokeWidth="7.5"
                        strokeDasharray="195.4 48.9" strokeLinecap="round" />
                <path fill="var(--accent)" transform="translate(87.5,32.5) rotate(225) scale(1.28)"
                      d="M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z" />
              </svg>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", letterSpacing: -0.4 }}>
                Final<span style={{ color: "var(--accent)" }}>Ping</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: "0 0 18px", maxWidth: 300 }}>
              Get product updates, new releases, and feature announcements. No spam.
            </p>
            <NewsletterSignup />
          </div>

          {/* Product */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 12px", letterSpacing: 0.2 }}>Product</h3>
            <nav>
              {PRODUCT_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="fp-footer-link">{l.label}</Link>
              ))}
            </nav>
          </div>

          {/* Support */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 12px", letterSpacing: 0.2 }}>Support</h3>
            <nav>
              {SUPPORT_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="fp-footer-link">{l.label}</Link>
              ))}
            </nav>
          </div>

          {/* Connect */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: "0 0 12px", letterSpacing: 0.2 }}>Connect</h3>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <SocialButton href={SOCIAL_LINKS.discord} label="Join us on Discord">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
              </SocialButton>
              <SocialButton href={SOCIAL_LINKS.x} label="Follow us on X">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </SocialButton>
            </div>
            <a href="mailto:aircraftalerts@finalpingapp.com" className="fp-footer-link" style={{ fontSize: 12.5 }}>
              aircraftalerts@finalpingapp.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          marginTop: 40, padding: "20px 0",
          borderTop: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>© {new Date().getFullYear()} FinalPing. All rights reserved.</div>
          <div style={{ display: "flex", gap: 18 }}>
            <Link href="/privacy" className="fp-footer-link" style={{ fontSize: 12.5, fontWeight: 600, padding: 0, color: "var(--text)" }}>Privacy</Link>
            <Link href="/terms" className="fp-footer-link" style={{ fontSize: 12.5, fontWeight: 600, padding: 0, color: "var(--text)" }}>Terms</Link>
            <Link href="/refund-policy" className="fp-footer-link" style={{ fontSize: 12.5, fontWeight: 600, padding: 0, color: "var(--text)" }}>Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
