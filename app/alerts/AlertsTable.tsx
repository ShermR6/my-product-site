"use client";

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
  sms: "📲",
  whatsapp: "🟢",
};

const CHANNEL_COLORS: Record<string, string> = {
  discord: "#5865f2",
  slack: "#4a154b",
  teams: "#6264a7",
  email: "#0ea5e9",
  sms: "#10b981",
  whatsapp: "#25d366",
};

function formatAlertType(type: string) {
  if (type === "landing") return "🛬 Landing";
  return `📍 ${type} out`;
}

function formatDate(iso: string) {
  // Runs in browser — uses user's local timezone automatically
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function AlertsTable({ logs }: { logs: NotificationLog[] }) {
  return (
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
          <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>
            {log.aircraft_tail}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {log.message}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            {formatAlertType(log.alert_type)}
          </div>
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
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {formatDate(log.sent_at)}
          </div>
        </div>
      ))}
    </div>
  );
}
