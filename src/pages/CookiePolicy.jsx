import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export default function CookiePolicy() {
  return (
    <LegalDocument label="Privacy · Cookies" title="Cookie Policy">
      <LegalSection title="1. What Cookies Are"><p>Cookies and similar technologies help IntraZone operate securely, remember preferences, understand feature usage, and improve aviation transaction workflows.</p></LegalSection>
      <LegalSection title="2. Cookies We Use"><p>Essential cookies support authentication, security, routing, and session continuity. Preference cookies remember interface choices. Analytics cookies help us understand aggregate usage. Marketing or referral cookies may support affiliate attribution when permitted.</p></LegalSection>
      <LegalSection title="3. Third-Party Services"><p>Services such as payments, analytics, hosting, email delivery, AI processing, and security tooling may set their own cookies or similar identifiers according to their policies.</p></LegalSection>
      <LegalSection title="4. Consent Choices"><p>Non-essential analytics or marketing cookies should only be enabled after consent where required by law. You can accept, reject, or adjust browser-level cookie settings at any time.</p></LegalSection>
      <LegalSection title="5. Managing Cookies"><p>You may block or delete cookies through your browser. Some platform features may not function correctly if essential cookies or storage are disabled.</p></LegalSection>
      <LegalSection title="6. Contact"><p>Questions about cookies or privacy choices should be sent through the official IntraZone support or account channel.</p></LegalSection>
    </LegalDocument>
  );
}