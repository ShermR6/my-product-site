import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "FinalPing refund and return policy for ground station hardware and software licenses.",
};

export default function RefundPolicyPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px 80px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>Refund Policy</h1>
      <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "48px" }}>Last Updated: June 1, 2026</p>

      <div className="legal-body">

        <p>This policy covers returns and refunds for FinalPing ground station hardware purchased through finalpingapp.com. For questions, contact us at <a href="mailto:support@finalpingapp.com" style={{ color: "var(--accent)" }}>support@finalpingapp.com</a>.</p>

        <h2>1. Hardware Returns</h2>
        <p>We accept returns on ground station kits and individual parts within <strong>30 days of the delivery date</strong> as confirmed by your UPS tracking number. Items must be returned in their original condition and original packaging. We do not accept returns on items that show signs of physical damage not caused by shipping.</p>

        <h2>2. Return Shipping</h2>
        <p>Once your return is approved, we will email you a prepaid USPS return label. Simply bring it to any post office — packaging is included with the label. The cost of the return label will be deducted from your refund amount. FinalPing is not responsible for items damaged in return transit due to inadequate packaging.</p>

        <h2>3. Refund Processing</h2>
        <p>Once we receive and inspect the returned item, a full refund will be issued to your original payment method within 5–10 business days. You will receive an email confirmation when your refund has been processed. Refunds are not issued until the item has been received.</p>

        <h2>4. Defective or Damaged Items</h2>
        <p>If your item arrives defective or is damaged in transit, contact us within 30 days of delivery and we will make it right at no cost to you:</p>
        <ul>
          <li>We will send a prepaid return shipping label for the defective unit.</li>
          <li>A replacement will be shipped to you at no charge once the defective item is in transit.</li>
          <li>If a replacement is not available, a full refund will be issued including original shipping costs.</li>
        </ul>
        <p>Please include a photo of the defect or damage when contacting us — this helps us resolve your case faster and improve our packaging.</p>

        <h2>5. Non-Returnable Items</h2>
        <p>The following are not eligible for return or refund:</p>
        <ul>
          <li>Items returned after 30 days of the delivery date</li>
          <li>Items not in original condition or packaging</li>
          <li>Items that show signs of physical damage not caused by shipping</li>
          <li>Software license keys (see our <a href="/terms" style={{ color: "var(--accent)" }}>Terms of Service</a> for license refund terms)</li>
        </ul>

        <h2>6. Contact Us</h2>
        <p>To initiate a return or report a defective item, email us at <a href="mailto:support@finalpingapp.com" style={{ color: "var(--accent)" }}>support@finalpingapp.com</a> with your order number and reason for return. We typically respond within 1–2 business days.</p>

      </div>
    </div>
  );
}
