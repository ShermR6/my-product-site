import {
  Html, Head, Body, Container, Section, Text, Hr, Row, Column, Preview,
} from "@react-email/components";
import * as React from "react";

const colors = {
  bg: "#09090b",
  card: "#111113",
  border: "#27272a",
  text: "#fafafa",
  muted: "#71717a",
  accent: "#f5b400",
  accentDim: "#f5b40018",
};

export const font = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ background: colors.bg, margin: 0, padding: 0, fontFamily: font }}>
        <Container style={{ maxWidth: 580, margin: "0 auto", padding: "32px 16px" }}>

          {/* Logo */}
          <Section style={{ marginBottom: 28 }}>
            <Row>
              <Column>
                <Text style={{ margin: 0, lineHeight: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" as const, color: colors.muted, display: "block" }}>
                    Aircraft Alerts
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: colors.text, display: "block" }}>
                    FinalPing
                  </span>
                </Text>
                <div style={{ height: 2, width: 80, background: `linear-gradient(90deg, ${colors.accent}, transparent)`, borderRadius: 999, marginTop: 4 }} />
              </Column>
            </Row>
          </Section>

          {/* Card */}
          <Section style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            padding: "32px 32px",
            marginBottom: 20,
          }}>
            {children}
          </Section>

          {/* Footer */}
          <Section>
            <Hr style={{ borderColor: colors.border, margin: "0 0 16px" }} />
            <Text style={{ fontSize: 11, color: colors.muted, margin: 0, textAlign: "center" as const, lineHeight: 1.7 }}>
              FinalPing · Real-time aircraft alerts
              <br />
              <a href="https://finalpingapp.com" style={{ color: colors.muted, textDecoration: "underline" }}>finalpingapp.com</a>
              {" · "}
              <a href="https://finalpingapp.com/contact" style={{ color: colors.muted, textDecoration: "underline" }}>Contact</a>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  h1: { fontSize: 20, fontWeight: 800, color: "#fafafa", margin: "0 0 6px", letterSpacing: "-0.01em" } as React.CSSProperties,
  p: { fontSize: 14, color: "#a1a1aa", margin: "0 0 20px", lineHeight: 1.7 } as React.CSSProperties,
  label: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#52525b", marginBottom: 8, display: "block" } as React.CSSProperties,
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "16px 18px", marginBottom: 16 } as React.CSSProperties,
  mono: { fontFamily: "monospace", fontSize: 22, fontWeight: 900, letterSpacing: "0.08em", color: "#f5b400" } as React.CSSProperties,
  btn: {
    display: "inline-block", padding: "12px 28px", borderRadius: 999,
    background: "#f5b400", color: "#000", fontWeight: 700,
    fontSize: 14, textDecoration: "none",
  } as React.CSSProperties,
  btnOutline: {
    display: "inline-block", padding: "11px 26px", borderRadius: 999,
    border: "1px solid #f5b400", color: "#f5b400", fontWeight: 700,
    fontSize: 14, textDecoration: "none", background: "transparent",
  } as React.CSSProperties,
  divider: { borderColor: "#27272a", margin: "20px 0" } as React.CSSProperties,
  muted: { fontSize: 12, color: "#52525b", margin: 0, lineHeight: 1.6 } as React.CSSProperties,
};
