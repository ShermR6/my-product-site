import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

export function GroundStationEnabled() {
  return (
    <EmailLayout preview="Your FinalPing Ground Station is enabled — follow the setup guide to get started.">

      <Text style={styles.h1}>Ground Station activated ✓</Text>
      <Text style={styles.p}>
        Thanks for purchasing <strong style={{ color: "#fafafa" }}>FinalPing Ground Station</strong>.
        Your account is now enabled for local ADS-B tracking.
      </Text>

      <Text style={{ ...styles.p, marginTop: -8 }}>
        Follow the setup guide to connect your receiver and start getting 2–5 second landing alerts instead of the usual 30–60 second delay from cloud tracking.
      </Text>

      <a href="https://finalpingapp.com/groundstationsetup" style={{ ...styles.btn, display: "inline-block", marginBottom: 12 }}>
        View Setup Guide →
      </a>
      <br />
      <a href="https://finalpingapp.com/groundstationdevices" style={{ ...styles.btnOutline, display: "inline-block" }}>
        Buy a Receiver →
      </a>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        Questions? Reply to this email or visit your{" "}
        <a href="https://finalpingapp.com/dashboard" style={{ color: "#71717a" }}>dashboard</a>.
      </Text>

    </EmailLayout>
  );
}

export default GroundStationEnabled;
