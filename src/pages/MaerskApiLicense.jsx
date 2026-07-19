import LegalDocument, { LegalSection } from "@/components/legal/LegalDocument";

export default function MaerskApiLicense() {
  return (
    <LegalDocument label="Legal · Third-Party API Terms" title="Maersk API License Terms" effectiveDate="July 19, 2026">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <strong>Source notice:</strong> These are the API License Terms of A.P. Moller-Maersk A/S, the provider of the Maersk
        API integrated into the Ocean Freight hub. They are reproduced here for transparency and convenience. The
        authoritative version is published at{" "}
        <a href="https://terms.maersk.com/api-license-terms" target="_blank" rel="noreferrer"
           className="font-semibold underline hover:text-amber-700">
          terms.maersk.com/api-license-terms
        </a>
        . In case of any discrepancy, the original at that URL prevails.
      </div>

      <LegalSection title="1. API Provider">
        <p>
          This API is provided by A.P. Moller-Maersk A/S ("MAERSK"), a company registered in Denmark with company
          number 22 75 62 14 and registered office at Esplanaden 50, DK-1263 Copenhagen K.
        </p>
      </LegalSection>

      <LegalSection title="2. Contract">
        <p>
          By using or interacting in any way with the MAERSK application programming interface or any other
          associated materials or mechanisms provided by MAERSK to enable you to access MAERSK data (collectively,
          the "API"), including but not limited to requesting Credentials (as defined below) or making an API
          Request (as defined below), you acknowledge that you have read and understood this document and that you
          agree to be legally bound by the terms of this Agreement.
        </p>
        <p>
          If you agree to these API Terms on behalf of a company or other entity, you represent that you have the
          authority to bind that entity and its affiliates to these API Terms, in which case "you" or "your" shall
          refer to such entity and its affiliates. If you do not have authority or you do not agree with the Terms,
          you must not access, use or benefit from the API in any way.
        </p>
        <p>
          MAERSK reserves the right to at its full discretion make changes to the terms of this Agreement from time
          to time. When these changes are made, MAERSK will make a new copy of the Terms available at
          https://terms.maersk.com/api-license-terms or such other URL as MAERSK may provide. You understand and agree
          that if you use the Service after the date on which the terms have changed, your continued use of the API is
          deemed acceptance of the updated terms. If a modification is unacceptable to you, you may terminate this
          agreement by immediately ceasing use of the API.
        </p>
      </LegalSection>

      <LegalSection title="3. The License Agreement">
        <p>
          This licence agreement (the "Agreement") governs the interaction by you in any way with the API including,
          but not limited to, making an API Request (as defined below) and any such interaction or other use of the
          API shall be subject to the terms of this Agreement.
        </p>
      </LegalSection>

      <LegalSection title="4. Grant of Licence">
        <p>
          Subject to your full compliance with all of the terms and conditions of this Agreement and any applicable
          policies made available or incorporated by reference, MAERSK grants you a non-exclusive, revocable,
          non-sublicensable, non-transferable licence to use and access the API to develop, display and distribute
          applications, websites, content and/or services (collectively "Products") that interoperate with the MAERSK
          products, services and/or content (the "Service"), provided that such Products and Services are made
          available to end users on a non-exclusive, revocable, non-sublicensable, non-transferable licenced basis
          solely for the use and access the API of such end user.
        </p>
        <p>
          You may not install or use the API for any other purpose without MAERSK's prior written consent. You may not
          use the API for immoral or illegal purpose, nor for any other purpose which may be determined threatening,
          abusive or harmful. You may not:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li>(A) access or use the API in violation of any applicable law or regulation;</li>
          <li>
            (B) access the API in any manner that (i) compromises, breaks or circumvents any of MAERSK's technical
            processes or security measures associated with the Service including but not limited to the creation or
            transmission of any virus, worms, trojan horse, cancel-bot or any other destructive or contaminating
            program, (ii) poses a security vulnerability to customers or users of the Service, (iii) tests the
            vulnerability of MAERSK's systems or networks, (iv) reverse engineer or attempt to reverse engineer,
            (v) interfere with the API or try to interfere, (vi) try to access anything not authorized by MAERSK,
            (vii) extract source code or try to extract, or (viii) create derivative works.
          </li>
        </ul>
        <p>
          Except as expressly authorised under this Agreement, you may not (i) copy, rent, lease, sell, transfer,
          assign, sublicense, disassemble, reverse engineer or decompile (except to the limited extent expressly
          authorised by applicable law), modify or alter any part of the API. If you use the API for any of the
          purposes set out here, MAERSK confirms that such use is outside the scope of any licence granted here.
        </p>
        <p>
          For the purposes of this Agreement, an "API Request" means any communication from any Product, or any server
          used to route data to or from the Product, to the API. Your use of the API and the licence granted herein
          is subject always to any: limits on the number of permitted API Requests; additional restrictions on the
          use of the API; and/or any restriction or limit on the frequency and/or method of API Requests in a given
          period which may be set out from time to time on the MAERSK website or separately notified to you in
          writing. MAERSK also reserves the right to implement a payment plan for your continued use of the API, as
          well as where your usage exceeds certain limits.
        </p>
        <p>
          You shall not use the API for any application that replicates or attempts to replace the essential user
          experience of the Service or use the API to create a Product which functions substantially the same as the
          API or utilise any MAERSK data in any way that means you are effectively circumventing making an API Request
          or a third party making an API Request. Notwithstanding the foregoing, you shall not have the right to
          resell, share or otherwise commercial exploit any data and content accessed or received through the
          Products, Services and/or APIs with any third party, unless separately agreed in writing with Maersk.
        </p>
      </LegalSection>

      <LegalSection title="5. References to MAERSK and Implementation">
        <p>
          You agree to ensure that any references to MAERSK and/or the functions provided by the API in your Product,
          or in any other material to be seen by end users and potential end users shall follow the guidelines as
          published on the MAERSK website. You will also ensure all end users are subject to terms and conditions
          which are not inconsistent or less restrictive with the terms of this API Licence Agreement and enforce the
          same.
        </p>
      </LegalSection>

      <LegalSection title="6. Intellectual Property">
        <p>
          The API, the MAERSK Services, any and all content, documentation, code, data and related materials made
          available through the API, any and all data and information collected and/or derived from the MAERSK Service
          and all intellectual property rights in, to, derived from and connected with all of the foregoing, including
          comments and suggestions received, are and shall at all times remain the sole and exclusive property of
          MAERSK and use thereof by MAERSK will be at the full discretion of MAERSK.
        </p>
        <p>
          Except as expressly stated herein, this Agreement does not grant you any rights to, or in, patents,
          copyrights, database rights, trade names, trademarks (whether registered or unregistered and whether future
          or existing), or any other rights or licences in respect of the Intellectual Property, MAERSK's website,
          the API and the material published on it.
        </p>
        <p>
          You grant MAERSK a worldwide, non-exclusive, non-assignable and non-transferable licence to display your
          trade names, trade marks, service marks, logos and domain names to promote or advertise your use of the
          API. MAERSK may, without your consent, publicly refer to you, orally or in writing, as a licensee of the
          API. MAERSK may also publish your name and logo on its Service, in press releases, and in promotional
          materials without additional consent or notice to you.
        </p>
      </LegalSection>

      <LegalSection title="7. Credentials">
        <p>
          You agree to keep any username, password, API key or other credentials (the "Credentials") utilised to
          access the API secret and confidential at all times and you shall only create one set of Credentials and
          ensure that no third party shall access the API utilising your Credentials. In the event that you suspect
          that any third party may be making use of your Credentials, you shall immediately inform MAERSK of this fact
          and provide all reasonable assistance to MAERSK in relation to any subsequent investigation or other
          activities undertaken by MAERSK as a result. In addition you must immediately redact and replace the API key
          in case this is compromised.
        </p>
      </LegalSection>

      <LegalSection title="8. Data Privacy">
        <p>
          When a call is made to the API via your application credentials, MAERSK will receive the following
          information: content of the API call, timestamp and the IP address from which the call was made. MAERSK
          shall process any Personal Data it receives through the API in line with the General Data Protection
          Regulation (EU) 2016/679 and later amendments and its Privacy Policy. You agree to make the MAERSK Privacy
          Policy readily available to the users of your Products.
        </p>
      </LegalSection>

      <LegalSection title="9. Exclusion of Warranties">
        <p>
          The API is provided "as-is" without warranty of any kind. Except to the extent required by applicable law,
          MAERSK disclaims all warranties, whether express or implied, regarding the API, including without limitation
          any and all implied warranties of merchantability, accuracy, results of use, reliability, fitness for a
          particular purpose, title, interference with quiet enjoyment, and non-infringement of third-party rights.
          In addition, MAERSK disclaims any warranty that licensee's use of the API will be uninterrupted or error
          free.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of Liability">
        <p>
          Nothing within this Agreement shall act to limit or exclude MAERSK's liability arising from fraud or
          fraudulent misrepresentation or death or personal injury caused by MAERSK's gross negligence. MAERSK's
          maximum liability (whether under tort or contract) to you or any third party for any loss or damage suffered
          by you as a result of or in connection with your use of (or inability to use or access) the API including
          loss of profits, loss of or corruption to data, computer failure or malfunction, interruption to business
          or any other special, indirect, incidental or consequential damages even if MAERSK has been advised of the
          possibility of such loss or damages and whether or not such loss or damages are foreseeable shall be the
          greater of USD 1,000 or 50% of the total API fees (if applicable) paid in the twelve (12) month period
          immediately preceding the event giving rise to the claim (or the first claim where there is a series of
          claims attributable to the same cause).
        </p>
      </LegalSection>

      <LegalSection title="11. Indemnity">
        <p>
          You agree that your use of the API is solely under your control and at your direction, subject to
          compliance with the terms of this Agreement. You agree to hereby indemnify and hold harmless MAERSK and its
          employees, directors, officers and consultants from any and all claims, damages, liabilities, costs and
          fees (including reasonable legal fees) arising from: (i) your use of the API or from the use of the API by
          any third party making use of your Credentials; or (ii) the use of any of your Products by any third party
          or end user.
        </p>
      </LegalSection>

      <LegalSection title="12. Term and Termination">
        <p>
          This Agreement shall continue until terminated as set forth in this section. MAERSK may terminate this
          Agreement at any time. Any termination of this Agreement shall also terminate the licence granted
          hereunder. Upon termination of this Agreement for any reason, you shall immediately cease using or accessing
          the API and immediately delete any MAERSK Data from your Products and systems. Sections 5, 6, 7, 8 and 9
          together with any other provisions required for the interpretation or enforcement of such sections shall
          survive termination of this Agreement.
        </p>
        <p>
          Should MAERSK choose to pause or restrict your use of the API at any time, this shall not affect the
          validity of these Terms, which shall continue to apply until this agreement is expressly terminated by
          MAERSK in accordance with this Clause 12.
        </p>
      </LegalSection>

      <LegalSection title="13. General">
        <p>
          This Agreement, and any disputes arising from or relating to the interpretation thereof (including
          non-contractual disputes), shall be governed by Danish law and shall be subject to the exclusive
          jurisdiction of the Danish Courts. Any amendment to this Agreement must be made in writing and signed by
          both parties. If any provision of this Agreement shall be found by any court or administrative body of
          competent jurisdiction to be invalid or unenforceable, such invalidity or unenforceability shall not affect
          the other provisions of this Agreement which shall remain in full force and effect.
        </p>
        <p>
          In no event will any delay, failure or omission (in whole or in part) in enforcing, exercising or pursuing
          any right, power, privilege, claim or remedy conferred by or arising under this Agreement or by law, be
          deemed to be or construed as a waiver of that or any other right, power, privilege, claim or remedy in
          respect of the circumstances in question, or operate so as to bar the enforcement of that, or any other
          right, power, privilege, claim or remedy, in any other instance at any time or times subsequently.
        </p>
        <p>
          You shall not, without the prior written consent of MAERSK, assign at law or in equity (including by way of a
          charge or declaration of trust), sub-license or deal in any other manner with this Agreement or any rights
          under this Agreement, or sub-contract any or all of its obligations under this Agreement, or purport to do
          any of the same. Any purported assignment in breach of this section shall confer no rights on the purported
          assignee.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}