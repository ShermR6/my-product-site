import { getServerSession } from "next-auth";
import AlertsTable from "./AlertsTable";
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
        <AlertsTable logs={logs} />
      )}
    </>
  );
}
