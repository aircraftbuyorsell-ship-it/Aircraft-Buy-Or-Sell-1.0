import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-black text-[#1A1814] tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-[#4A4845]">{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F7F4EF] px-4 md:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] text-[#AAA49C] hover:text-[#D4A017] mb-5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to IntraZone
        </Link>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 md:p-10 space-y-8">
          <div className="border-b border-black/[0.06] pb-6">
            <div className="w-12 h-12 rounded-xl bg-[#0B2D5B] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-[#E8A83A]" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#D4A017]">Privacy · Version 1.0</p>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A1814] tracking-tight mt-2">Privacy Policy</h1>
            <p className="text-sm text-[#6B6560] mt-2">Effective date: April 28, 2026</p>
          </div>

          <Section title="1. Overview">
            <p>This Privacy Policy explains how IntraZone and ABOS collect, use, store, share, and protect personal data in connection with the aircraft transaction intelligence platform, including ATI Passport, OMVM analytics, Deal Radar, escrow workflows, leads, alerts, rewards, affiliate tracking, and user behavior features.</p>
            <p>Where the General Data Protection Regulation (GDPR) applies, this policy describes the main categories of personal data, lawful bases, retention approach, and user rights.</p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We may collect account data such as name, email address, role, authentication identifiers, and account preferences. We may collect aircraft workflow data such as listings, ownership traces, escrow participants, buyer/seller details, broker details, lead records, affiliate links, reviews, uploaded files, and transaction notes.</p>
            <p>We may collect usage and behavior data such as page visits, feature usage, session counts, credit usage, upgrade prompts, alert matches, referral activity, and system events. We may collect technical data such as device information, browser type, IP-derived metadata, approximate location, logs, and security events.</p>
          </Section>

          <Section title="3. Sensitive Aviation and Transaction Data">
            <p>Aircraft transactions may involve sensitive commercial information, proof-of-funds documents, ownership documents, escrow status, contact details, and negotiation records. Users should only upload information they are authorized to share and should avoid uploading unnecessary personal or confidential data.</p>
          </Section>

          <Section title="4. How We Use Data">
            <p>We use data to operate the platform, authenticate users, provide aircraft listing tools, generate ATI and OMVM outputs, coordinate escrow workflows, manage leads, provide alerts, track affiliate attribution, calculate rewards or commissions, improve product quality, prevent fraud, secure the platform, and comply with legal obligations.</p>
            <p>We may also use aggregated or de-identified data to improve market analytics, valuation models, scoring methods, demand signals, and operational reporting.</p>
          </Section>

          <Section title="5. AI Processing">
            <p>Some data may be processed by AI systems to generate summaries, scores, valuations, recommendations, risk labels, market insights, and matching outputs. AI-generated outputs are informational and may be incomplete or inaccurate. Users should not include unnecessary personal data in AI prompts or uploaded evidence.</p>
          </Section>

          <Section title="6. Legal Bases for Processing">
            <p>Where GDPR applies, we process personal data based on one or more lawful bases: performance of a contract, legitimate interests in operating and securing the platform, consent where required for analytics or behavioral tracking, compliance with legal obligations, and protection of legal claims.</p>
          </Section>

          <Section title="7. Cookies and Behavioral Tracking">
            <p>The platform may use cookies, local storage, and similar technologies for authentication, preferences, analytics, behavioral tracking, referral capture, feature usage, and security. Where required by law, non-essential tracking should occur only after consent.</p>
            <p>Users may manage browser cookie settings, but disabling certain storage mechanisms may affect platform functionality.</p>
          </Section>

          <Section title="8. Sharing and Third Parties">
            <p>We may share data with service providers that support hosting, authentication, database services, file storage, analytics, AI processing, email delivery, payment processing, escrow integrations, aviation data sources, and security operations. We may also share data when required by law, to enforce agreements, prevent fraud, protect users, or complete requested transaction workflows.</p>
            <p>Third-party integrations are governed by their own privacy practices. Users should review third-party terms before connecting or relying on external services.</p>
          </Section>

          <Section title="9. International Transfers">
            <p>Data may be processed in countries other than the user’s country of residence. Where required, we rely on appropriate safeguards such as contractual protections, service provider commitments, and applicable transfer mechanisms.</p>
          </Section>

          <Section title="10. Retention">
            <p>We retain personal data only as long as reasonably necessary for platform operation, transaction records, legal compliance, dispute resolution, security, accounting, audit logs, and legitimate business purposes. Behavioral records should be minimized and may be automatically deleted according to configured retention rules, including the planned 90-day UserBehavior retention control.</p>
          </Section>

          <Section title="11. Security">
            <p>We use technical and organizational measures designed to protect data against unauthorized access, loss, misuse, alteration, and disclosure. No system is completely secure, and users are responsible for protecting their own account credentials and limiting unnecessary uploads.</p>
          </Section>

          <Section title="12. User Rights">
            <p>Depending on applicable law, users may have rights to access, correct, delete, restrict, object to processing, withdraw consent, or request portability of their personal data. Users may also have the right to lodge a complaint with a data protection authority.</p>
            <p>Requests should be submitted through the official IntraZone support or account channel. We may need to verify identity before fulfilling a request.</p>
          </Section>

          <Section title="13. Children">
            <p>The platform is intended for business and aviation transaction use and is not directed to children. Users must not knowingly provide personal data of children through the platform.</p>
          </Section>

          <Section title="14. Account Deletion">
            <p>Users may request account deletion through available account tools or support channels. Some records may be retained where necessary for legal, security, audit, transaction, accounting, or dispute-resolution purposes.</p>
          </Section>

          <Section title="15. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. Updated versions will be posted in the application with a revised effective date. Material changes may be communicated through the platform or other appropriate channels.</p>
          </Section>

          <Section title="16. Contact">
            <p>For privacy questions, GDPR requests, or data protection inquiries, contact the platform administrator through the official IntraZone support or account channel.</p>
          </Section>

          <div className="bg-[#F7F4EF] border border-black/[0.06] rounded-xl p-4 text-xs text-[#6B6560]">
            This page is a version-controlled privacy framework draft for implementation and should be reviewed by qualified legal counsel before production reliance.
          </div>
        </div>
      </div>
    </div>
  );
}