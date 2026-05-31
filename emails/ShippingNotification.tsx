import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

export function ShippingNotification({
  firstName = "there",
  trackingNumber = "",
}: {
  firstName?: string;
  trackingNumber?: string;
}) {
  const trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;

  return (
    <EmailLayout preview={`Your FinalPing order has shipped — tracking: ${trackingNumber}`}>

      <Text style={styles.h1}>Your order is on its way 📦</Text>
      <Text style={styles.p}>
        Hey {firstName}, your ground station hardware has shipped via USPS. Here&apos;s your tracking info.
      </Text>

      {/* Tracking card */}
      <div style={{ ...styles.card, textAlign: "center" as const, padding: "24px 18px" }}>
        <span style={styles.label}>USPS Tracking Number</span>
        <Text style={{ ...styles.mono, margin: "4px 0 20px", display: "block" }}>{trackingNumber}</Text>
        <a href={trackingUrl} style={styles.btn}>Track Package →</a>
      </div>

      <Text style={{ ...styles.p, marginTop: 16 }}>
        While you wait, check out the setup guide so you&apos;re ready to plug in and go the moment it arrives.
      </Text>

      <a href="https://finalpingapp.com/groundstationsetup" style={styles.btnOutline}>
        View Setup Guide →
      </a>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        Questions? Reply to this email or visit{" "}
        <a href="https://finalpingapp.com/contact" style={{ color: "#71717a" }}>finalpingapp.com/contact</a>
      </Text>

    </EmailLayout>
  );
}

export default ShippingNotification;
