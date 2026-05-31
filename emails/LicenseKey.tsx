import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

export function LicenseKey({
  email = "",
  licenseKey = "",
  tierLabel = "Starter",
}: {
  email?: string;
  licenseKey?: string;
  tierLabel?: string;
}) {
  return (
    <EmailLayout preview={`Your FinalPing ${tierLabel} license key is ready to activate.`}>

      <Text style={styles.h1}>Your {tierLabel} license key</Text>
      <Text style={styles.p}>
        Thanks for your purchase! Enter this key in the FinalPing desktop app to activate your account.
      </Text>

      <div style={{ ...styles.card, textAlign: "center" as const, padding: "24px 18px" }}>
        <span style={styles.label}>License Key</span>
        <Text style={{ ...styles.mono, margin: "4px 0 0", display: "block" }}>{licenseKey}</Text>
      </div>

      <div style={{ ...styles.card, marginTop: 0 }}>
        <span style={styles.label}>How to activate</span>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 6px" }}>
          1. Open the FinalPing desktop app
        </Text>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 6px" }}>
          2. Enter this key and your email: <strong style={{ color: "#d4d4d8" }}>{email}</strong>
        </Text>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>
          3. Your 30-day access period starts on activation, not purchase
        </Text>
      </div>

      <a href="https://finalpingapp.com/download" style={{ ...styles.btn, marginTop: 8, display: "inline-block" }}>
        Download the app →
      </a>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        View and manage your licenses at{" "}
        <a href="https://finalpingapp.com/dashboard" style={{ color: "#71717a" }}>finalpingapp.com/dashboard</a>
        <br />
        Check your spam folder and add noreply@finalpingapp.com to your contacts for future emails.
      </Text>

    </EmailLayout>
  );
}

export default LicenseKey;
