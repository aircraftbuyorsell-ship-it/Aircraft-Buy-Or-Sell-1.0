import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export default function EscrowAgreement() {
  return (
    <LegalDocument label="Transactions · Escrow" title="Escrow Coordination Agreement">
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900"><strong>Important:</strong> IntraZone is not a licensed escrow company, bank, trustee, or legal custodian of funds unless explicitly stated in a separate signed agreement. Escrow funds should be held by an independent qualified escrow provider.</div>
      <LegalSection title="1. Service Role"><p>IntraZone may provide workflow coordination, status tracking, document organization, condition management, and communication tools for aircraft transactions.</p></LegalSection>
      <LegalSection title="2. External Escrow Provider"><p>Users are responsible for selecting and verifying any escrow provider, payment rail, legal counsel, broker, inspector, or closing agent involved in a transaction.</p></LegalSection>
      <LegalSection title="3. Transaction Conditions"><p>Inspection, title, financing, document delivery, release, refund, and closing conditions must be agreed by the transaction parties and their professional advisors.</p></LegalSection>
      <LegalSection title="4. No Legal or Financial Advice"><p>Platform outputs, reminders, and escrow workflow labels are informational and do not replace professional legal, tax, financial, title, or aviation advice.</p></LegalSection>
      <LegalSection title="5. Liability Limits"><p>IntraZone is not responsible for disputes between parties, failed closings, inaccurate third-party information, escrow provider conduct, regulatory filings, or funds held outside the platform.</p></LegalSection>
      <LegalSection title="6. Prohibited Use"><p>Users must not use escrow workflows for fraud, sanctions evasion, money laundering, unlawful aircraft transfers, or transactions involving unauthorized parties.</p></LegalSection>
    </LegalDocument>
  );
}