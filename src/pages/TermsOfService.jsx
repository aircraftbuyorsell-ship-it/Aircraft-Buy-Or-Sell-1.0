import { Link } from "react-router-dom";
import { ArrowLeft, Scale } from "lucide-react";

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-black text-[#1A1814] tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-[#4A4845]">{children}</div>
    </section>
  );
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F7F4EF] px-4 md:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] text-[#AAA49C] hover:text-[#D4A017] mb-5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to IntraZone
        </Link>

        <div className="bg-white border border-black/[0.07] rounded-2xl p-6 md:p-10 space-y-8">
          <div className="border-b border-black/[0.06] pb-6">
            <div className="w-12 h-12 rounded-xl bg-[#0B2D5B] flex items-center justify-center mb-4">
              <Scale className="w-6 h-6 text-[#E8A83A]" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-black text-[#D4A017]">Legal · Version 1.0</p>
            <h1 className="text-3xl md:text-4xl font-black text-[#1A1814] tracking-tight mt-2">Terms of Service</h1>
            <p className="text-sm text-[#6B6560] mt-2">Effective date: April 28, 2026</p>
          </div>

          <Section title="1. Agreement to Terms">
            <p>These Terms of Service govern access to and use of IntraZone, ABOS, ATI Passport, OMVM analytics, Deal Radar, escrow workflows, lead tools, and related aircraft transaction intelligence features. By accessing or using the platform, you agree to these Terms.</p>
            <p>If you use the platform on behalf of a company, broker, dealer, marketplace, or other legal entity, you confirm that you have authority to bind that entity to these Terms.</p>
          </Section>

          <Section title="2. Platform Role">
            <p>IntraZone provides software, market intelligence, workflow automation, aircraft listing tools, AI-assisted scoring, and transaction coordination features. IntraZone is not an aircraft broker, escrow agent, title company, insurer, certified appraiser, maintenance provider, or legal adviser unless separately agreed in writing.</p>
            <p>Aircraft purchase, sale, inspection, title verification, import/export, registration, tax, customs, and regulatory decisions remain the responsibility of the buyer, seller, broker, operator, and their professional advisers.</p>
          </Section>

          <Section title="3. AI Outputs and WIZARD System Disclaimer">
            <p>ATI Scores, OMVM valuations, market insights, risk labels, summaries, recommendations, and Deal Radar outputs may be generated or assisted by the WIZARD artificial intelligence system. These outputs are provided for informational purposes only.</p>
            <p>AI outputs do not constitute a certified aircraft appraisal, airworthiness determination, title opinion, financial advice, legal advice, tax advice, investment recommendation, or guarantee of transaction outcome. Users must conduct independent due diligence, including physical inspection by qualified aviation professionals, title search, logbook review, maintenance record review, lien checks, and regulatory review before any purchase or sale.</p>
          </Section>

          <Section title="4. User Accounts and Eligibility">
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities performed under your account. You must provide accurate information and promptly update account details when necessary.</p>
            <p>We may restrict, suspend, or terminate access if we reasonably believe that account activity violates these Terms, creates legal risk, compromises platform security, or harms other users.</p>
          </Section>

          <Section title="5. Listings, Leads, and User Content">
            <p>Users are responsible for aircraft listing data, uploaded documents, photos, lead information, escrow details, ownership claims, affiliate details, and other content submitted to the platform. You represent that you have the right to submit such content and that it is accurate to the best of your knowledge.</p>
            <p>You must not upload unlawful, misleading, defamatory, confidential, infringing, fraudulent, or malicious content. We may remove or restrict content that appears to violate these Terms or applicable law.</p>
          </Section>

          <Section title="6. Aircraft Transaction Responsibility">
            <p>Aircraft transactions involve substantial operational, legal, financial, maintenance, regulatory, customs, and title risks. Users are solely responsible for verifying aircraft condition, ownership, encumbrances, export/import requirements, VAT or tax exposure, ferry planning, insurance, airworthiness, and compliance with applicable aviation authorities.</p>
            <p>Any escrow or payment workflows provided by the platform are coordination tools only unless explicitly stated otherwise. Third-party escrow providers remain responsible for their own services under their separate terms.</p>
          </Section>

          <Section title="7. Payments, Credits, and Premium Features">
            <p>Paid features, credits, subscriptions, verification services, reports, lead unlocks, and premium analytics may be subject to separate pricing, availability, and usage limits shown in the application. Unless required by law or expressly stated otherwise, purchases are non-transferable and may be non-refundable once consumed.</p>
          </Section>

          <Section title="8. Affiliate, Referral, and Commission Features">
            <p>Affiliate links, referral chains, first-verified-source attribution, commission ledgers, and settlement tools are internal workflow aids. Commission eligibility, payout timing, disputes, tax reporting, and settlement approval remain subject to separate commercial agreements and administrator review.</p>
          </Section>

          <Section title="9. Prohibited Uses">
            <p>You may not use the platform to commit fraud, misrepresent aircraft status, manipulate scores, scrape or resell platform data without permission, bypass access controls, reverse engineer the service, upload malware, harass users, violate aviation laws, violate privacy laws, or interfere with platform operations.</p>
          </Section>

          <Section title="10. Intellectual Property">
            <p>The platform, ABOS methodology, ATI framework, WIZARD workflows, OMVM analytics, software, designs, branding, documentation, and proprietary models are owned by or licensed to IntraZone. No rights are transferred except the limited right to use the service according to these Terms.</p>
            <p>Users retain ownership of their submitted content but grant IntraZone a limited license to host, process, display, analyze, and use that content as necessary to operate, secure, improve, and provide the platform.</p>
          </Section>

          <Section title="11. Privacy and Data Protection">
            <p>Personal data is handled according to the Privacy Policy. Users must not submit personal data unless they have a lawful basis to do so. Where GDPR or similar laws apply, users are responsible for ensuring their own compliance when collecting or sharing personal data through the platform.</p>
          </Section>

          <Section title="12. Third-Party Services">
            <p>The platform may integrate with third-party services such as payment processors, escrow providers, aircraft data sources, mapping services, radio services, aviation APIs, analytics tools, or identity providers. Third-party services are governed by their own terms and privacy policies.</p>
          </Section>

          <Section title="13. No Warranty">
            <p>The platform is provided on an “as is” and “as available” basis. We do not warrant that data, AI outputs, valuations, lead information, aircraft records, third-party integrations, or transaction workflows will be complete, accurate, uninterrupted, or error-free.</p>
          </Section>

          <Section title="14. Limitation of Liability">
            <p>To the maximum extent permitted by law, IntraZone, ABOS, and their owners, officers, contractors, partners, and affiliates are not liable for indirect, incidental, consequential, special, punitive, or lost-profit damages, or for decisions made based on platform outputs, aircraft data, AI analysis, third-party data, or transaction workflows.</p>
          </Section>

          <Section title="15. Governing Law and Disputes">
            <p>Unless otherwise required by mandatory law, these Terms are governed by the laws of the Czech Republic. Disputes should first be addressed through good-faith negotiation. If unresolved, disputes may be submitted to competent courts or arbitration as specified in a separate written agreement.</p>
          </Section>

          <Section title="16. Changes to Terms">
            <p>We may update these Terms from time to time. Updated versions will be posted in the application with a revised effective date. Continued use after changes means you accept the updated Terms.</p>
          </Section>

          <Section title="17. Contact">
            <p>For legal notices, privacy questions, or terms-related inquiries, contact the platform administrator through the official IntraZone support or account channel.</p>
          </Section>

          <div className="bg-[#F7F4EF] border border-black/[0.06] rounded-xl p-4 text-xs text-[#6B6560]">
            This page is a version-controlled legal framework draft for implementation and should be reviewed by qualified legal counsel before production reliance.
          </div>
        </div>
      </div>
    </div>
  );
}