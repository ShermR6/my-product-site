import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

export function SubscriptionRenewed({
  tierLabel = "Starter",
  expiryFormatted = "",
}: {
  tierLabel?: string;
  expiryFormatted?: string;
}) {
  return (
    <EmailLayout preview={`Your FinalPing ${tierLabel} subscription has been renewed.`}>

      <Text style={styles.h1}>Subscription renewed ✓</Text>
      <Text style={styles.p}>
        Your <strong style={{ color: "#fafafa" }}>{tierLabel}</strong> subscription has been renewed successfully.
        No action needed — FinalPing will continue tracking your aircraft automatically.
      </Text>

      <div style={styles.card}>
        <span style={styles.label}>Access extended through</span>
        <Text style={{ fontSize: 18, fontWeight: 800, color: "#f5b400", margin: 0 }}>{expiryFormatted}</Text>
      </div>

      <a href="https://finalpingapp.com/dashboard" style={{ ...styles.btn, display: "inline-block" }}>
        View Dashboard →
      </a>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        To cancel your subscription, visit your{" "}
        <a href="https://finalpingapp.com/dashboard?tab=billing" style={{ color: "#71717a" }}>billing settings</a>.
      </Text>

    </EmailLayout>
  );
}

export default SubscriptionRenewed;
