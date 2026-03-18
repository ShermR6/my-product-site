export default function AlertsLoading() {
  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 32, width: 180, background: "rgba(255,255,255,0.07)", borderRadius: 8, marginBottom: 8 }} />
        <div style={{ height: 16, width: 320, background: "rgba(255,255,255,0.04)", borderRadius: 6 }} />
      </div>

      {/* Stats row skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="panel" style={{ padding: "16px 20px" }}>
            <div style={{ height: 12, width: 60, background: "rgba(255,255,255,0.06)", borderRadius: 4, marginBottom: 10 }} />
            <div style={{ height: 28, width: 40, background: "rgba(255,255,255,0.09)", borderRadius: 6 }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "80px 1fr 120px 100px 80px 160px",
          gap: 12,
        }}>
          {[80, 200, 100, 80, 60, 120].map((w, i) => (
            <div key={i} style={{ height: 10, width: w, background: "rgba(255,255,255,0.06)", borderRadius: 4 }} />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            padding: "16px 20px",
            borderBottom: i < 7 ? "1px solid var(--border)" : "none",
            display: "grid",
            gridTemplateColumns: "80px 1fr 120px 100px 80px 160px",
            gap: 12,
            alignItems: "center",
            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
          }}>
            {[60, 180, 90, 70, 50, 110].map((w, j) => (
              <div key={j} style={{ height: 12, width: w, background: "rgba(255,255,255,0.06)", borderRadius: 4 }} />
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        div[style*="rgba(255,255,255,0.0"] {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
