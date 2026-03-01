export const metadata = {
  title: "Terms of Service | FinalPing",
  description: "FinalPing Terms of Service — read our terms before using the application.",
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px 80px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>Terms of Service</h1>
      <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "48px" }}>Last Updated: February 28, 2026</p>

      <div className="legal-body">

        <p>Please read these Terms of Service carefully before using FinalPing. By downloading, installing, or using FinalPing ("the Software"), you agree to be bound by these Terms. If you do not agree, do not install or use the Software.</p>

        <h2>1. Description of Service</h2>
        <p>FinalPing is a desktop application that monitors aircraft positions using publicly available ADS-B transponder data and delivers proximity notifications to configured webhook endpoints (Discord, Slack, Microsoft Teams). The Software does not collect, intercept, or process any private communications. All flight data used by FinalPing is publicly broadcast by aircraft transponders and aggregated by third-party data providers.</p>

        <h2>2. License</h2>
        <p>Subject to these Terms, FinalPingApp grants you a limited, non-exclusive, non-transferable, revocable license to install and use the Software on devices you own or control, solely for your personal or internal business purposes.</p>

        <h2>3. License Keys</h2>
        <p>Each license key entitles you to activate FinalPing on one or more devices as specified at the time of purchase. License keys are non-refundable after activation. Your 30-day access period begins upon first activation in the desktop application, not at the time of purchase.</p>
        <p>You may not sell, transfer, sublicense, or share your license key with any third party. FinalPingApp reserves the right to revoke license keys used in violation of these Terms without refund.</p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Software for any unlawful purpose or in violation of any applicable laws or regulations</li>
          <li>Attempt to reverse engineer, decompile, or disassemble the Software</li>
          <li>Use the Software to stalk, harass, or monitor individuals without their knowledge or consent</li>
          <li>Resell, redistribute, or sublicense the Software or your license key</li>
          <li>Attempt to circumvent any licensing or authentication mechanisms</li>
        </ul>

        <h2>5. Third-Party Data</h2>
        <p>FinalPing relies on third-party ADS-B data providers including but not limited to adsb.lol and ADS-B Exchange. FinalPingApp makes no warranties regarding the accuracy, completeness, timeliness, or availability of flight data provided by these third parties. Data gaps, delays, and inaccuracies are inherent to ADS-B technology and crowd-sourced receiver networks.</p>

        <h2>6. Disclaimer of Warranties</h2>
        <p>THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. FINALPINGAPP DOES NOT WARRANT THAT THE SOFTWARE WILL BE ERROR-FREE, UNINTERRUPTED, OR THAT ALL AIRCRAFT WILL BE DETECTED AT ALL TIMES.</p>
        <p>FINALPINGAPP IS NOT INTENDED FOR USE IN SAFETY-CRITICAL APPLICATIONS. DO NOT RELY ON FINALPINGAPP AS A SOLE SOURCE OF AIRCRAFT POSITION INFORMATION FOR ANY PURPOSE WHERE ACCURACY IS SAFETY-CRITICAL.</p>

        <h2>7. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FINALPINGAPP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SOFTWARE.</p>
        <p>IN NO EVENT SHALL FINALPINGAPP'S TOTAL LIABILITY TO YOU EXCEED THE AMOUNT PAID BY YOU FOR THE LICENSE KEY IN THE TWELVE MONTHS PRECEDING THE CLAIM.</p>

        <h2>8. Privacy</h2>
        <p>Your use of FinalPing is also governed by our <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>

        <h2>9. Modifications to Terms</h2>
        <p>FinalPingApp reserves the right to modify these Terms at any time. We will notify you of material changes by updating the "Last Updated" date. Your continued use of the Software after changes become effective constitutes your acceptance of the revised Terms.</p>

        <h2>10. Termination</h2>
        <p>FinalPingApp may terminate your license at any time if you violate these Terms. Upon termination, you must cease all use of the Software and delete all copies in your possession.</p>

        <h2>11. Governing Law</h2>
        <p>These Terms shall be governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions.</p>

        <h2>12. Contact</h2>
        <p>If you have questions about these Terms, please contact us at <a href="mailto:support@finalpingapp.com">support@finalpingapp.com</a>.</p>

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
      `}</style>
    </div>
  );
}
