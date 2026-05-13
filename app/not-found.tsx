import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "60px 24px",
    }}>
      <div style={{
        fontSize: 72,
        fontWeight: 800,
        color: "#0ea5e9",
        lineHeight: 1,
        marginBottom: 16,
        letterSpacing: "-0.04em",
      }}>
        404
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.02em" }}>
        Page not found
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 15, maxWidth: 400, lineHeight: 1.7, marginBottom: 32 }}>
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="btn btn-solid" style={{ padding: "11px 24px", borderRadius: "999px", fontSize: 14 }}>
          Go home
        </Link>
        <Link href="/contact" className="btn btn-outline" style={{ padding: "11px 24px", borderRadius: "999px", fontSize: 14 }}>
          Contact support
        </Link>
      </div>
    </div>
  );
}
