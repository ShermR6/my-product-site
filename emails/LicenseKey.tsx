import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

// Sent when a plan or trial starts. FinalPing runs in the browser now, so
// there is no key to type anywhere: the key is shown only as a reference.
export function LicenseKey({
  email = "",
  licenseKey = "",
  tierLabel = "Personal",
}: {
  email?: string;
  licenseKey?: string;
  tierLabel?: string;
}) {
  return (
    <EmailLayout preview={`Your FinalPing ${tierLabel} plan is active. Sign in to start tracking.`}>

      <Text style={styles.h1}>Your {tierLabel} plan is active</Text>
      <Text style={styles.p}>
        Thanks for your purchase! FinalPing runs in your browser, so there is nothing to install and no key to enter.
      </Text>

      <div style={{ ...styles.card, marginTop: 0 }}>
        <span style={styles.label}>How to start</span>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 6px" }}>
          1. Open finalpingapp.com/app
        </Text>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 6px" }}>
          2. Sign in with <strong style={{ color: "#d4d4d8" }}>{email}</strong>
        </Text>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>
          3. Pick your airport, add your aircraft and connect where alerts should go
        </Text>
      </div>

      <a href="https://finalpingapp.com/app" style={{ ...styles.btn, marginTop: 8, display: "inline-block" }}>
        Open FinalPing →
      </a>

      <div style={{ ...styles.card, textAlign: "center" as const, padding: "18px 18px" }}>
        <span style={styles.label}>Your reference</span>
        <Text style={{ ...styles.mono, margin: "4px 0 0", display: "block" }}>{licenseKey}</Text>
      </div>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        Manage billing or cancel any time at{" "}
        <a href="https://finalpingapp.com/dashboard" style={{ color: "#71717a" }}>finalpingapp.com/dashboard</a>
        <br />
        Check your spam folder and add noreply@finalpingapp.com to your contacts for future emails.
      </Text>

    </EmailLayout>
  );
}

export default LicenseKey;
