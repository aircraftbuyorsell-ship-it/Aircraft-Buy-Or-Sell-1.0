import { Shield, Copyright, Database, UserCheck } from "lucide-react";

const SECTION_STYLE = "bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 md:p-8";
const H2_STYLE = "flex items-center gap-2 text-[13px] uppercase tracking-[0.15em] font-black text-[#D4A017] mb-4";
const P_STYLE = "text-[14px] leading-relaxed text-white/70 mb-3";

export default function IPNotice() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Intellectual Property & Trademark Notice</h1>
        <p className="text-sm text-white/50">ABOS s.r.o. · Effective date: July 4, 2026 · Version 1.0</p>
      </div>

      <div className="space-y-6">
        {/* Trademarks */}
        <section className={SECTION_STYLE}>
          <h2 className={H2_STYLE}><Copyright className="w-4 h-4" /> 1. Trademarks & Brand Names</h2>
          <p className={P_STYLE}>
            The following names, marks, and logos are trademarks or trade names of <strong className="text-white">ABOS s.r.o.</strong>,
            a company registered in the Czech Republic ("ABOS"), whether or not registered in a given jurisdiction:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-white/70 mb-3">
            <li><strong className="text-white">ABOS™</strong> and <strong className="text-white">ABOS MarketSpace™</strong> — the aviation intelligence and trading platform</li>
            <li><strong className="text-white">ATI™</strong> and <strong className="text-white">Aircraft Transparency Index™</strong> — the 8-dimension aircraft scoring methodology, its scoring rubric, labels, and report formats</li>
            <li><strong className="text-white">ATI Passport™</strong> and <strong className="text-white">ATI Card™</strong> — the aircraft trust document and shareable identity card products</li>
            <li><strong className="text-white">IntraZone™</strong> — the broker CRM and lead intelligence suite</li>
            <li><strong className="text-white">SkyBoss™</strong> — the operational intelligence dashboard</li>
            <li><strong className="text-white">MaxChat™</strong> — the conversational AI assistant</li>
            <li><strong className="text-white">WIZARD™</strong> — the guided listing and scoring workflow</li>
          </ul>
          <p className={P_STYLE}>
            Use of these marks — including in domain names, partner widgets, marketing materials, or derivative
            products — requires the prior written consent of ABOS s.r.o., except for nominative fair use
            (accurately referring to our services).
          </p>
        </section>

        {/* Proprietary works */}
        <section className={SECTION_STYLE}>
          <h2 className={H2_STYLE}><Shield className="w-4 h-4" /> 2. Proprietary Works</h2>
          <p className={P_STYLE}>
            The ATI scoring methodology (including the eight dimensions: documentation, technical, transparency,
            transaction readiness, usage & mission, storage & exposure, configuration clarity, and market
            readiness), the OMVM valuation model, the Digital Twin data architecture, report templates, and all
            platform software, design, and content are the copyrighted works and trade secrets of ABOS s.r.o.
          </p>
          <p className={P_STYLE}>
            ATI scores, reports, and cards are licensed for the recipient's own use. Reproduction, resale, or
            systematic extraction of scores or reports without a written license or partner agreement is prohibited.
          </p>
        </section>

        {/* Third-party data attribution */}
        <section className={SECTION_STYLE}>
          <h2 className={H2_STYLE}><Database className="w-4 h-4" /> 3. Third-Party Data & Attribution</h2>
          <p className={P_STYLE}>
            ABOS aggregates data from public and licensed third-party sources. We respect the intellectual
            property of data providers and disclose our sources:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-white/70 mb-3">
            <li><strong className="text-white">FAA Aircraft Registry</strong> — public U.S. government data (registration, airworthiness, engine reference)</li>
            <li><strong className="text-white">Trade-A-Plane</strong> (accessed via the Piloterr API) — market listing comparables used in valuations and market reports, always labeled "Aggregated market data" with source disclosure</li>
            <li><strong className="text-white">OpenSky Network</strong> — live ADS-B traffic data</li>
            <li><strong className="text-white">adsbdb / PlaneSpotters</strong> — international registry and photo lookups</li>
          </ul>
          <p className={P_STYLE}>
            Third-party trademarks (Trade-A-Plane, Controller, FAA, OpenSky, and others) belong to their
            respective owners. ABOS does not claim ownership of third-party data and does not present it as
            ABOS-originated content. Full source lists for any report are available on request at any time.
          </p>
        </section>

        {/* Owner consent */}
        <section className={SECTION_STYLE}>
          <h2 className={H2_STYLE}><UserCheck className="w-4 h-4" /> 4. Aircraft Owner Consent & Distribution Policy</h2>
          <p className={P_STYLE}>
            ABOS may compute internal, non-public technical indicators for aircraft based on public registry
            data. However:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[14px] text-white/70 mb-3">
            <li>Public sharing, affiliate distribution, and viral referral features for an ATI Card are <strong className="text-white">disabled until the aircraft owner has verified ownership</strong> and consented via the ATI Verify process.</li>
            <li>Aircraft owners may claim their aircraft, correct data, or request removal of a public score at any time via their account or by contacting ABOS.</li>
            <li>Scores derived solely from public registry data are marked as unverified estimates until owner-supplied documentation is reviewed.</li>
          </ul>
          <p className={P_STYLE}>
            This policy exists to protect owners: no one's aircraft is publicly scored or promoted without their
            knowledge and consent.
          </p>
        </section>

        {/* Contact */}
        <section className={SECTION_STYLE}>
          <h2 className={H2_STYLE}><Shield className="w-4 h-4" /> 5. Licensing & Contact</h2>
          <p className={P_STYLE}>
            For trademark licensing, white-label partnerships, data attribution questions, or IP concerns,
            contact ABOS s.r.o. through the platform's support channels or your partner agreement contact.
          </p>
          <p className="text-[12px] text-white/40 mt-4">
            © 2026 ABOS s.r.o. All rights reserved. This notice supplements the Terms of Service and does not
            constitute legal advice.
          </p>
        </section>
      </div>
    </div>
  );
}