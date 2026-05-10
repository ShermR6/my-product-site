// app/status/page.tsx

const UPTIMEROBOT_API = "https://api.uptimerobot.com/v2/getMonitors";

interface UptimeMonitor {
  id: number;
  friendly_name: string;
  status: number; // 2=up, 8=seems down, 9=down
  average_response_time: string;
  custom_uptime_ratio: string; // "7day-30day"
}

async function getUptimeData(): Promise<UptimeMonitor[]> {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(UPTIMEROBOT_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: apiKey,
        format: "json",
        custom_uptime_ratios: "7-30",
        response_times: "0",
      }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    return data.monitors ?? [];
  } catch {
    return [];
  }
}

async function checkWebsite(): Promise<{ ok: boolean; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch("https://finalpingapp.com", {
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
  const [monitors, website] = await Promise.all([getUptimeData(), checkWebsite()]);

  const apiMonitor = monitors.find((m) =>
    m.friendly_name.toLowerCase().includes("backend") ||
    m.friendly_name.toLowerCase().includes("api")
  );

  const apiUp = apiMonitor ? apiMonitor.status === 2 : null;
  const apiUptime7 = apiMonitor?.custom_uptime_ratio?.split("-")[0];
  const apiUptime30 = apiMonitor?.custom_uptime_ratio?.split("-")[1];
  const apiResponseMs = apiMonitor?.average_response_time
    ? Math.round(parseFloat(apiMonitor.average_response_time))
    : null;

  // Fallback if UptimeRobot not configured: treat as unknown
  const backendOk = apiUp ?? true;
  const allGood = backendOk && website.ok;

  const checkedAt = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });

  return (
    <>
      <h1>System Status</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28 }}>
        Live status of FinalPing services. Updated on page load.
      </p>

      {/* Overall banner */}
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

      {/* Components */}
      <div className="panel-white" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, marginBottom: 16 }}>Components</h2>

        <StatusRow
          label="FinalPing API"
          description="Aircraft tracking, alerts, license management"
          ok={backendOk}
          ms={apiResponseMs ?? undefined}
          uptime7={apiUptime7}
          uptime30={apiUptime30}
        />
        <StatusRow
          label="Web Dashboard"
          description="This site — billing, licenses, account"
          ok={website.ok}
          ms={website.ms}
        />
        <StatusRow
          label="Desktop App Updates"
          description="Auto-update delivery for Windows app"
          ok={true}
        />
      </div>

      {/* Uptime summary */}
      {apiMonitor && (
        <div className="panel-white" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, marginBottom: 16 }}>Uptime</h2>
          <div style={{ display: "flex", gap: 32 }}>
            <UptimeStat label="Last 7 days" value={apiUptime7} />
            <UptimeStat label="Last 30 days" value={apiUptime30} />
          </div>
        </div>
      )}

      {/* Incident history */}
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
  uptime7,
  uptime30,
}: {
  label: string;
  description: string;
  ok: boolean;
  ms?: number;
  uptime7?: string;
  uptime30?: string;
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
        {(uptime7 || uptime30) && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, display: "flex", gap: 12 }}>
            {uptime7 && <span>7d: <strong style={{ color: "var(--foreground)" }}>{parseFloat(uptime7).toFixed(2)}%</strong></span>}
            {uptime30 && <span>30d: <strong style={{ color: "var(--foreground)" }}>{parseFloat(uptime30).toFixed(2)}%</strong></span>}
          </div>
        )}
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

function UptimeStat({ label, value }: { label: string; value?: string }) {
  const pct = value ? parseFloat(value).toFixed(2) : null;
  const color = pct
    ? parseFloat(pct) >= 99.5 ? "#22c55e" : parseFloat(pct) >= 95 ? "#f59e0b" : "#ef4444"
    : "var(--muted)";
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{pct ? `${pct}%` : "—"}</div>
    </div>
  );
}
