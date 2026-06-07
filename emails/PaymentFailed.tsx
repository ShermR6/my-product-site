import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

export function PaymentFailed({
  tierLabel = "Starter",
  attemptCount = 1,
}: {
  tierLabel?: string;
  attemptCount?: number;
}) {
  return (
    <EmailLayout preview={`Action required: your FinalPing payment failed.`}>

      <Text style={styles.h1}>Payment failed ⚠️</Text>
      <Text style={styles.p}>
        We weren&apos;t able to charge your card for your{" "}
        <strong style={{ color: "#fafafa" }}>{tierLabel}</strong> subscription
        {attemptCount > 1 ? ` (attempt ${attemptCount})` : ""}.
        Please update your payment method to keep your aircraft alerts running.
      </Text>

      <div style={{ ...styles.card, borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
        <span style={{ ...styles.label, color: "#f87171" }}>What happens next</span>
        <Text style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.7, margin: "8px 0 0" }}>
          Stripe will automatically retry your payment over the next several days.
          If all retries fail, your subscription will be cancelled and your license will expire.
          Updating your card now will prevent any interruption.
        </Text>
      </div>

      <a href="https://finalpingapp.com/dashboard?tab=billing" style={{ ...styles.btn, display: "inline-block", background: "#ef4444" }}>
        Update Payment Method →
      </a>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        Questions? Reply to this email or visit{" "}
        <a href="https://finalpingapp.com/contact" style={{ color: "#71717a" }}>finalpingapp.com/contact</a>.
      </Text>

    </EmailLayout>
  );
}

export default PaymentFailed;
