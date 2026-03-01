export const metadata = {
  title: "Privacy Policy | FinalPing",
  description: "FinalPing Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px 80px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>Privacy Policy</h1>
      <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "48px" }}>Last Updated: February 28, 2026</p>

      <div className="legal-body">

        <p>FinalPingApp is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.</p>

        <h2>1. Information We Collect</h2>
        <p><strong>Account Information</strong> — When you activate FinalPing, we collect your email address, license key, and the date and time of activation.</p>
        <p><strong>Configuration Data</strong> — To provide the tracking service, we store aircraft tail numbers and ICAO24 hex codes you choose to track, your tracking location coordinates, detection radius and polling interval preferences, quiet hours settings, webhook URLs for Discord/Slack/Teams notifications, and alert distance thresholds.</p>
        <p><strong>Technical Data</strong> — We may collect basic technical information including application version number and general error logs for debugging purposes.</p>

        <h2>2. Information We Do Not Collect</h2>
        <ul>
          <li>Your name or physical address</li>
          <li>Payment information (processed by Stripe — we never see your card details)</li>
          <li>Browsing history or behavior outside the application</li>
          <li>The content of any messages sent to your webhooks</li>
          <li>Real-time location data about you personally</li>
          <li>Any data from your aircraft beyond what you explicitly enter</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to authenticate your license and provide access to the Software, sync your configuration across devices, deliver aircraft tracking notifications to your configured webhooks, respond to support requests, and improve and maintain the Software.</p>
        <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

        <h2>4. Third-Party Services</h2>
        <p><strong>ADS-B Data Providers</strong> — FinalPing uses publicly available ADS-B flight data from third-party providers such as adsb.lol. Your tracking location coordinates are sent to these providers as part of API requests to retrieve nearby aircraft data.</p>
        <p><strong>Stripe</strong> — License purchases are processed by Stripe, Inc. FinalPingApp does not store your payment card information. Stripe's privacy policy is available at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>.</p>
        <p><strong>Webhooks</strong> — When an aircraft alert is triggered, FinalPing sends a notification to the webhook URL(s) you configure. FinalPingApp does not store the content of these messages.</p>
        <p><strong>Resend</strong> — We use Resend to send transactional emails such as your license key delivery. Only your email address is shared with Resend for this purpose.</p>

        <h2>5. Data Storage and Security</h2>
        <p>Your configuration data is stored on secure servers hosted by Railway (railway.app). We implement reasonable technical and organizational measures to protect your data against unauthorized access, alteration, or destruction. Local application data such as your authentication token is stored on your device using encrypted application storage.</p>

        <h2>6. Data Retention</h2>
        <p>We retain your account and configuration data for as long as your license is active or as needed to provide the service. If you request deletion of your account, we will delete your personal data within 30 days, except where retention is required by law.</p>

        <h2>7. Your Rights</h2>
        <p>Depending on your location, you may have the right to access the personal data we hold about you, request correction of inaccurate data, request deletion of your data, object to or restrict processing of your data, and withdraw consent at any time. To exercise any of these rights, contact us at <a href="mailto:support@finalpingapp.com">support@finalpingapp.com</a>.</p>

        <h2>8. Children's Privacy</h2>
        <p>FinalPing is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last Updated" date at the top of this policy. Your continued use of the Software after changes are posted constitutes your acceptance of the revised policy.</p>

        <h2>10. Contact Us</h2>
        <p>If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at <a href="mailto:support@finalpingapp.com">support@finalpingapp.com</a> or visit <a href="https://finalpingapp.com">finalpingapp.com</a>.</p>

      </div>

      <style>{`
        .legal-body p {
          color: #d1d5db;
          font-size: 15px;
          line-height: 1.8;
          margin-bottom: 16px;
        }
        .legal-body h2 {
          font-size: 18px;
          font-weight: 700;
          color: #f9fafb;
          margin: 36px 0 12px 0;
        }
        .legal-body ul {
          color: #d1d5db;
          font-size: 15px;
          line-height: 1.8;
          padding-left: 24px;
          margin-bottom: 16px;
        }
        .legal-body li {
          margin-bottom: 6px;
        }
        .legal-body a {
          color: #60a5fa;
          text-decoration: underline;
        }
        .legal-body strong {
          color: #f9fafb;
        }
      `}</style>
    </div>
  );
}
