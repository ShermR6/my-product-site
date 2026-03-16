import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://aircraft-tracker-backend-production.up.railway.app";
const INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET ?? "";

type NotificationLog = {
  id: string;
  aircraft_tail: string;
  alert_type: string;
  message: string;
  integration_type: string;
  status: string;
  sent_at: string;
};

const CHANNEL_ICONS: Record<string, string> = {
  discord: "💬",
  slack: "📱",
  teams: "👥",
  email: "✉️",
};

const CHANNEL_COLORS: Record<string, string> = {
  discord: "#5865f2",
  slack: "#4a154b",
  teams: "#6264a7",
  email: "#0ea5e9",
};

function formatAlertType(type: string) {
  if (type === "landing") return "🛬 Landing";
  return `📍 ${type} out`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default async function AlertHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const email = session.user.email;

  let logs: NotificationLog[] = [];
  let fetchError = false;

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/internal/notifications?email=${encodeURIComponent(email)}&limit=100`,
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        next: { revalidate: 30 },
      }
    );
    if (res.ok) {
      logs = await res.json();
    } else {
      fetchError = true;
    }
  } catch {
    fetchError = true;
  }

  // Stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());

  const todayCount = logs.filter(l => new Date(l.sent_at) >= todayStart).length;
  const weekCount = logs.filter(l => new Date(l.sent_at) >= weekStart).length;
  const totalCount = logs.length;

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 4 }}>Alert History</h1>
        <p style={{ margin: 0 }}>All notifications sent by the cloud tracker for your account.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Today", value: todayCount },
          { label: "This Week", value: weekCount },
          { label: "All Time", value: totalCount },
        ].map(stat => (
          <div key={stat.label} className="panel" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {fetchError ? (
        <div className="panel" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
          <p style={{ marginBottom: 0 }}>Could not load alert history. Please try again later.</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <h2 style={{ marginBottom: 8 }}>No alerts yet</h2>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Alerts will appear here once the cloud tracker sends notifications for your aircraft.
          </p>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 120px 100px 80px 160px",
            gap: 12,
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            <div>Aircraft</div>
            <div>Message</div>
            <div>Alert Type</div>
            <div>Channel</div>
            <div>Status</div>
            <div>Time</div>
          </div>

          {/* Rows */}
          {logs.map((log, i) => (
            <div
              key={log.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 120px 100px 80px 160px",
                gap: 12,
                padding: "14px 20px",
                borderBottom: i < logs.length - 1 ? "1px solid var(--border)" : "none",
                fontSize: 13,
                alignItems: "center",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
              }}
            >
              {/* Aircraft */}
              <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>
                {log.aircraft_tail}
              </div>

              {/* Message */}
              <div style={{ color: "var(--muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.message}
              </div>

              {/* Alert type */}
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {formatAlertType(log.alert_type)}
              </div>

              {/* Channel */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{CHANNEL_ICONS[log.integration_type] ?? "🔔"}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: CHANNEL_COLORS[log.integration_type] ?? "var(--muted)",
                  textTransform: "capitalize",
                }}>
                  {log.integration_type}
                </span>
              </div>

              {/* Status */}
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "3px 8px", borderRadius: 999,
                  background: log.status === "sent" ? "rgba(35,199,107,0.15)" : "rgba(239,68,68,0.15)",
                  color: log.status === "sent" ? "#23c76b" : "#ef4444",
                  border: `1px solid ${log.status === "sent" ? "rgba(35,199,107,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                  {log.status === "sent" ? "Sent" : "Failed"}
                </span>
              </div>

              {/* Time */}
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {formatDate(log.sent_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
