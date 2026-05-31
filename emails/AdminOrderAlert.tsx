import { Text, Hr } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

export type LineItem = { description: string; amount: string; quantity: number };

export function AdminOrderAlert({
  customerName = "",
  customerEmail = "",
  shippingAddress = "",
  items = [] as LineItem[],
  totalFormatted = "",
  stripeSession = "",
}: {
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: string;
  items?: LineItem[];
  totalFormatted?: string;
  stripeSession?: string;
}) {
  return (
    <EmailLayout preview={`New order from ${customerName || customerEmail}`}>

      <Text style={styles.h1}>New hardware order</Text>

      <div style={styles.card}>
        <span style={styles.label}>Customer</span>
        <Text style={{ fontSize: 14, color: "#fafafa", margin: "0 0 2px", fontWeight: 600 }}>{customerName || "—"}</Text>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: "0 0 12px" }}>{customerEmail}</Text>
        <span style={styles.label}>Ship to</span>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>{shippingAddress}</Text>
      </div>

      <div style={styles.card}>
        <span style={styles.label}>Order summary</span>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i < items.length - 1 ? 8 : 0 }}>
            <Text style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>
              {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.description}
            </Text>
            <Text style={{ fontSize: 13, color: "#fafafa", margin: 0, fontWeight: 600 }}>{item.amount}</Text>
          </div>
        ))}
        <Hr style={{ ...styles.divider, margin: "12px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, color: "#fafafa", margin: 0, fontWeight: 700 }}>Total</Text>
          <Text style={{ fontSize: 14, margin: 0, fontWeight: 900, color: "#f5b400" }}>{totalFormatted}</Text>
        </div>
      </div>

      <Hr style={styles.divider} />
      <Text style={styles.muted}>
        Stripe session: <span style={{ fontFamily: "monospace", color: "#71717a" }}>{stripeSession}</span>
      </Text>

    </EmailLayout>
  );
}

export default AdminOrderAlert;
