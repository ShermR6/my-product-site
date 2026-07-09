"use client";
// app/dashboard/page.tsx

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import React from "react";

type License = {
  id: string; licenseKey: string; tier: string; status: string;
  activatedAt: string | null; expiresAt: string | null; createdAt: string;
};
type NotificationLog = {
  id: string; aircraft_tail: string; alert_type: string; message: string;
  integration_type: string; status: string; sent_at: string;
};
type TwoFAStatus = { email: boolean; sms: boolean; totp: boolean; phone: string | null; };

const tierLabels: Record<string, string> = {
  starter: "Starter", premium: "Premium", pro: "Pro",
  "team-starter": "Team Starter", "team-premium": "Team Premium", "team-pro": "Team Pro",
};
const CHANNEL_COLORS: Record<string, string> = { discord: "#5865f2", slack: "#4a154b", teams: "#6264a7", email: "#0ea5e9", sms: "#10b981", whatsapp: "#25d366" };

function getExpiryLabel(expiresAt: string | null, status: string, activatedAt: string | null): { label: string; color: string } {
  if (status === "expired") return { label: "Expired", color: "#DC2626" };
  if (status === "inactive" || !activatedAt) return { label: "Not Activated", color: "#f59e0b" };
  if (!expiresAt) return { label: "Active", color: "#15803D" };

  const now = new Date();
  const expires = new Date(expiresAt);
  const msLeft = expires.getTime() - now.getTime();

  if (msLeft <= 0) return { label: "Expired", color: "#DC2626" };

  const totalMinutes = Math.floor(msLeft / (1000 * 60));
  const totalHours = Math.floor(msLeft / (1000 * 60 * 60));
  const totalDays = Math.floor(msLeft / (1000 * 60 * 60 * 24));

  // Last 60 minutes — count down by minute
  if (totalMinutes < 60) {
    const mins = totalMinutes;
    return { label: `Expires in ${mins} minute${mins !== 1 ? "s" : ""}`, color: "#DC2626" };
  }

  // Last 24 hours — show hours
  if (totalHours < 24) {
    return { label: `Expires in ${totalHours} hour${totalHours !== 1 ? "s" : ""}`, color: "#f59e0b" };
  }

  // More than 24 hours — show days
  if (totalDays <= 7) return { label: `Expiring in ${totalDays} day${totalDays !== 1 ? "s" : ""}`, color: "#f59e0b" };
  return { label: `Active — ${totalDays} days left`, color: "#15803D" };
}

function useLicenseCountdown(expiresAt: string | null, status: string, activatedAt: string | null) {
  const [label, setLabel] = useState(() => getExpiryLabel(expiresAt, status, activatedAt));

  useEffect(() => {
    if (!expiresAt || status === "expired" || status === "inactive") return;

    const update = () => setLabel(getExpiryLabel(expiresAt, status, activatedAt));
    update();

    const msLeft = new Date(expiresAt).getTime() - Date.now();
    const totalMinutes = Math.floor(msLeft / (1000 * 60));

    // Tick every minute if under 60 mins, every hour otherwise
    const interval = totalMinutes < 60 ? 60 * 1000 : 60 * 60 * 1000;
    const timer = setInterval(update, interval);
    return () => clearInterval(timer);
  }, [expiresAt, status, activatedAt]);

  return label;
}
function formatAlertType(type: string) { return type === "landing" ? "🛬 Landing" : `📍 ${type} out`; }
function formatDate(iso: string, timeZone?: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
      ...(timeZone ? { timeZone } : {}),
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  return isClient;
}

function LocalDate({ iso }: { iso: string }) {
  const isClient = useIsClient();
  const [formatted, setFormatted] = useState<string>("—");
  useEffect(() => {
    if (isClient) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Ensure timestamp is treated as UTC by appending Z if missing
      const utcIso = iso.endsWith("Z") || iso.includes("+") ? iso : iso + "Z";
      setFormatted(formatDate(utcIso, tz));
    }
  }, [isClient, iso]);
  return <>{formatted}</>;
}
function exportToTxt(logs: NotificationLog[]) {
  const header = `FinalPing Alert History Export\nExported: ${new Date().toLocaleString()}\nTotal Alerts: ${logs.length}\n${"=".repeat(80)}\n\n`;
  const rows = logs.map(l => `[${formatDate(l.sent_at)}] ${l.aircraft_tail} — ${l.alert_type} — ${l.integration_type} — ${l.status}\n  ${l.message}`).join("\n\n");
  const blob = new Blob([header + rows], { type: "text/plain" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = `finalping-alerts-${new Date().toISOString().slice(0, 10)}.txt`; a.click(); URL.revokeObjectURL(url);
}

function StatusMsg({ msg }: { msg: { text: string; type: "success" | "error" } | null }) {
  if (!msg) return null;
  return (
    <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13,
      background: msg.type === "success" ? "rgba(35,199,107,0.1)" : "rgba(239,68,68,0.1)",
      color: msg.type === "success" ? "#15803D" : "#DC2626",
      border: `1px solid ${msg.type === "success" ? "rgba(35,199,107,0.3)" : "rgba(239,68,68,0.3)"}` }}>
      {msg.text}
    </div>
  );
}

function CodeInput({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit?: () => void }) {
  return (
    <input type="text" inputMode="numeric" maxLength={6} value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      onKeyDown={e => { if (e.key === "Enter" && onSubmit) onSubmit(); }}
      placeholder="000000"
      style={{ ...styles.input, letterSpacing: "0.3em", fontSize: 20, fontWeight: 700, textAlign: "center" as const }}
      onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} />
  );
}

type DeleteStep = "idle" | "confirm" | "choose-method" | "enter-code" | "totp-code";

type ProfileStep = "idle" | "editing" | "choose-method" | "enter-code" | "totp-code" | "done";

