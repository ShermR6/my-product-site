import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "FinalPing Terms of Service. Read our terms before using the application.",
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px 80px" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px" }}>Terms of Service</h1>
      <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "48px" }}>Last Updated: May 12, 2026</p>

      <div className="legal-body">

        <p>Please read these Terms of Service carefully before using FinalPing. By downloading, installing, activating, or using FinalPing ("the Software"), you ("User") agree to be bound by these Terms. If you do not agree to these Terms in their entirety, do not install or use the Software.</p>

        <p>These Terms constitute a legally binding agreement between you and FinalPingApp ("Company," "we," "us," or "our"), a sole proprietorship operating at finalpingapp.com.</p>

        <h2>1. Description of Service</h2>
        <p>FinalPing is a desktop application that monitors aircraft positions using publicly available ADS-B transponder data and delivers proximity notifications to configured endpoints including Discord, Slack, Microsoft Teams, SMS, webhooks, and other supported integrations. The Software does not collect, intercept, or process any private communications. All flight data used by FinalPing is publicly broadcast by aircraft transponders and aggregated by independent third-party data providers.</p>
        <p>The Software is provided as a convenience tool for informational purposes only. It is not certified, approved, or designed for use in safety-critical, life-safety, or regulatory-compliance contexts.</p>

        <h2>2. License Grant</h2>
        <p>Subject to these Terms and payment of applicable fees, FinalPingApp grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to install and use the Software on devices you own or lawfully control, solely for your personal or internal business purposes.</p>
        <p>All rights not expressly granted are reserved. The Software and all intellectual property rights therein are and shall remain the exclusive property of FinalPingApp.</p>

        <h2>3. License Keys and Subscriptions</h2>
        <p>Access to the Software requires a valid license key purchased through FinalPingApp's authorized checkout. Your 30-day access period begins upon first activation in the desktop application, not at the time of purchase.</p>
        <p>License keys are personal to you and may not be sold, transferred, sublicensed, or shared with any third party. FinalPingApp reserves the right to revoke license keys used in violation of these Terms without refund.</p>
        <p>Subscriptions renew automatically at the end of each billing period unless canceled prior to the renewal date. You are responsible for canceling your subscription before renewal if you do not wish to be charged. FinalPingApp is not liable for charges resulting from failure to cancel.</p>
        <p>FinalPingApp offers a 30-day money-back guarantee for first-time purchases. Refund requests must be submitted within 30 days of initial purchase by contacting support. After 30 days, all fees are non-refundable. Renewal charges are not eligible for refund.</p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Software for any unlawful purpose or in violation of any applicable local, state, national, or international laws or regulations</li>
          <li>Attempt to reverse engineer, decompile, disassemble, or derive source code from the Software</li>
          <li>Use the Software to stalk, harass, surveil, or monitor any individual without their lawful authorization</li>
          <li>Resell, redistribute, sublicense, rent, or lease the Software or any license key</li>
          <li>Attempt to circumvent, disable, or interfere with any licensing, authentication, or security mechanism</li>
          <li>Use the Software in any application where failure or inaccuracy could result in personal injury, death, or significant property damage</li>
          <li>Use the Software to generate or disseminate false, misleading, or deceptive information about aircraft positions or movements</li>
          <li>Introduce malware, viruses, or other harmful code into the Software or its connected infrastructure</li>
          <li>Abuse, overload, or disrupt the servers or networks used to deliver the service</li>
        </ul>

        <h2>5. Third-Party Data and Services</h2>
        <p>FinalPing relies on third-party ADS-B data providers including but not limited to adsb.lol and ADS-B Exchange. FinalPingApp makes no warranties regarding the accuracy, completeness, timeliness, continuity, or availability of flight data provided by these third parties. Data gaps, delays, dropped signals, and inaccuracies are inherent characteristics of ADS-B technology, crowd-sourced receiver networks, and internet-based data delivery.</p>
        <p>FinalPingApp is not responsible for outages, rate limiting, policy changes, or discontinuation of service by any third-party data provider. Interruption of third-party services does not entitle you to a refund or credit.</p>
        <p>The Software integrates with third-party platforms (Discord, Slack, Microsoft Teams, Twilio SMS, webhooks, and others) as configured by you. FinalPingApp is not responsible for the availability, reliability, or policies of these platforms.</p>

        <h2>6. Not for Safety-Critical Use</h2>
        <p>THE SOFTWARE IS EXPRESSLY NOT INTENDED FOR USE IN ANY SAFETY-CRITICAL APPLICATION, INCLUDING BUT NOT LIMITED TO AIR TRAFFIC CONTROL, COLLISION AVOIDANCE, EMERGENCY RESPONSE, FLIGHT OPERATIONS, OR ANY OTHER CONTEXT WHERE RELIANCE ON THE SOFTWARE COULD AFFECT THE SAFETY OF PERSONS OR PROPERTY.</p>
        <p>DO NOT USE FINALPINGAPP AS A SOLE OR PRIMARY SOURCE OF AIRCRAFT POSITION INFORMATION FOR ANY PURPOSE WHERE ACCURACY OR TIMELINESS IS REQUIRED FOR SAFETY. FinalPingApp assumes no liability whatsoever for any injury, death, property damage, or other loss arising from safety-critical reliance on the Software.</p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, FINALPINGAPP EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO: WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, RELIABILITY, UNINTERRUPTED SERVICE, ERROR-FREE OPERATION, OR THAT ALL AIRCRAFT WILL BE DETECTED, REPORTED, OR NOTIFIED AT ANY GIVEN TIME.</p>
        <p>FINALPINGAPP DOES NOT WARRANT THAT THE SOFTWARE WILL MEET YOUR REQUIREMENTS, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SOFTWARE OR SERVERS ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.</p>

        <h2>8. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FINALPINGAPP, ITS OWNER, OFFICERS, EMPLOYEES, CONTRACTORS, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES OF ANY KIND, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF DATA, LOSS OF GOODWILL, BUSINESS INTERRUPTION, OR COST OF SUBSTITUTE GOODS OR SERVICES, ARISING FROM OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SOFTWARE, REGARDLESS OF WHETHER FINALPINGAPP HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, AND REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE).</p>
        <p>IN NO EVENT SHALL FINALPINGAPP'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE SOFTWARE EXCEED THE TOTAL AMOUNT ACTUALLY PAID BY YOU TO FINALPINGAPP IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM. IF YOU HAVE PAID NOTHING, FINALPINGAPP'S MAXIMUM LIABILITY IS $0.00.</p>
        <p>SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IN SUCH JURISDICTIONS, THE ABOVE LIMITATIONS SHALL APPLY TO THE FULLEST EXTENT PERMITTED BY LAW.</p>

        <h2>9. Indemnification</h2>
        <p>You agree to defend, indemnify, and hold harmless FinalPingApp, its owner, officers, employees, contractors, agents, licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to: (a) your use of the Software; (b) your violation of these Terms; (c) your violation of any applicable law or regulation; (d) your violation of any third-party right, including any intellectual property, privacy, or proprietary right; or (e) any claim by a third party arising from your use of the Software.</p>

        <h2>10. Intellectual Property</h2>
        <p>The Software, including all code, design, graphics, interfaces, content, and documentation, is the exclusive intellectual property of FinalPingApp and is protected by applicable copyright, trademark, trade secret, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works of any part of the Software without express written permission from FinalPingApp.</p>
        <p>FinalPing and FinalPingApp are trademarks of FinalPingApp. You may not use these marks without prior written consent.</p>

        <h2>11. Dispute Resolution and Arbitration</h2>
        <p>PLEASE READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.</p>
        <p>Any dispute, claim, or controversy arising out of or relating to these Terms or the Software ("Dispute") shall first be resolved by good-faith negotiation. Either party may initiate negotiation by sending written notice to the other describing the Dispute and proposed resolution. If the Dispute is not resolved within thirty (30) days, either party may submit the Dispute to binding arbitration administered by the American Arbitration Association ("AAA") under its Consumer Arbitration Rules, except as modified by these Terms.</p>
        <p>The arbitration shall be conducted in English and, unless the parties agree otherwise, shall be conducted by a single arbitrator selected in accordance with AAA rules. The arbitrator's decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.</p>
        <p>CLASS ACTION WAIVER: YOU AND FINALPINGAPP EACH WAIVE THE RIGHT TO BRING OR PARTICIPATE IN ANY CLASS ACTION, CLASS-WIDE ARBITRATION, OR COLLECTIVE ACTION RELATED TO THE SOFTWARE OR THESE TERMS. EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY.</p>
        <p>Nothing in this section prevents either party from seeking injunctive or other equitable relief in a court of competent jurisdiction for matters involving intellectual property infringement or breach of confidentiality obligations.</p>

        <h2>12. Force Majeure</h2>
        <p>FinalPingApp shall not be liable for any delay or failure to perform resulting from causes outside its reasonable control, including but not limited to acts of God, natural disasters, pandemics, war, terrorism, civil unrest, governmental action, internet outages, third-party service failures, power failures, or cyberattacks.</p>

        <h2>13. Privacy</h2>
        <p>Your use of FinalPing is also governed by our <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Software, you consent to the collection and use of your information as described in the Privacy Policy.</p>

        <h2>14. Modifications to Service or Terms</h2>
        <p>FinalPingApp reserves the right to modify, suspend, or discontinue the Software or any feature thereof at any time, with or without notice, and without liability to you. FinalPingApp may update these Terms at any time. Material changes will be communicated by updating the "Last Updated" date. Your continued use of the Software after changes become effective constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, your sole remedy is to stop using the Software.</p>

        <h2>15. Termination</h2>
        <p>FinalPingApp may suspend or terminate your access to the Software at any time, with or without cause, with or without notice. Upon termination for cause (including violation of these Terms), you are not entitled to a refund. Upon termination, all rights granted to you under these Terms immediately cease, and you must stop using the Software and delete all copies in your possession.</p>
        <p>You may terminate your use of the Software at any time by canceling your subscription and uninstalling the Software. Termination does not entitle you to a refund except as provided in the 30-day money-back guarantee.</p>

        <h2>16. Governing Law and Jurisdiction</h2>
        <p>These Terms shall be governed by and construed in accordance with the laws of the State of Texas, United States, without regard to its conflict of law provisions. To the extent that any Dispute proceeds in court (rather than arbitration), you consent to exclusive personal jurisdiction and venue in the state and federal courts located in Denton County, Texas.</p>

        <h2>17. Entire Agreement and Severability</h2>
        <p>These Terms, together with the Privacy Policy, constitute the entire agreement between you and FinalPingApp with respect to the Software and supersede all prior agreements, representations, and understandings. If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The failure of FinalPingApp to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision.</p>

        <h2>18. No Professional Advice</h2>
        <p>The Software and any information provided through it are for informational purposes only. FinalPingApp does not provide legal, aviation, safety, or professional advice of any kind. Any decisions you make based on information provided by the Software are entirely your own responsibility.</p>

        <h2>19. Contact</h2>
        <p>If you have questions about these Terms, please contact us at <a href="mailto:aircraftalerts@finalpingapp.com">aircraftalerts@finalpingapp.com</a> or visit <a href="https://finalpingapp.com/contact">finalpingapp.com/contact</a>.</p>

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
