import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

export function SubscriptionCancelled({
  tierLabel = "Starter",
  expiredFormatted = "",
}: {
  tierLabel?: string;
  expiredFormatted?: string;
}) {
  return (
    <EmailLayout preview="Your FinalPing subscription has ended. You can re-subscribe any time.">

      <Text style={styles.h1}>Subscription ended</Text>
      <Text style={styles.p}>
        Your <strong style={{ color: "#fafafa" }}>{tierLabel}</strong> subscription ended on{" "}
        <strong style={{ color: "#fafafa" }}>{expiredFormatted}</strong>.
        Aircraft tracking and alerts have been paused.
      </Text>

      <Text style={{ ...styles.p, marginTop: -8 }}>
        You can re-subscribe at any time to pick up right where you left off.
      </Text>

      <a href="https://finalpingapp.com/pricing" style={{ ...styles.btn, display: "inline-block" }}>
        Re-subscribe →
      </a>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        Thank you for being a FinalPing customer. We hope to see you again soon.
      </Text>

    </EmailLayout>
  );
}

export default SubscriptionCancelled;
