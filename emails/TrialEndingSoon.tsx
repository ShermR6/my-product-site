import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

export function TrialEndingSoon({
  trialEndFormatted = "",
}: {
  trialEndFormatted?: string;
}) {
  return (
    <EmailLayout preview={`Your FinalPing trial ends on ${trialEndFormatted} — no action needed to continue.`}>

      <Text style={styles.h1}>Your trial ends soon</Text>
      <Text style={styles.p}>
        Your free trial ends on <strong style={{ color: "#fafafa" }}>{trialEndFormatted}</strong>.
        After that, aircraft tracking and alerts will pause until you subscribe.
      </Text>

      <div style={styles.card}>
        <span style={styles.label}>What happens next</span>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 6px" }}>
          Your card on file will be charged automatically on {trialEndFormatted}.
        </Text>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>
          No action needed if you&apos;d like to continue — FinalPing will keep running.
        </Text>
      </div>

      <a href="https://finalpingapp.com/dashboard?tab=billing" style={{ ...styles.btn, display: "inline-block" }}>
        Manage Subscription →
      </a>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        Want to cancel before your trial ends? Visit your{" "}
        <a href="https://finalpingapp.com/dashboard?tab=billing" style={{ color: "#71717a" }}>billing settings</a>.
      </Text>

    </EmailLayout>
  );
}

export default TrialEndingSoon;
