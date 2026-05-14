import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export default function GDPRCompliance() {
  return (
    <LegalDocument label="Privacy · GDPR" title="GDPR Compliance Statement">
      <LegalSection title="1. Data Controller"><p>IntraZone/ABOS acts as a platform operator for aircraft intelligence, transaction workflows, lead management, and related services. Specific transaction parties may also act as independent controllers for data they upload or process.</p></LegalSection>
      <LegalSection title="2. Legal Bases"><p>We process data to perform contracts, comply with legal obligations, protect legitimate interests, secure the platform, manage transactions, and use consent where required for optional analytics or marketing.</p></LegalSection>
      <LegalSection title="3. Your Rights"><p>Depending on jurisdiction, you may request access, correction, deletion, restriction, objection, portability, or withdrawal of consent. We may verify identity before acting on requests.</p></LegalSection>
      <LegalSection title="4. Retention"><p>Data is retained only as long as needed for platform operations, legal obligations, audit trails, transaction records, dispute resolution, fraud prevention, and security.</p></LegalSection>
      <LegalSection title="5. Processors and Transfers"><p>We may use trusted service providers for hosting, authentication, storage, payments, communications, analytics, and AI processing. International transfers are handled with appropriate contractual and operational safeguards where required.</p></LegalSection>
      <LegalSection title="6. Requests"><p>Submit GDPR or privacy requests through the account tools or official support channel. We aim to respond within legally required timelines.</p></LegalSection>
    </LegalDocument>
  );
}