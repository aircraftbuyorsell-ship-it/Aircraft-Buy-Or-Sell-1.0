/**
 * PrivacyPolicy.jsx — ABOS Marketspace
 * GDPR-compliant privacy policy · DS v3 styling
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, ArrowLeft, Shield } from "lucide-react";

const C = {
  ink:  "#04060a", ink1: "#0d1117", ink2: "#111620",
  amber: "#f5c242", amberDim: "rgba(245,194,66,0.09)", amberBorder: "rgba(245,194,66,0.22)",
  teal: "#5dcaa5", tealDim: "rgba(93,202,165,0.09)", tealBorder: "rgba(93,202,165,0.20)",
  blue: "#4e8ef7", blueDim: "rgba(78,142,247,0.09)", blueBorder: "rgba(78,142,247,0.20)",
  w1: "rgba(255,255,255,0.90)", w2: "rgba(255,255,255,0.60)",
  w3: "rgba(255,255,255,0.35)", border: "rgba(255,255,255,0.08)",
};

const SECTIONS = [
  {
    id: "1", title: "1. Who We Are (Controller)",
    content: `Data Controller: ABOS s.r.o., registered in the Czech Republic.
Contact: privacy@abos-marketspace.com

If you have questions about how we process your personal data, please contact our Data Protection contact at the email above.`
  },
  {
    id: "2", title: "2. What Data We Collect",
    content: `We collect the following categories of personal data:

Account Data: Name, email address, company name, country, tier/subscription level.

Usage Data (UserBehavior): Pages visited, features used, search queries, scoring requests, timestamps. This data is automatically deleted after 90 days.

Payment Data: Billing address, VAT number. We do NOT store full card numbers — payment processing is handled by Stripe (PCI-DSS compliant).

Aircraft Query Data: N-numbers, aircraft makes/models, and listing text you submit for ATI scoring. This may include third-party registration data.

Communication Data: Emails you send us, support tickets, feedback submissions.

Technical Data: IP address, browser type, device type, session tokens (for security and fraud prevention).

Cookies: See Section 7 (Cookie Policy).`
  },
  {
    id: "3", title: "3. Legal Basis for Processing (GDPR Art. 6)",
    content: `We process your personal data on the following legal bases:

Contract Performance (Art. 6(1)(b)): Processing necessary to provide the Platform services you have subscribed to, including account management, ATI scoring, and subscription billing.

Legitimate Interests (Art. 6(1)(f)): Platform security, fraud prevention, product improvement, and service analytics (balanced against your rights).

Legal Obligation (Art. 6(1)(c)): Tax records, accounting obligations under Czech law, AML/KYC obligations for transactions above EUR 1,000.

Consent (Art. 6(1)(a)): Marketing emails, optional analytics cookies. You may withdraw consent at any time.`
  },
  {
    id: "4", title: "4. How We Use Your Data",
    content: `Your data is used to:
• Provide, maintain, and improve the Platform
• Process subscriptions and payments
• Generate ATI Scores and OMVM estimates (your inputs are processed by our AI systems)
• Verify aircraft registrations against FAA and other public databases
• Send transactional emails (account, billing, security alerts)
• Send marketing emails (only with your consent — opt-out available at any time)
• Detect fraud and prevent abuse
• Comply with legal obligations (tax, AML, regulatory)
• Improve our ATI scoring methodology using aggregated, anonymized datasets`
  },
  {
    id: "5", title: "5. Data Sharing & Third Parties",
    content: `We share data with:

Stripe (payment processing) — US company, EU-US Data Privacy Framework certified. Processes payment and billing data.

FAA / Public Aviation Databases — We query public registration data. No personal data is sent; we receive public aircraft ownership records.

Cloudflare (infrastructure, DDoS protection, R2 storage) — EU data centers available. Processes technical/IP data.

We do NOT sell your personal data to third parties. We do NOT share data with advertisers.

In the event of a business acquisition, your data may be transferred as part of that transaction with equivalent protections.`
  },
  {
    id: "6", title: "6. International Transfers",
    content: `Some service providers (Stripe, Cloudflare) may process data outside the EEA. We ensure appropriate safeguards are in place:
• EU Standard Contractual Clauses (SCCs) where required
• Adequacy decisions where applicable
• Data Privacy Framework certifications

You may request a copy of applicable transfer safeguards by contacting privacy@abos-marketspace.com.`
  },
  {
    id: "7", title: "7. Cookie Policy",
    content: `We use cookies and similar technologies as follows:

Essential Cookies (no consent required):
• Session authentication token
• CSRF protection token
• Cookie consent preference

Analytics Cookies (consent required):
• Platform usage analytics (aggregated, anonymized)
• Feature adoption tracking

We do NOT use third-party advertising or tracking cookies.

You can manage cookie preferences via the Cookie Settings link in the footer. Withdrawing consent for analytics cookies does not affect Platform functionality.`
  },
  {
    id: "8", title: "8. Data Retention",
    content: `Account Data: Retained for the duration of your account plus 3 years after closure (legal/tax obligations).

Usage/Behavioral Data (UserBehavior entity): Automatically deleted after 90 days via scheduled cron job.

Payment Records: Retained for 10 years (Czech accounting law).

Support Communications: Retained for 3 years.

ATI Score Inputs (aircraft queries): Retained for 12 months, then anonymized for model improvement.

You may request earlier deletion of your personal data subject to legal retention obligations (see Section 9).`
  },
  {
    id: "9", title: "9. Your Rights (GDPR)",
    content: `As a data subject in the EEA, you have the right to:

Right of Access (Art. 15): Request a copy of your personal data.
Right to Rectification (Art. 16): Correct inaccurate data.
Right to Erasure (Art. 17): Request deletion ("right to be forgotten"), subject to legal retention requirements.
Right to Restriction (Art. 18): Restrict processing in certain circumstances.
Right to Portability (Art. 20): Receive your data in a machine-readable format.
Right to Object (Art. 21): Object to processing based on legitimate interests or direct marketing.
Right to Withdraw Consent: Withdraw any previously given consent at any time.
Right to Lodge a Complaint: With the Czech Office for Personal Data Protection (ÚOOÚ) at uoou.cz, or your local supervisory authority.

To exercise your rights, email: privacy@abos-marketspace.com
We will respond within 30 days (extendable to 90 days for complex requests with notice).`
  },
  {
    id: "10", title: "10. Security",
    content: `We implement appropriate technical and organizational measures including:
• Encryption in transit (TLS 1.3)
• Encrypted storage for sensitive data
• Access controls and role-based permissions
• Automated session expiry
• Regular security reviews

In the event of a data breach affecting your rights, we will notify the relevant supervisory authority within 72 hours and affected users without undue delay where required by law.`
  },
  {
    id: "11", title: "11. Children's Privacy",
    content: `The Platform is not directed at persons under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, contact privacy@abos-marketspace.com and we will delete it promptly.`
  },
  {
    id: "12", title: "12. Changes to This Policy",
    content: `We may update this Privacy Policy. Material changes will be communicated via email or in-app notification. Continued use of the Platform after the effective date constitutes acknowledgment of the updated policy.

Last updated: June 2026 | Version: 1.0`
  },
];

function Section({ section }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: C.ink1, border: `0.5px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: "12px" }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.02em", color: C.w1 }}>{section.title}</span>
        {open ? <ChevronDown size={14} color={C.w3} /> : <ChevronRight size={14} color={C.w3} />}
      </button>
      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: `0.5px solid ${C.border}` }}>
          <p style={{ fontSize: "13px", color: C.w2, lineHeight: 1.75, whiteSpace: "pre-line", margin: "16px 0 0" }}>
            {section.content}
          </p>
        </div>
      )}
    </div>
  );
}

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{
      background: C.ink,
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px)",
      backgroundSize: "40px 40px",
      minHeight: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      color: C.w1,
    }}>
      <div style={{ position: "fixed", top: "-200px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "radial-gradient(ellipse, rgba(93,202,165,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 96px", position: "relative", zIndex: 1 }}>

        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: C.w3, fontSize: "13px", cursor: "pointer", marginBottom: "32px", padding: 0 }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Shield size={18} color={C.teal} />
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.teal }}>Privacy & Data Protection</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,38px)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.06, margin: "0 0 12px" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "13px", color: C.w2, margin: 0 }}>
            ABOS Marketspace · Last updated June 2026 · Version 1.0
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
            {["GDPR Compliant", "No data selling", "90-day auto-delete", "Czech Republic"].map(t => (
              <span key={t} style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: C.tealDim, border: `0.5px solid ${C.tealBorder}`, color: C.teal, padding: "2px 10px", borderRadius: "9999px" }}>{t}</span>
            ))}
          </div>
        </div>

        <div style={{ background: C.ink1, border: `0.5px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
          <div style={{ height: "2px", background: C.teal }} />
          <div style={{ padding: "20px 22px" }}>
            <p style={{ fontSize: "13px", color: C.w2, lineHeight: 1.75, margin: 0 }}>
              This Privacy Policy explains how ABOS s.r.o. collects, uses, and protects your personal data when you use ABOS Marketspace. We are committed to GDPR compliance and your rights as a data subject.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {SECTIONS.map(s => <Section key={s.id} section={s} />)}
        </div>

        <div style={{ marginTop: "40px", padding: "20px 22px", background: C.ink1, border: `0.5px solid ${C.border}`, borderRadius: "12px" }}>
          <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.w3, margin: "0 0 8px" }}>Data Controller Contact</p>
          <p style={{ fontSize: "13px", color: C.w2, lineHeight: 1.65, margin: 0 }}>
            ABOS s.r.o. · Prague, Czech Republic<br />
            Privacy requests: privacy@abos-marketspace.com<br />
            Supervisory authority: ÚOOÚ (uoou.cz)
          </p>
        </div>
      </div>
    </div>
  );
}