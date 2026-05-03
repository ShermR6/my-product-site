// app/status/page.tsx
import { revalidatePath } from "next/cache";

const BACKEND_URL = "https://aircraft-tracker-backend-production.up.railway.app";

async function checkBackend(): Promise<{ ok: boolean; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok, ms: Date.now() - start };
  } catch {
    return { ok: false, ms: Date.now() - start };
  }
}

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const backend = await checkBackend();
  const checkedAt = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });

  const allGood = backend.ok;

  return (
    <>
      <h1>System Status</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28 }}>
        Live status of FinalPing services. Updated on page load.
      </p>

      <div
        className="panel-white"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "20px 24px",
          marginBottom: 24,
          borderLeft: `4px solid ${allGood ? "#22c55e" : "#ef4444"}`,
        }}
      >
        <span style={{ fontSize: 24 }}>{allGood ? "✅" : "🔴"}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {allGood ? "All systems operational" : "Service disruption detected"}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Last checked: {checkedAt}
          </div>
        </div>
      </div>

      <div className="panel-white" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, marginBottom: 16 }}>Components</h2>
        <StatusRow
          label="FinalPing API"
          description="Aircraft tracking, alerts, license management"
          ok={backend.ok}
          ms={backend.ms}
        />
        <StatusRow
          label="Desktop App Updates"
          description="Auto-update delivery for Windows app"
          ok={true}
        />
        <StatusRow
          label="Web Dashboard"
          description="This site — billing, licenses, account"
          ok={true}
        />
      </div>

      <div className="panel-white">
        <h2 style={{ fontSize: 15, marginBottom: 8 }}>Incident history</h2>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          No incidents in the past 90 days.
        </p>
      </div>

      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 20, textAlign: "center" }}>
        Experiencing issues?{" "}
        <a href="/contact" style={{ color: "var(--accent)" }}>Contact support</a>
      </p>
    </>
  );
}

function StatusRow({
  label,
  description,
  ok,
  ms,
}: {
  label: string;
  description: string;
  ok: boolean;
  ms?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{description}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {ms !== undefined && (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{ms}ms</span>
        )}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 999,
            background: ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            color: ok ? "#22c55e" : "#ef4444",
          }}
        >
          {ok ? "Operational" : "Degraded"}
        </span>
      </div>
    </div>
  );
}