function AccountTab({ email, session }: { email: string; session: any }) {
  const [memberSince, setMemberSince] = useState<string>("—");
  const [displayName, setDisplayName] = useState<string>("");
  const [displayEmail, setDisplayEmail] = useState<string>(email);

  // Profile edit state
  const [profileStep, setProfileStep] = useState<ProfileStep>("idle");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileMethods, setProfileMethods] = useState<{ id: "email" | "sms" | "totp"; label: string }[]>([]);
  const [profileMethod, setProfileMethod] = useState<"email" | "sms" | "totp" | null>(null);
  const [profileCode, setProfileCode] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [resendingProfile, setResendingProfile] = useState(false);

  const [deleteStep, setDeleteStep] = useState<DeleteStep>("idle");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string>("");
  const [twoFA, setTwoFA] = useState<TwoFAStatus | null>(null);
  const [deleteMethod, setDeleteMethod] = useState<"email" | "sms" | "totp" | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (data?.createdAt) {
          setMemberSince(new Date(data.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));
        }
        setDisplayName(data?.name ?? "");
      })
      .catch(() => {});
    fetch("/api/auth/2fa/status")
      .then(r => r.json())
      .then(d => setTwoFA(d))
      .catch(() => {});
  }, []);

  // Step 1: click Edit Profile → immediately send 2FA code
  const startEditProfile = async (method?: "email" | "sms" | "totp") => {
    setProfileLoading(true);
    setProfileMsg(null);
    setProfileCode("");
    try {
      const r = await fetch("/api/auth/change-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const d = await r.json();
      if (!r.ok) { setProfileMsg({ text: d.error || "Failed to send code.", type: "error" }); return; }
      if (d.step === "choose-method") {
        setProfileMethods(d.methods);
        setProfileStep("choose-method");
      } else if (d.step === "totp-code") {
        setProfileMethod("totp");
        setProfileStep("totp-code");
      } else {
        setProfileMethod(d.method);
        setProfileStep("enter-code");
      }
    } catch {
      setProfileMsg({ text: "Something went wrong.", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const resetProfile = () => {
    setProfileStep("idle");
    setProfileMsg(null);
    setProfileCode("");
    setProfileMethod(null);
  };

  // Step 2: verify the code → unlock edit form
  const confirmProfileVerify = async () => {
    if (profileCode.length < 6) { setProfileMsg({ text: "Enter the 6-digit code.", type: "error" }); return; }
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const r = await fetch("/api/auth/confirm-profile-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: profileCode }),
      });
      const d = await r.json();
      if (!r.ok) { setProfileMsg({ text: d.error || "Invalid code.", type: "error" }); return; }
      // Unlock: show the edit form pre-filled with current values
      setProfileName(displayName);
      setProfileEmail(displayEmail);
      setProfileMsg(null);
      setProfileStep("editing");
    } catch {
      setProfileMsg({ text: "Something went wrong.", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  // Step 3: save the edited values
  const saveProfile = async () => {
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const r = await fetch("/api/auth/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, email: profileEmail }),
      });
      const d = await r.json();
      if (!r.ok) { setProfileMsg({ text: d.error || "Failed to save.", type: "error" }); return; }
      setDisplayName(d.newName ?? "");
      if (d.emailChanged) {
        setDisplayEmail(profileEmail.trim().toLowerCase());
        setProfileStep("done");
      } else {
        setProfileStep("idle");
        setProfileMsg({ text: "Profile updated successfully.", type: "success" });
      }
    } catch {
      setProfileMsg({ text: "Something went wrong.", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const resendProfileCode = async () => {
    if (!profileMethod || profileMethod === "totp") return;
    setResendingProfile(true);
    try {
      await fetch("/api/auth/2fa/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: profileMethod, context: "profile-change" }),
      });
      setProfileMsg({ text: "New code sent.", type: "success" });
    } catch {
      setProfileMsg({ text: "Failed to resend code.", type: "error" });
    } finally {
      setResendingProfile(false);
    }
  };

  const has2FA = twoFA && (twoFA.email || twoFA.sms || twoFA.totp);
  const activeMethods = twoFA ? [
    ...(twoFA.email ? [{ id: "email" as const, label: "Email" }] : []),
    ...(twoFA.sms ? [{ id: "sms" as const, label: `SMS (${twoFA.phone ?? ""})` }] : []),
    ...(twoFA.totp ? [{ id: "totp" as const, label: "Authenticator App" }] : []),
  ] : [];

  const resetDelete = () => {
    setDeleteStep("idle");
    setDeleteMsg("");
    setDeleteMethod(null);
    setDeleteCode("");
  };

  const handleConfirm = () => {
    if (!has2FA) {
      setDeleteStep("confirm");
      return;
    }
    if (activeMethods.length === 1) {
      sendDeletionCode(activeMethods[0].id);
    } else {
      setDeleteStep("choose-method");
    }
  };

  const sendDeletionCode = async (method: "email" | "sms" | "totp") => {
    if (method === "totp") {
      setDeleteMethod("totp");
      setDeleteStep("totp-code");
      return;
    }
    setSendingCode(true);
    setDeleteMsg("");
    try {
      const r = await fetch("/api/auth/2fa/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, context: "account-deletion" }),
      });
      const d = await r.json();
      if (!r.ok) { setDeleteMsg(d.error || "Failed to send code."); return; }
      setDeleteMethod(method);
      setDeleteStep("enter-code");
    } catch {
      setDeleteMsg("Something went wrong. Please try again.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleDeleteNoTwoFA = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        setDeleteMsg("Failed to delete account. Please try again.");
        setDeleting(false);
      }
    } catch {
      setDeleteMsg("Something went wrong.");
      setDeleting(false);
    }
  };

  const handleVerifyAndDelete = async () => {
    if (deleteCode.length < 6) { setDeleteMsg("Enter the 6-digit code."); return; }
    setDeleting(true);
    setDeleteMsg("");
    try {
      const r = await fetch("/api/auth/2fa/verify-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: deleteCode }),
      });
      const d = await r.json();
      if (!r.ok) { setDeleteMsg(d.error || "Invalid code."); setDeleting(false); return; }
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleteMsg("Something went wrong.");
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={styles.tabHeader}><h2 style={styles.tabTitle}>Account Information</h2><p style={styles.tabSub}>Your profile and account details</p></div>

      {/* Read-only info card */}
      <div style={styles.card}>
        <div style={styles.infoRow}><span style={styles.infoLabel}>Email Address</span><span style={styles.infoValue}>{displayEmail}</span></div>
        <div style={styles.infoRow}><span style={styles.infoLabel}>Display Name</span>
          <span style={{ ...styles.infoValue, color: displayName ? "var(--text)" : "var(--muted)", fontStyle: displayName ? "normal" : "italic" }}>
            {displayName || "Not set"}
          </span>
        </div>
        <div style={styles.infoRowLast}><span style={styles.infoLabel}>Member Since</span><span style={styles.infoValue}>{memberSince}</span></div>
      </div>

      {/* Profile message (shown when idle after a change) */}
      {profileStep === "idle" && profileMsg && <StatusMsg msg={profileMsg} />}

      {/* Buttons row */}
      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        {profileStep === "idle" && (
          <button onClick={() => startEditProfile()} disabled={profileLoading} style={{ ...styles.primaryBtn, opacity: profileLoading ? 0.6 : 1 }}
            onMouseEnter={e => { if (!profileLoading) e.currentTarget.style.background = "#EA6A0F"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#F97316"; }}>
            {profileLoading ? "Sending code..." : "Edit Profile"}
          </button>
        )}
        <button onClick={() => signOut({ callbackUrl: "/" })} style={styles.dangerBtn}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>Sign Out</button>
      </div>
      {profileStep === "idle" && profileMsg && <StatusMsg msg={profileMsg} />}

      {/* Edit Profile section */}
      {profileStep !== "idle" && (
        <div style={{ ...styles.card, marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Edit Profile</div>

          {/* Step 1b: choose 2FA method */}
          {profileStep === "choose-method" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Verify your identity</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Choose how to confirm it's you before editing:</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {profileMethods.map(m => (
                  <button key={m.id} onClick={() => startEditProfile(m.id)} disabled={profileLoading}
                    style={{ ...styles.methodBtn, opacity: profileLoading ? 0.6 : 1 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.background = "rgba(14,165,233,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--panel)"; }}>
                    {m.id === "email" ? "✉️" : m.id === "sms" ? "📲" : "🔐"} {m.label}
                  </button>
                ))}
              </div>
              <button onClick={resetProfile} style={{ ...styles.ghostBtn, marginTop: 10 }}>Cancel</button>
              <StatusMsg msg={profileMsg} />
            </div>
          )}

          {/* Step 2: enter verification code */}
          {(profileStep === "enter-code" || profileStep === "totp-code") && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {profileStep === "totp-code" ? "Enter code from your authenticator app" : "Enter verification code"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
                {profileStep === "totp-code"
                  ? "Open your authenticator app and enter the 6-digit code to unlock editing."
                  : profileMethod === "email"
                    ? `Code sent to ${displayEmail} — enter it to unlock editing.`
                    : "Code sent to your phone — enter it to unlock editing."}
              </div>
              <CodeInput value={profileCode} onChange={setProfileCode} onSubmit={confirmProfileVerify} />
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" as const }}>
                <button onClick={confirmProfileVerify} disabled={profileLoading}
                  style={{ ...styles.primaryBtn, opacity: profileLoading ? 0.6 : 1, cursor: profileLoading ? "not-allowed" : "pointer" }}
                  onMouseEnter={e => { if (!profileLoading) e.currentTarget.style.background = "#EA6A0F"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F97316"; }}>
                  {profileLoading ? "Verifying..." : "Verify →"}
                </button>
                {profileStep !== "totp-code" && (
                  <button onClick={resendProfileCode} disabled={resendingProfile} style={styles.ghostBtn}>
                    {resendingProfile ? "Sending..." : "Resend"}
                  </button>
                )}
                <button onClick={resetProfile} style={styles.ghostBtn}>Cancel</button>
              </div>
              <StatusMsg msg={profileMsg} />
            </div>
          )}

          {/* Step 3: edit form (unlocked after 2FA) */}
          {profileStep === "editing" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={styles.inputLabel}>Display Name</label>
                  <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)}
                    placeholder="Your display name" style={styles.input}
                    onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} />
                </div>
                <div>
                  <label style={styles.inputLabel}>Email Address</label>
                  <input type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)}
                    placeholder="your@email.com" style={styles.input}
                    onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} />
                </div>
              </div>
              <StatusMsg msg={profileMsg} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={saveProfile} disabled={profileLoading}
                  style={{ ...styles.primaryBtn, opacity: profileLoading ? 0.6 : 1, cursor: profileLoading ? "not-allowed" : "pointer" }}
                  onMouseEnter={e => { if (!profileLoading) e.currentTarget.style.background = "#EA6A0F"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F97316"; }}>
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={resetProfile} style={styles.ghostBtn}>Cancel</button>
              </div>
            </div>
          )}

          {profileStep === "done" && (
            <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Profile updated</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
                Your email address was changed. Please sign in again with your new email.
              </div>
              <button onClick={() => signOut({ callbackUrl: "/" })} style={styles.primaryBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "#EA6A0F"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#F97316"; }}>
                Sign Out & Sign In Again
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 32, padding: "20px 24px", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, background: "rgba(239,68,68,0.04)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#DC2626", margin: "0 0 6px" }}>Delete Account</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>Permanently delete your account and cancel any active subscriptions. This cannot be undone.</p>

        {deleteStep === "idle" && (
          <button onClick={handleConfirm} style={{ ...styles.dangerBtn, borderColor: "rgba(239,68,68,0.3)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>Delete Account</button>
        )}

        {deleteStep === "confirm" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 13, color: "#DC2626" }}>Are you sure? This is permanent.</span>
            <button onClick={handleDeleteNoTwoFA} disabled={deleting}
              style={{ padding: "8px 16px", background: "#DC2626", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}>
              {deleting ? "Deleting..." : "Yes, delete"}
            </button>
            <button onClick={resetDelete}
              style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            {deleteMsg && <span style={{ fontSize: 13, color: "#DC2626", width: "100%" }}>{deleteMsg}</span>}
          </div>
        )}

        {deleteStep === "choose-method" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Verify your identity</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Choose how you want to confirm account deletion:</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {activeMethods.map(m => (
                <button key={m.id} onClick={() => sendDeletionCode(m.id)} disabled={sendingCode}
                  style={{ ...styles.methodBtn, opacity: sendingCode ? 0.6 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#DC2626"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--panel)"; }}>
                  {m.id === "email" ? "✉️" : m.id === "sms" ? "📲" : "🔐"} {m.label}
                </button>
              ))}
            </div>
            <button onClick={resetDelete} style={{ ...styles.ghostBtn, marginTop: 10 }}>Cancel</button>
            {deleteMsg && <div style={{ marginTop: 10, fontSize: 13, color: "#DC2626" }}>{deleteMsg}</div>}
          </div>
        )}

        {(deleteStep === "enter-code" || deleteStep === "totp-code") && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {deleteStep === "totp-code" ? "Enter code from your authenticator app" : "Enter verification code"}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
              {deleteStep === "totp-code"
                ? "Open your authenticator app and enter the 6-digit code to confirm deletion."
                : deleteMethod === "email" ? `Code sent to ${email}` : "Code sent to your phone"}
            </div>
            <CodeInput value={deleteCode} onChange={setDeleteCode} onSubmit={handleVerifyAndDelete} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" as const }}>
              <button onClick={handleVerifyAndDelete} disabled={deleting}
                style={{ padding: "9px 18px", borderRadius: 8, background: "#DC2626", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Deleting..." : "Confirm Deletion"}
              </button>
              {deleteStep !== "totp-code" && (
                <button onClick={() => sendDeletionCode(deleteMethod!)} disabled={sendingCode} style={styles.ghostBtn}>
                  {sendingCode ? "Sending..." : "Resend"}
                </button>
              )}
              <button onClick={resetDelete} style={styles.ghostBtn}>Cancel</button>
            </div>
            {deleteMsg && <div style={{ marginTop: 10, fontSize: 13, color: "#DC2626" }}>{deleteMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

const TIER_ORDER = ["starter", "premium", "pro"];
const MONTHLY_PRICES: Record<string, number> = { starter: 14.99, premium: 24.99, pro: 49.99 };
const YEARLY_PRICES: Record<string, number> = { starter: 149, premium: 249, pro: 499 };

function LicensesTab({ licenses, loading }: { licenses: License[]; loading: boolean }) {
  if (loading) return <div style={styles.loadingText}>Loading licenses...</div>;
  return (
    <div>
      <div style={styles.tabHeader}><h2 style={styles.tabTitle}>Your Licenses</h2><p style={styles.tabSub}>All license keys associated with your account</p></div>
      {licenses.length === 0 ? (
        <div style={{ ...styles.card, textAlign: "center" as const, padding: "40px 24px" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>No licenses yet.</p>
          <Link href="/pricing" style={styles.outlineBtn}>Browse Plans</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          {licenses.map(license => <LicenseCard key={license.id} license={license} />)}
        </div>
      )}
    </div>
  );
}

function LicenseCard({ license }: { license: License }) {
  const { label, color } = useLicenseCountdown(license.expiresAt, license.status, license.activatedAt);
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={styles.tierBadge}>{tierLabels[license.tier] ?? license.tier} LICENSE</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />{label}
        </span>
      </div>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" as const }}>
        <div><div style={styles.metaLabel}>License Key</div><div style={styles.licenseKey}>{license.licenseKey}</div></div>
        <div><div style={styles.metaLabel}>Purchased</div><div style={styles.metaValue}>{new Date(license.createdAt).toLocaleDateString()}</div></div>
        {license.activatedAt && <div><div style={styles.metaLabel}>Activated</div><div style={styles.metaValue}>{new Date(license.activatedAt).toLocaleDateString()}</div></div>}
        {license.expiresAt && <div><div style={styles.metaLabel}>Expires</div><div style={styles.metaValue}>{new Date(license.expiresAt).toLocaleDateString()}</div></div>}
      </div>
    </div>
  );
}

function CheckboxDropdown({ label, options, selected, onChange, formatLabel }: {
  label: string; options: string[]; selected: string[];
  onChange: (vals: string[]) => void; formatLabel?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (val: string) => onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);

  const btnStyle: React.CSSProperties = {
    padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
    background: selected.length > 0 ? "rgba(14,165,233,0.12)" : "#F1F5F9",
    border: selected.length > 0 ? "1px solid rgba(14,165,233,0.4)" : "1px solid var(--border)",
    color: selected.length > 0 ? "#0ea5e9" : "var(--text)",
    cursor: "pointer", outline: "none", display: "flex", alignItems: "center", gap: 6,
  };

  return (
    <div ref={ref} style={{ position: "relative" as const }}>
      <button style={btnStyle} onClick={() => setOpen(o => !o)}>
        {label}{selected.length > 0 ? ` (${selected.length})` : ""} ▾
      </button>
      {open && (
        <div style={{
          position: "absolute" as const, top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "#1a1a2e", border: "1px solid var(--border)", borderRadius: 10,
          padding: "8px 0", minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {options.map(opt => (
            <label key={opt} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", cursor: "pointer", fontSize: 13, color: selected.includes(opt) ? "var(--text)" : "var(--muted)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)}
                style={{ accentColor: "#0ea5e9", width: 14, height: 14, flexShrink: 0 }} />
              {formatLabel ? formatLabel(opt) : opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertsTab({ email }: { email: string }) {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [allAircraft, setAllAircraft] = useState<string[]>([]);
  const [allChannels, setAllChannels] = useState<string[]>([]);

  useEffect(() => {
    // Fetch logs
    fetch("/api/alerts-proxy")
      .then(r => r.json())
      .then(d => setLogs(Array.isArray(d) ? d : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    // Fetch all aircraft from Railway
    fetch("/api/alerts-proxy/aircraft")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllAircraft(d.map((a: any) => a.tail_number).sort()); })
      .catch(() => {});

    // Fetch all integrations from Railway
    fetch("/api/alerts-proxy/integrations")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAllChannels(d.map((i: any) => i.type).sort()); })
      .catch(() => {});
  }, []);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart); weekStart.setDate(todayStart.getDate() - todayStart.getDay());

  const ALL_CHANNEL_TYPES = ["discord", "slack", "teams", "email", "sms", "whatsapp"];
  const aircraftOptions = Array.from(new Set([...allAircraft, ...logs.map(l => l.aircraft_tail)])).sort();
  const typeOptions = Array.from(new Set(logs.map(l => l.alert_type))).sort((a, b) => {
    const nmA = parseFloat(a); const nmB = parseFloat(b);
    if (!isNaN(nmA) && !isNaN(nmB)) return nmA - nmB;
    if (!isNaN(nmA)) return -1; if (!isNaN(nmB)) return 1;
    return a.localeCompare(b);
  });
  const channelOptions = Array.from(new Set([...ALL_CHANNEL_TYPES, ...allChannels, ...logs.map(l => l.integration_type)])).sort();

  const filtered = logs.filter(l =>
    (selectedAircraft.length === 0 || selectedAircraft.includes(l.aircraft_tail)) &&
    (selectedTypes.length === 0 || selectedTypes.includes(l.alert_type)) &&
    (selectedChannels.length === 0 || selectedChannels.includes(l.integration_type))
  );

  const hasFilters = selectedAircraft.length > 0 || selectedTypes.length > 0 || selectedChannels.length > 0;
  const formatType = (t: string) => t === "landing" ? "🛬 Landing" : `📍 ${t} out`;
  const formatChannel = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);

  if (loading) return <div style={styles.loadingText}>Loading alert history...</div>;

  return (
    <div>
      <div style={{ ...styles.tabHeader, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div><h2 style={styles.tabTitle}>Alert History</h2><p style={styles.tabSub}>All notifications sent by the cloud tracker</p></div>
        {logs.length > 0 && (
          <button onClick={() => exportToTxt(filtered)} style={styles.exportBtn}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(15,23,42,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#F1F5F9"; }}>
            ⬇ Export .txt
          </button>
        )}
      </div>

      {/* Stats — based on full logs not filtered */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Today", value: logs.filter(l => new Date(l.sent_at) >= todayStart).length },
          { label: "This Week", value: logs.filter(l => new Date(l.sent_at) >= weekStart).length },
          { label: "All Time", value: logs.length },
        ].map(s => (
          <div key={s.label} style={styles.statCard}><div style={styles.statLabel}>{s.label}</div><div style={styles.statValue}>{s.value}</div></div>
        ))}
      </div>

      {/* Filters */}
      {logs.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>🔽 Filter:</span>
          <CheckboxDropdown label="Aircraft" options={aircraftOptions} selected={selectedAircraft} onChange={setSelectedAircraft} />
          <CheckboxDropdown label="Alert Types" options={typeOptions} selected={selectedTypes} onChange={setSelectedTypes} formatLabel={formatType} />
          <CheckboxDropdown label="Channels" options={channelOptions} selected={selectedChannels} onChange={setSelectedChannels} formatLabel={formatChannel} />
          {hasFilters && (
            <button onClick={() => { setSelectedAircraft([]); setSelectedTypes([]); setSelectedChannels([]); }}
              style={{ padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", color: "#DC2626", cursor: "pointer" }}>
              ✕ Clear
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
            {hasFilters ? `${filtered.length} of ${logs.length} alerts` : `${logs.length} alerts`}
          </span>
        </div>
      )}

      {error
        ? <div style={{ ...styles.card, textAlign: "center" as const, color: "var(--muted)" }}>Could not load alert history.</div>
        : logs.length === 0
          ? <div style={{ ...styles.card, textAlign: "center" as const, padding: "40px 24px" }}><div style={{ fontSize: 32, marginBottom: 12 }}>📭</div><p style={{ color: "var(--muted)", margin: 0 }}>No alerts yet.</p></div>
          : filtered.length === 0
            ? <div style={{ ...styles.card, textAlign: "center" as const, padding: "40px 24px" }}><div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div><p style={{ color: "var(--muted)", margin: 0 }}>No alerts match your filters.</p></div>
            : <div style={styles.card}>
                <div style={styles.tableHeader}><div>Aircraft</div><div>Message</div><div>Type</div><div>Channel</div><div>Status</div><div>Time</div></div>
                {filtered.map((log, i) => (
                  <div key={log.id} style={{ ...styles.tableRow, borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(15,23,42,0.02)" }}>
                    <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{log.aircraft_tail}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{log.message}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{formatAlertType(log.alert_type)}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: CHANNEL_COLORS[log.integration_type] ?? "var(--muted)", display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: CHANNEL_COLORS[log.integration_type] ?? "var(--muted)", textTransform: "capitalize" as const }}>{log.integration_type}</span>
                    </div>
                    <div><span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: log.status === "sent" ? "rgba(35,199,107,0.15)" : "rgba(239,68,68,0.15)", color: log.status === "sent" ? "#15803D" : "#DC2626", border: `1px solid ${log.status === "sent" ? "rgba(35,199,107,0.3)" : "rgba(239,68,68,0.3)"}` }}>{log.status === "sent" ? "Sent" : "Failed"}</span></div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}><LocalDate iso={log.sent_at} /></div>
                  </div>
                ))}
              </div>
      }
    </div>
  );
}

function BillingTab({ onManageBilling, portalLoading, portalError, licenses, onRefresh, upgraded }: {
  onManageBilling: () => void; portalLoading: boolean; portalError: string;
  licenses: License[]; onRefresh: () => void; upgraded: boolean;
}) {
  const [selectedLicenseKey, setSelectedLicenseKey] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const upgradeableLicenses = licenses.filter(l =>
    l.status === "active" && !l.tier.startsWith("team-") && TIER_ORDER.indexOf(l.tier) < TIER_ORDER.length - 1
  );

  const activeLicense = upgradeableLicenses.find(l => l.licenseKey === selectedLicenseKey) ?? upgradeableLicenses[0] ?? null;
  const upgradableTiers = activeLicense ? TIER_ORDER.slice(TIER_ORDER.indexOf(activeLicense.tier) + 1) : [];

  const resetUpgrade = () => { setSelectedTier(null); setUpgradeMsg(null); };

  const handleUpgrade = async () => {
    if (!activeLicense || !selectedTier) return;
    setUpgrading(true);
    setUpgradeMsg(null);
    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: activeLicense.licenseKey, newTier: selectedTier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpgradeMsg({ text: data.error || "Upgrade failed.", type: "error" });
      } else if (data.url) {
        window.location.href = data.url;
        return;
      } else {
        setUpgradeMsg({ text: "Something went wrong. Please try again.", type: "error" });
      }
    } catch {
      setUpgradeMsg({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div>
      <div style={styles.tabHeader}><h2 style={styles.tabTitle}>Billing & Subscription</h2><p style={styles.tabSub}>Manage your payment methods, invoices, and plan</p></div>

      {upgraded && (
        <div style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: "rgba(35,199,107,0.1)", color: "#15803D", border: "1px solid rgba(35,199,107,0.3)" }}>
          ✓ Your plan has been upgraded successfully. Your new limits are active immediately.
        </div>
      )}

      <div style={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 16 }}>
          <div><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Stripe Billing Portal</div><div style={{ fontSize: 13, color: "var(--muted)" }}>Update payment methods, download invoices, or cancel your subscription.</div></div>
          <button onClick={onManageBilling} disabled={portalLoading} style={{ ...styles.primaryBtn, opacity: portalLoading ? 0.6 : 1, cursor: portalLoading ? "not-allowed" : "pointer" }} onMouseEnter={e => { if (!portalLoading) e.currentTarget.style.background = "#EA6A0F"; }} onMouseLeave={e => { e.currentTarget.style.background = "#F97316"; }}>{portalLoading ? "Opening..." : "Manage Subscription →"}</button>
        </div>
        {portalError && <p style={{ fontSize: 13, color: "#DC2626", margin: "12px 0 0" }}>{portalError}</p>}
      </div>

      {upgradeableLicenses.length > 0 && (
        <div style={{ ...styles.card, marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Upgrade Your Plan</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
            You&apos;ll be charged the price difference between plans today using your card on file. Your subscription renews at the new plan price on your next billing date.
          </div>

          {upgradeableLicenses.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <div style={styles.metaLabel}>Select license to upgrade</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6, marginTop: 6 }}>
                {upgradeableLicenses.map(l => (
                  <button key={l.licenseKey} onClick={() => { setSelectedLicenseKey(l.licenseKey); resetUpgrade(); }}
                    style={{ padding: "10px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left" as const,
                      background: (selectedLicenseKey ?? upgradeableLicenses[0].licenseKey) === l.licenseKey ? "rgba(14,165,233,0.1)" : "var(--panel)",
                      border: (selectedLicenseKey ?? upgradeableLicenses[0].licenseKey) === l.licenseKey ? "1px solid rgba(14,165,233,0.4)" : "1px solid var(--border)",
                      color: "var(--text)", fontSize: 13, fontWeight: 600 }}>
                    {tierLabels[l.tier]} — {l.licenseKey}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeLicense && (
            <>
              <div style={styles.metaLabel}>Current plan: <strong style={{ color: "var(--text)" }}>{tierLabels[activeLicense.tier]}</strong></div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginTop: 10, marginBottom: 14 }}>
                {upgradableTiers.map(tier => {
                  const monthlyDiff = (MONTHLY_PRICES[tier] - MONTHLY_PRICES[activeLicense.tier]).toFixed(2);
                  const yearlyDiff = (YEARLY_PRICES[tier] - YEARLY_PRICES[activeLicense.tier]).toFixed(2);
                  const selected = selectedTier === tier;
                  return (
                    <button key={tier} onClick={() => setSelectedTier(tier)} style={{
                      padding: "14px 16px", borderRadius: 8, cursor: "pointer", textAlign: "left" as const,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: selected ? "rgba(14,165,233,0.1)" : "var(--panel)",
                      border: selected ? "1px solid rgba(14,165,233,0.4)" : "1px solid var(--border)",
                      color: "var(--text)",
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{tierLabels[tier]}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                          Monthly: +${monthlyDiff} today &nbsp;·&nbsp; Yearly: +${yearlyDiff} today
                        </div>
                      </div>
                      {selected && <span style={{ color: "#0ea5e9", fontSize: 18, fontWeight: 700 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <StatusMsg msg={upgradeMsg} />
              <button onClick={handleUpgrade} disabled={!selectedTier || upgrading}
                style={{ ...styles.primaryBtn, marginTop: 4, opacity: !selectedTier || upgrading ? 0.6 : 1, cursor: !selectedTier || upgrading ? "not-allowed" : "pointer" }}
                onMouseEnter={e => { if (selectedTier && !upgrading) e.currentTarget.style.background = "#EA6A0F"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#F97316"; }}>
                {upgrading ? "Processing..." : "Confirm Upgrade →"}
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ ...styles.card, marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Need a new plan?</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>View all available plans and pricing options.</div>
        <Link href="/pricing" style={styles.outlineBtn}>View Pricing →</Link>
      </div>
    </div>
  );
}

type PwStep = "form" | "choose-method" | "enter-code" | "totp-code" | "done";
type SetupStep = "idle" | "enter-phone" | "enter-code" | "totp-scan" | "totp-verify";

function TwoFAMethodRow({ label, enabled, onDisable }: { label: string; enabled: boolean; onDisable: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: enabled ? "#15803D" : "#374151", boxShadow: enabled ? "0 0 6px #15803D" : "none" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
      {enabled ? (
        <button onClick={onDisable} style={styles.smallDangerBtn} onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>Disable</button>
      ) : <span style={{ fontSize: 12, color: "var(--muted)" }}>Not enabled</span>}
    </div>
  );
}

function SecurityTab({ email }: { email: string }) {
  const [twoFA, setTwoFA] = useState<TwoFAStatus | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(true);
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [setupMethod, setSetupMethod] = useState<"email" | "sms" | "totp" | null>(null);
  const [setupPhone, setSetupPhone] = useState(""); const [setupCode, setSetupCode] = useState("");
  const [setupMsg, setSetupMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [totpUri, setTotpUri] = useState(""); const [totpSecret, setTotpSecret] = useState(""); const [totpQr, setTotpQr] = useState("");
  const [pwStep, setPwStep] = useState<PwStep>("form");
  const [newPassword, setNewPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMethod, setPwMethod] = useState<"email" | "sms" | "totp" | null>(null);
  const [pwCode, setPwCode] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const load2FA = useCallback(async () => {
    setTwoFALoading(true);
    try { const r = await fetch("/api/auth/2fa/status"); if (r.ok) setTwoFA(await r.json()); } finally { setTwoFALoading(false); }
  }, []);
  useEffect(() => { load2FA(); }, [load2FA]);

  const activeMethods = twoFA ? [
    ...(twoFA.email ? [{ id: "email" as const, label: "Email" }] : []),
    ...(twoFA.sms ? [{ id: "sms" as const, label: `SMS (${twoFA.phone ?? ""})` }] : []),
    ...(twoFA.totp ? [{ id: "totp" as const, label: "Authenticator App" }] : []),
  ] : [];

  const startSetup = async (method: "email" | "sms" | "totp") => {
    setSetupMethod(method); setSetupMsg(null); setSetupCode("");
    if (method === "sms") { setSetupStep("enter-phone"); return; }
    setSetupLoading(true);
    try {
      const r = await fetch("/api/auth/2fa/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }) });
      const d = await r.json();
      if (!r.ok) { setSetupMsg({ text: d.error, type: "error" }); return; }
      if (method === "totp") { setTotpUri(d.otpauthUrl); setTotpSecret(d.secret); setTotpQr(d.qrDataUrl || ""); setSetupStep("totp-scan"); }
      else setSetupStep("enter-code");
    } catch { setSetupMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setSetupLoading(false); }
  };

  const submitPhone = async () => {
    if (!setupPhone.trim()) { setSetupMsg({ text: "Enter a phone number.", type: "error" }); return; }
    setSetupLoading(true); setSetupMsg(null);
    try {
      const r = await fetch("/api/auth/2fa/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method: "sms", phone: setupPhone.trim() }) });
      const d = await r.json();
      if (!r.ok) { setSetupMsg({ text: d.error, type: "error" }); return; }
      setSetupStep("enter-code");
    } catch { setSetupMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setSetupLoading(false); }
  };

  const verifySetup = async () => {
    if (setupCode.length < 6) { setSetupMsg({ text: "Enter the 6-digit code.", type: "error" }); return; }
    setSetupLoading(true); setSetupMsg(null);
    try {
      const r = await fetch("/api/auth/2fa/verify-setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: setupCode }) });
      const d = await r.json();
      if (!r.ok) { setSetupMsg({ text: d.error, type: "error" }); return; }
      setSetupMsg({ text: `${setupMethod === "totp" ? "Authenticator" : setupMethod} 2FA enabled!`, type: "success" });
      setSetupStep("idle"); setSetupMethod(null); await load2FA();
    } catch { setSetupMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setSetupLoading(false); }
  };

  const disable2FA = async (method: "email" | "sms" | "totp") => {
    if (!confirm(`Disable ${method === "totp" ? "authenticator" : method} 2FA?`)) return;
    const r = await fetch("/api/auth/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }) });
    if (!r.ok) { alert("Could not disable 2FA. Please try again."); return; }
    await load2FA();
  };

  const resendCode = async (context: "setup" | "password-change") => {
    const method = context === "setup" ? setupMethod : pwMethod;
    await fetch("/api/auth/2fa/send-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method, context }) });
    context === "setup" ? setSetupMsg({ text: "New code sent.", type: "success" }) : setPwMsg({ text: "New code sent.", type: "success" });
  };

  const initiatePasswordChange = async () => {
    setPwMsg(null);
    if (!newPassword || !confirmPassword) { setPwMsg({ text: "Fill in all fields.", type: "error" }); return; }
    if (newPassword !== confirmPassword) { setPwMsg({ text: "Passwords do not match.", type: "error" }); return; }
    if (newPassword.length < 8) { setPwMsg({ text: "Password must be at least 8 characters.", type: "error" }); return; }
    if (!twoFA || activeMethods.length === 0) { await sendPwCode("email"); return; }
    if (activeMethods.length === 1) { await sendPwCode(activeMethods[0].id); }
    else setPwStep("choose-method");
  };

  const sendPwCode = async (method: "email" | "sms" | "totp") => {
    setPwMethod(method); setPwLoading(true); setPwMsg(null);
    try {
      const r = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newPassword, confirmPassword, method }) });
      const d = await r.json();
      if (!r.ok) { setPwMsg({ text: d.error, type: "error" }); return; }
      setPwStep(method === "totp" ? "totp-code" : "enter-code");
    } catch { setPwMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setPwLoading(false); }
  };

  const confirmPasswordChange = async () => {
    if (pwCode.length < 6) { setPwMsg({ text: "Enter the 6-digit code.", type: "error" }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      const r = await fetch("/api/auth/confirm-password-change", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: pwCode }) });
      const d = await r.json();
      if (!r.ok) { setPwMsg({ text: d.error, type: "error" }); return; }
      setPwStep("done");
    } catch { setPwMsg({ text: "Something went wrong.", type: "error" }); }
    finally { setPwLoading(false); }
  };

  const resetPw = () => { setPwStep("form"); setPwMethod(null); setPwCode(""); setPwMsg(null); setNewPassword(""); setConfirmPassword(""); };

  return (
    <div>
      <div style={styles.tabHeader}><h2 style={styles.tabTitle}>Security</h2><p style={styles.tabSub}>Manage your password and two-factor authentication</p></div>

      <div style={styles.sectionLabel}>Two-Factor Authentication</div>
      <div style={styles.card}>
        {twoFALoading ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading...</div> : <>
          <div style={{ marginBottom: 16 }}>
            <TwoFAMethodRow label="Email" enabled={twoFA?.email ?? false} onDisable={() => disable2FA("email")} />
            <TwoFAMethodRow label={`SMS${twoFA?.phone ? ` (${twoFA.phone})` : ""}`} enabled={twoFA?.sms ?? false} onDisable={() => disable2FA("sms")} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: twoFA?.totp ? "#15803D" : "#374151", boxShadow: twoFA?.totp ? "0 0 6px #15803D" : "none" }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Authenticator App (Google / Microsoft)</span>
              </div>
              {twoFA?.totp ? <button onClick={() => disable2FA("totp")} style={styles.smallDangerBtn} onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}>Disable</button>
                : <span style={{ fontSize: 12, color: "var(--muted)" }}>Not enabled</span>}
            </div>
          </div>

          {setupStep === "idle" && (
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Add a new 2FA method:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {!twoFA?.email && <button onClick={() => startSetup("email")} style={styles.smallBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.color = "#0ea5e9"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>+ Email</button>}
                {!twoFA?.sms && <button onClick={() => { setSetupMethod("sms"); setSetupStep("enter-phone"); }} style={styles.smallBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.color = "#0ea5e9"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>+ SMS</button>}
                {!twoFA?.totp && <button onClick={() => startSetup("totp")} style={styles.smallBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.color = "#0ea5e9"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}>+ Authenticator</button>}
              </div>
              <StatusMsg msg={setupMsg} />
            </div>
          )}
          {setupStep === "enter-phone" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Enter your phone number</div>
              <input type="tel" value={setupPhone} onChange={e => setSetupPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={{ ...styles.input, marginBottom: 8 }} onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={submitPhone} disabled={setupLoading} style={{ ...styles.primaryBtn, opacity: setupLoading ? 0.6 : 1 }}>{setupLoading ? "Sending..." : "Send Code"}</button>
                <button onClick={() => setSetupStep("idle")} style={styles.ghostBtn}>Cancel</button>
              </div>
              <StatusMsg msg={setupMsg} />
            </div>
          )}
          {setupStep === "enter-code" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Enter verification code</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{setupMethod === "email" ? `Code sent to ${email}` : `Code sent to ${setupPhone}`}</div>
              <CodeInput value={setupCode} onChange={setSetupCode} onSubmit={verifySetup} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={verifySetup} disabled={setupLoading} style={{ ...styles.primaryBtn, opacity: setupLoading ? 0.6 : 1 }}>{setupLoading ? "Verifying..." : "Verify & Enable"}</button>
                <button onClick={() => resendCode("setup")} style={styles.ghostBtn}>Resend</button>
                <button onClick={() => setSetupStep("idle")} style={styles.ghostBtn}>Cancel</button>
              </div>
              <StatusMsg msg={setupMsg} />
            </div>
          )}
          {setupStep === "totp-scan" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Scan with your authenticator app</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Open Google Authenticator or Microsoft Authenticator and scan this QR code, or enter the key manually.</div>
              {totpQr && <img src={totpQr} alt="TOTP QR Code" style={{ borderRadius: 8, marginBottom: 12, display: "block", background: "#fff", padding: 8 }} />}
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Manual entry key:</div>
              <div style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: "0.15em", background: "#F1F5F9", padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)", display: "inline-block", marginBottom: 16 }}>{totpSecret.match(/.{1,4}/g)?.join(" ")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setSetupStep("totp-verify")} style={styles.primaryBtn}>Next — Enter Code</button>
                <button onClick={() => setSetupStep("idle")} style={styles.ghostBtn}>Cancel</button>
              </div>
            </div>
          )}
          {setupStep === "totp-verify" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Enter the code from your app</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Enter the 6-digit code shown in your authenticator app.</div>
              <CodeInput value={setupCode} onChange={setSetupCode} onSubmit={verifySetup} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={verifySetup} disabled={setupLoading} style={{ ...styles.primaryBtn, opacity: setupLoading ? 0.6 : 1 }}>{setupLoading ? "Verifying..." : "Verify & Enable"}</button>
                <button onClick={() => setSetupStep("totp-scan")} style={styles.ghostBtn}>Back</button>
              </div>
              <StatusMsg msg={setupMsg} />
            </div>
          )}
        </>}
      </div>

      <div style={{ ...styles.sectionLabel, marginTop: 28 }}>Change Password</div>
      <div style={styles.card}>
        {pwStep === "form" && (
          <div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>A verification code will be sent to confirm the change. {twoFA && activeMethods.length > 0 ? "You can choose your preferred 2FA method." : "A code will be sent to your account email."}</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              <div><label style={styles.inputLabel}>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" style={styles.input} onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} /></div>
              <div><label style={styles.inputLabel}>Confirm New Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" style={styles.input} onFocus={e => { e.currentTarget.style.borderColor = "#0ea5e9"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }} /></div>
            </div>
            <StatusMsg msg={pwMsg} />
            <button onClick={initiatePasswordChange} disabled={pwLoading} style={{ ...styles.primaryBtn, marginTop: 16, opacity: pwLoading ? 0.6 : 1 }} onMouseEnter={e => { if (!pwLoading) e.currentTarget.style.background = "#EA6A0F"; }} onMouseLeave={e => { e.currentTarget.style.background = "#F97316"; }}>{pwLoading ? "Please wait..." : "Continue →"}</button>
          </div>
        )}
        {pwStep === "choose-method" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Choose verification method</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Select how you'd like to verify this password change:</div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {activeMethods.map(m => (
                <button key={m.id} onClick={() => sendPwCode(m.id)} style={styles.methodBtn} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.background = "rgba(14,165,233,0.08)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--panel)"; }}>
                  {m.id === "email" ? "✉️" : m.id === "sms" ? "📲" : "🔐"} {m.label}
                </button>
              ))}
            </div>
            <button onClick={resetPw} style={{ ...styles.ghostBtn, marginTop: 12 }}>Cancel</button>
            <StatusMsg msg={pwMsg} />
          </div>
        )}
        {(pwStep === "enter-code" || pwStep === "totp-code") && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{pwStep === "totp-code" ? "Enter code from your authenticator app" : "Enter verification code"}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{pwStep === "totp-code" ? "Open your authenticator app and enter the 6-digit code." : pwMethod === "email" ? `Code sent to ${email}` : "Code sent to your phone"}</div>
            <CodeInput value={pwCode} onChange={setPwCode} onSubmit={confirmPasswordChange} />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={confirmPasswordChange} disabled={pwLoading} style={{ ...styles.primaryBtn, opacity: pwLoading ? 0.6 : 1 }}>{pwLoading ? "Verifying..." : "Confirm Password Change"}</button>
              {pwStep !== "totp-code" && <button onClick={() => resendCode("password-change")} style={styles.ghostBtn}>Resend</button>}
              <button onClick={resetPw} style={styles.ghostBtn}>Cancel</button>
            </div>
            <StatusMsg msg={pwMsg} />
          </div>
        )}
        {pwStep === "done" && (
          <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Password changed successfully</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Your new password is now active.</div>
            <button onClick={resetPw} style={styles.primaryBtn}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh" } as React.CSSProperties,
  sidebar: { width: 220, minWidth: 220, borderRight: "1px solid var(--border)", padding: "32px 20px 32px 0", display: "flex", flexDirection: "column" as const, gap: 4 } as React.CSSProperties,
  sidebarLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", padding: "0 14px 8px" } as React.CSSProperties,
  navItem: (active: boolean) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "var(--accent-hover)" : "var(--muted)", background: active ? "rgba(14,165,233,0.1)" : "transparent", cursor: "pointer", transition: "all 0.15s", border: "none", width: "100%", textAlign: "left" as const }),
  main: { flex: 1, padding: "32px 0 64px 40px", maxWidth: 900 } as React.CSSProperties,
  tabHeader: { marginBottom: 24 } as React.CSSProperties,
  tabTitle: { fontSize: 22, fontWeight: 700, margin: "0 0 4px" } as React.CSSProperties,
  tabSub: { fontSize: 14, color: "var(--muted)", margin: 0 } as React.CSSProperties,
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--muted)", marginBottom: 8 } as React.CSSProperties,
  card: { background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" } as React.CSSProperties,
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)" } as React.CSSProperties,
  infoRowLast: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" } as React.CSSProperties,
  infoLabel: { fontSize: 13, color: "var(--muted)" } as React.CSSProperties,
  infoValue: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,
  tierBadge: { fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "var(--muted)", textTransform: "uppercase" as const },
  licenseKey: { fontFamily: "monospace", fontSize: 14, fontWeight: 700, background: "#F1F5F9", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", letterSpacing: "0.05em", display: "inline-block" } as React.CSSProperties,
  metaLabel: { fontSize: 12, color: "var(--muted)", marginBottom: 4 } as React.CSSProperties,
  metaValue: { fontSize: 14 } as React.CSSProperties,
  statCard: { background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" } as React.CSSProperties,
  statLabel: { fontSize: 12, color: "var(--muted)", marginBottom: 4 } as React.CSSProperties,
  statValue: { fontSize: 28, fontWeight: 800 } as React.CSSProperties,
  tableHeader: { display: "grid", gridTemplateColumns: "90px 1fr 120px 100px 80px 160px", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" } as React.CSSProperties,
  tableRow: { display: "grid", gridTemplateColumns: "90px 1fr 120px 100px 80px 160px", gap: 12, padding: "13px 20px", fontSize: 13, alignItems: "center" } as React.CSSProperties,
  primaryBtn: { padding: "9px 18px", borderRadius: 8, background: "#F97316", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", transition: "background 0.15s", display: "inline-block", boxShadow: "0 3px 12px rgba(249,115,22,0.25)" } as React.CSSProperties,
  outlineBtn: { padding: "9px 18px", borderRadius: 8, background: "transparent", color: "var(--text)", fontSize: 13, fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer", textDecoration: "none", display: "inline-block" } as React.CSSProperties,
  ghostBtn: { padding: "9px 14px", borderRadius: 8, background: "transparent", color: "var(--muted)", fontSize: 13, fontWeight: 500, border: "1px solid var(--border)", cursor: "pointer" } as React.CSSProperties,
  dangerBtn: { padding: "9px 18px", borderRadius: 8, background: "var(--bad-bg)", color: "var(--bad)", fontSize: 13, fontWeight: 600, border: "1px solid var(--bad-border)", cursor: "pointer", transition: "background 0.15s" } as React.CSSProperties,
  smallDangerBtn: { padding: "5px 12px", borderRadius: 6, background: "var(--bad-bg)", color: "var(--bad)", fontSize: 12, fontWeight: 600, border: "1px solid var(--bad-border)", cursor: "pointer", transition: "background 0.15s" } as React.CSSProperties,
  smallBtn: { padding: "6px 14px", borderRadius: 6, background: "transparent", color: "var(--muted)", fontSize: 12, fontWeight: 600, border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s" } as React.CSSProperties,
  methodBtn: { padding: "12px 16px", borderRadius: 8, background: "var(--panel)", color: "var(--text)", fontSize: 13, fontWeight: 600, textAlign: "left" as const, border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s", width: "100%" } as React.CSSProperties,
  exportBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const } as React.CSSProperties,
  inputLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 } as React.CSSProperties,
  input: { width: "100%", padding: "10px 14px", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, color: "var(--input-color)", fontSize: 13, outline: "none", transition: "border-color 0.15s", boxSizing: "border-box" as const } as React.CSSProperties,
  loadingText: { color: "var(--muted)", fontSize: 14, padding: "40px 0" } as React.CSSProperties,
};

const NAV_ITEMS = [
  { id: "account", label: "Account" },
  { id: "licenses", label: "Licenses" },
  { id: "alerts", label: "Alert History" },
  { id: "billing", label: "Billing" },
  { id: "security", label: "Security" },
];

const TAB_ICONS: Record<string, React.ReactNode> = {
  account: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  licenses: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  alerts: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  billing: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  security: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "account";
  const setActiveTab = (tab: string) => router.push(`/dashboard?tab=${tab}`, { scroll: false });
  const [licenses, setLicenses] = useState<License[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");
  const [show2FABanner, setShow2FABanner] = useState(false);

  useEffect(() => { if (status === "unauthenticated") window.location.href = "/login"; }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const dismissed = sessionStorage.getItem("2fa-banner-dismissed");
    if (dismissed) return;
    fetch("/api/auth/2fa/status").then(r => r.json()).then(d => {
      if (!d.email && !d.sms && !d.totp) setShow2FABanner(true);
    }).catch(() => {});
  }, [status]);

  const refreshLicenses = useCallback(() => {
    if (!session?.user?.email) return;
    setLicensesLoading(true);
    fetch("/api/licenses").then(r => r.json()).then(d => setLicenses(d)).catch(() => {}).finally(() => setLicensesLoading(false));
  }, [session]);

  useEffect(() => { refreshLicenses(); }, [refreshLicenses]);

  const handleManageBilling = async () => {
    setPortalLoading(true); setPortalError("");
    try {
      const res = await fetch("/api/portal", { method: "POST" }); const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setPortalError("No billing account found. Please purchase a license first.");
    } catch { setPortalError("Failed to open billing portal. Please try again."); }
    finally { setPortalLoading(false); }
  };

  if (status === "loading") return <div style={{ padding: 40, color: "var(--muted)", fontSize: 14 }}>Loading...</div>;
  const email = session?.user?.email ?? "";

  return (
    <div style={styles.shell}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarLabel}>Dashboard</div>
        {NAV_ITEMS.map(item => (
          <button key={item.id} style={styles.navItem(activeTab === item.id)} onClick={() => setActiveTab(item.id)}
            onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "rgba(15,23,42,0.04)"; } }}
            onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; } }}>
            <span style={{ display: "inline-flex", alignItems: "center" }}>{TAB_ICONS[item.id]}</span>{item.label}
          </button>
        ))}
      </div>
      <div style={styles.main}>
        {show2FABanner && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", marginBottom: 24, borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style={{ color: "var(--text)" }}>Secure your account with two-factor authentication.</span>
              <button onClick={() => setActiveTab("security")} style={{ padding: "4px 12px", borderRadius: 6, background: "rgba(245,158,11,0.15)", color: "#B45309", border: "1px solid rgba(245,158,11,0.35)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Enable 2FA →
              </button>
            </div>
            <button onClick={() => { setShow2FABanner(false); sessionStorage.setItem("2fa-banner-dismissed", "1"); }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }}>✕</button>
          </div>
        )}
        {activeTab === "account" && <AccountTab email={email} session={session} />}
        {activeTab === "licenses" && <LicensesTab licenses={licenses} loading={licensesLoading} />}
        {activeTab === "alerts" && <AlertsTab email={email} />}
        {activeTab === "billing" && <BillingTab onManageBilling={handleManageBilling} portalLoading={portalLoading} portalError={portalError} licenses={licenses} onRefresh={refreshLicenses} upgraded={searchParams.get("upgraded") === "1"} />}
        {activeTab === "security" && <SecurityTab email={email} />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--muted)", fontSize: 14 }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
