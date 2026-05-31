import { Text, Hr, Row, Column } from "@react-email/components";
import * as React from "react";
import { EmailLayout, styles } from "./layout";

type LineItem = { description: string; amount: string; quantity: number };

export function OrderConfirmation({
  firstName = "there",
  shippingName = "",
  shippingAddress = "",
  items = [] as LineItem[],
  totalFormatted = "$0.00",
}: {
  firstName?: string;
  shippingName?: string;
  shippingAddress?: string;
  items?: LineItem[];
  totalFormatted?: string;
}) {
  return (
    <EmailLayout preview={`Order confirmed — we'll have it shipped soon, ${firstName}.`}>

      <Text style={styles.h1}>Order confirmed ✓</Text>
      <Text style={styles.p}>
        Thanks for your order, {firstName}! We&apos;re getting it packed and will have it on its way shortly.
      </Text>

      {/* Order summary */}
      <div style={styles.card}>
        <span style={styles.label}>Order Summary</span>
        {items.map((item, i) => (
          <Row key={i} style={{ marginBottom: i < items.length - 1 ? 8 : 0 }}>
            <Column>
              <Text style={{ fontSize: 13, color: "#d4d4d8", margin: 0 }}>
                {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.description}
              </Text>
            </Column>
            <Column align="right">
              <Text style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>{item.amount}</Text>
            </Column>
          </Row>
        ))}
        <Hr style={{ borderColor: "#27272a", margin: "12px 0 10px" }} />
        <Row>
          <Column>
            <Text style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", margin: 0 }}>Total paid</Text>
          </Column>
          <Column align="right">
            <Text style={{ fontSize: 14, fontWeight: 800, color: "#f5b400", margin: 0 }}>{totalFormatted}</Text>
          </Column>
        </Row>
      </div>

      {/* Shipping address */}
      <div style={styles.card}>
        <span style={styles.label}>Ships to</span>
        <Text style={{ fontSize: 13, color: "#d4d4d8", margin: "0 0 2px" }}>{shippingName}</Text>
        <Text style={{ fontSize: 13, color: "#a1a1aa", margin: 0 }}>{shippingAddress}</Text>
      </div>

      <Text style={{ ...styles.p, margin: "16px 0 24px" }}>
        We&apos;ll send you a tracking number as soon as your order ships — usually within 1–3 business days.
      </Text>

      <a href="https://finalpingapp.com/groundstationsetup" style={styles.btn}>
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

export default OrderConfirmation;
