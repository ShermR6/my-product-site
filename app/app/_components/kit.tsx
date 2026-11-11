"use client";

// Small shared building blocks for the web app's screens. Styles live in
// app/app/app.css.

import { useEffect } from "react";
import { Check as CheckGlyph } from "lucide-react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={{ flex: "none" }}>
      <circle cx="60" cy="60" r="40" fill="none" stroke="#0EA5E9" strokeWidth="8" strokeDasharray="195.4 48.9" strokeLinecap="round" />
      <path fill="var(--text)" transform="translate(87.5,32.5) rotate(225) scale(1.28)" d={PLANE_PATH} />
    </svg>
  );
}

/** Top-down aircraft outline pointing north, centered on 0,0, about 32 units wide. */
export const PLANE_PATH =
  "M0,-15 C1.8,-15 3,-11.5 3,-8 L3,-3.2 L16,3.8 L16,7.2 L3,4.2 L3,9 L7,12.2 L7,14.6 L0,12.8 L-7,14.6 L-7,12.2 L-3,9 L-3,4.2 L-16,7.2 L-16,3.8 L-3,-3.2 L-3,-8 C-3,-11.5 -1.8,-15 0,-15 Z";

export function PageHead({
  eyebrow, title, sub, hero, children,
}: {
  eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; hero?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className="fa-head">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="fa-eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h1 className={hero ? "fa-hero-title" : "fa-title"}>{title}</h1>
        {sub && <p className="fa-sub">{sub}</p>}
      </div>
      {children && <div className="fa-actions">{children}</div>}
    </div>
  );
}

export function Card({
  title, note, children, style, className,
}: {
  title?: React.ReactNode; note?: React.ReactNode; children?: React.ReactNode; style?: React.CSSProperties; className?: string;
}) {
  return (
    <section className={`fa-card ${className ?? ""}`} style={style}>
      {(title || note) && (
        <div className="fa-card-head">
          <span className="fa-card-title">{title}</span>
          {note && <span className="fa-card-note">{note}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger";
  square?: boolean;
  small?: boolean;
};

export function Btn({ variant, square, small, className, type, ...rest }: BtnProps) {
  const cls = ["fa-btn", variant, square && "square", small && "small", className].filter(Boolean).join(" ");
  return <button type={type ?? "button"} className={cls} {...rest} />;
}

export function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" className="fa-toggle" aria-checked={on} aria-label={label}
      disabled={disabled} onClick={() => onChange(!on)}
    />
  );
}

export function Check({ on, onChange, label, disabled }: { on: boolean; onChange?: (next: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="checkbox" className="fa-check" aria-checked={on} aria-label={label}
      disabled={disabled} onClick={() => onChange?.(!on)}
    >
      {on && <CheckGlyph size={14} strokeWidth={3} aria-hidden="true" />}
    </button>
  );
}

export function Modal({ title, sub, onClose, children }: { title: string; sub?: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fa-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fa-modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {sub && <p className="fa-note" style={{ marginBottom: 16 }}>{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="fa-empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="fa-field" style={{ display: "block" }}>
      <span className="fa-label">{label}</span>
      {children}
      {hint && <span className="fa-note" style={{ display: "block", marginTop: 6 }}>{hint}</span>}
    </label>
  );
}

/** A tail number or other figure in the monospace face. */
export function Tail({ children, size }: { children: React.ReactNode; size?: number }) {
  return <span className="mono" style={{ fontWeight: 600, fontSize: size }}>{children}</span>;
}
