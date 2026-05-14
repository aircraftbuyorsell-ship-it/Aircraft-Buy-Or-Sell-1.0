import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export default function CookiePolicy() {
  return (
    <LegalDocument label="Privacy · Cookies" title="Cookie Policy">
      <LegalSection title="This website uses cookies"><p>We use cookies to personalise content, ads and to analyse our traffic. We also share information about your use of our site with our advertising and analytics partners who may combine it with other information that you’ve provided to them or that they’ve collected from your use of their services.</p></LegalSection>
      <LegalSection title="Essential"><p>Essential cookies are required for authentication, security, routing, and core platform functionality. They cannot be disabled because the website may not work correctly without them.</p></LegalSection>
      <LegalSection title="Functional"><p>Functional cookies remember preferences such as interface choices and improve the experience of using IntraZone.</p></LegalSection>
      <LegalSection title="Marketing"><p>Marketing cookies help personalise content and ads, measure campaigns, and support advertising or analytics partners where consent has been provided.</p></LegalSection>
      <LegalSection title="Consent Choices"><p>You can accept all cookies, decline all non-essential cookies, or review details in the cookie banner. You may also manage cookies through your browser settings.</p></LegalSection>
      <LegalSection title="Contact"><p>Questions about cookies or privacy choices should be sent through the official IntraZone support or account channel.</p></LegalSection>
    </LegalDocument>
  );
}