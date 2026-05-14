import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export default function AffiliateAgreement() {
  return (
    <LegalDocument label="Commercial · Affiliates" title="Affiliate Partnership Terms">
      <LegalSection title="1. Program Overview"><p>The affiliate program allows approved partners to refer qualified aviation buyers, sellers, brokers, and marketplace participants to IntraZone services.</p></LegalSection>
      <LegalSection title="2. Eligibility"><p>Participation may require approval, accurate identity information, compliance with aviation laws, and adherence to professional marketing standards.</p></LegalSection>
      <LegalSection title="3. Attribution and Commissions"><p>Referral attribution, commission eligibility, payout timing, and adjustments are governed by the applicable campaign, commission scheme, and platform records.</p></LegalSection>
      <LegalSection title="4. Marketing Rules"><p>Affiliates must not misrepresent IntraZone, guarantee aircraft values, use misleading claims, send spam, impersonate the platform, or violate advertising, privacy, aviation, or consumer protection laws.</p></LegalSection>
      <LegalSection title="5. Required Disclosures"><p>Affiliates must clearly disclose referral or commission relationships wherever required by law, including FTC-style disclosure obligations.</p></LegalSection>
      <LegalSection title="6. Termination"><p>IntraZone may suspend or terminate participation for fraud, abuse, non-compliance, reputational risk, or breach of these terms.</p></LegalSection>
    </LegalDocument>
  );
}