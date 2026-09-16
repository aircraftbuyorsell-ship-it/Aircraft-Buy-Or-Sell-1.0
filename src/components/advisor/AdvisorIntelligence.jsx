import { ShieldCheck, Wrench, FileCheck2, Radar, ScrollText, TrendingUp, LockKeyhole, AlertTriangle, ShoppingBag } from "lucide-react";
import AdvisorSectionCard from "./AdvisorSectionCard";
import AdvisorInsufficientData from "./AdvisorInsufficientData";

function Row({ label, value, source }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#102033]/[0.06] py-2 last:border-0">
      <dt className="flex items-center gap-1.5 text-xs text-[#102033]/45">
        {label}
        {source && <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase ${/engine ?spec|ati card|licensed|marketplace/i.test(source) ? "border-[#c99635]/40 bg-[#c99635]/10 text-[#a87925]" : "border-[#102033]/10 bg-[#102033]/[0.03] text-[#102033]/45"}`}>{source}</span>}
      </dt>
      <dd className="text-right text-xs font-semibold">{value ?? "—"}</dd>
    </div>
  );
}

export default function AdvisorIntelligence({ data, unlocked }) {
  const ac = data?.aircraft || {};
  const comp = data?.compliance_intelligence || {};
  const act = data?.activity_intelligence || {};
  const traffic = data?.traffic || {};
  const filings = data?.registry_filings || null;
  const premium = data?.premium || {};
  const fs = ac.field_sources || {};
  const insufficient = data?.data_sufficiency === "insufficient";

  return (
    <div className="space-y-4">
      {insufficient && <AdvisorInsufficientData missing={data?.missing_public_fields} />}

      <AdvisorSectionCard title="Registry Evidence" source={data?.origin_label} icon={ShieldCheck}>
        <dl>
          <Row label="Registration" value={ac.registration} />
          <Row label="Make / Model" value={[ac.make, ac.model].filter(Boolean).join(" ") || null} source={fs.make} />
          <Row label="Year" value={ac.year} source={fs.year} />
          <Row label="Serial Number" value={ac.serial_number} source={fs.serial_number} />
          <Row label="Status" value={ac.status} source={fs.status} />
          <Row label="State / Country" value={[ac.state, ac.country].filter(Boolean).join(", ") || null} />
          <Row label="Mode-S Hex" value={ac.mode_s_hex} source={fs.mode_s_hex} />
          <Row label="Airworthiness Date" value={ac.air_worth_date} source={fs.air_worth_date} />
          <Row label="Cert Issue Date" value={ac.cert_issue_date} source={fs.cert_issue_date} />
          <Row label="Registration Expiry" value={ac.expiration_date} source={fs.expiration_date} />
        </dl>
      </AdvisorSectionCard>

      <AdvisorSectionCard title="Engine" source={fs.engine_mfr || null} icon={Wrench} locked={!unlocked}>
        <dl>
          <Row label="Manufacturer" value={ac.engine_mfr} source={fs.engine_mfr} />
          <Row label="Model" value={ac.engine_model} source={fs.engine_model} />
          <Row label="Type" value={ac.engine_type} />
          <Row label="Horsepower" value={ac.horsepower} />
          <Row label="Thrust" value={ac.thrust} />
          <Row label="TBO (hrs)" value={ac.engine_tbo_hours} source={fs.engine_tbo_hours} />
        </dl>
      </AdvisorSectionCard>

      <AdvisorSectionCard title="Compliance — ADs & STCs" source="FAA AD/STC" icon={FileCheck2} locked={!unlocked}>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#fbfaf7] p-3">
            <div className="text-[10px] font-bold uppercase text-[#102033]/45">Airworthiness Directives</div>
            <div className="mt-1 text-xl font-black">{comp.ad_count ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-[#fbfaf7] p-3">
            <div className="text-[10px] font-bold uppercase text-[#102033]/45">STCs</div>
            <div className="mt-1 text-xl font-black">{comp.stc_count ?? "—"}</div>
          </div>
        </div>
        {comp.note && <p className="mt-3 text-xs text-muted-foreground">{comp.note}</p>}
        {comp.ads?.length > 0 && (
          <div className="mt-3 max-h-32 space-y-1.5 overflow-auto">
            {comp.ads.slice(0, 8).map((ad) => (
              <div key={ad.number} className="flex items-start gap-2 rounded-lg border border-[#102033]/8 bg-white px-3 py-1.5 text-[10px]">
                <span className="font-mono font-bold text-[#b98427]">{ad.number}</span>
                <span className="text-[#102033]/60">{ad.title}</span>
              </div>
            ))}
          </div>
        )}
      </AdvisorSectionCard>

      <AdvisorSectionCard title="Activity — ADS-B & OpenSky" source={act.open_sky_metadata ? "OpenSky" : (traffic.sightings ? "Live Traffic" : null)} icon={Radar} locked={!unlocked}>
        <dl>
          <Row label="Last Time in Air" value={data?.last_time_in_air || "No ADS-B evidence"} source={data?.last_time_in_air ? "ADS-B" : null} />
          <Row label="Activity Status" value={act.status === "ACTIVITY_EVIDENCE" ? "Activity evidence found" : "No activity observed"} />
          <Row label="Historical Flights (ADS-B.lol)" value={act.historical_flight_count ?? "Unavailable"} />
          <Row label="Last Live Sighting" value={traffic.last_seen} />
          {act.open_sky_metadata && (
            <>
              <Row label="OpenSky Manufacturer" value={act.open_sky_metadata.manufacturer} />
              <Row label="OpenSky Model" value={act.open_sky_metadata.model} />
              <Row label="OpenSky Serial" value={act.open_sky_metadata.serial_number} />
            </>
          )}
        </dl>
        {act.historical_flights_locked && (
          <div className="mt-2 rounded-lg bg-[#fbfaf7] px-3 py-2 text-[10px] text-[#102033]/45">Full flight history available with the Full Intelligence Report.</div>
        )}
      </AdvisorSectionCard>

      {filings && (
        <AdvisorSectionCard title="FAA Registry Filings" source="FAA Filing Signals" icon={ScrollText} locked={!unlocked}>
          <dl>
            <Row label="Bill of Sale filings" value={filings.bill_of_sale_count} />
            <Row label="Security Agreements" value={filings.security_agreement_count} />
            <Row label="Releases" value={filings.release_count} />
            <Row label="Total Documents" value={filings.total_documents} />
            <Row label="Latest Filing" value={filings.latest_filing} />
          </dl>
        </AdvisorSectionCard>
      )}

      <AdvisorSectionCard title="NTSB Damage History" source={data?.damage_history?.available ? "NTSB" : null} icon={AlertTriangle} locked={!unlocked}>
        {data?.damage_history?.available ? (
          <>
            <div className="mb-2 text-xs font-semibold text-[#102033]/55">{data.damage_history.count} event{data.damage_history.count === 1 ? "" : "s"} on record</div>
            <div className="max-h-40 space-y-2 overflow-auto">
              {data.damage_history.events.map((ev) => (
                <div key={ev.event_id} className="rounded-lg border border-[#102033]/8 bg-white px-3 py-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#b98427]">{ev.ntsb_number || ev.event_id}</span>
                    <span className="text-[#102033]/45">{ev.event_date}</span>
                  </div>
                  <div className="mt-1 text-[#102033]/65"><b>{ev.event_type}</b>{ev.damage ? ` · ${ev.damage}` : ""}{ev.city || ev.state ? ` · ${[ev.city, ev.state].filter(Boolean).join(", ")}` : ""}</div>
                  {ev.probable_cause && <div className="mt-1 text-[#102033]/45">Cause: {ev.probable_cause}</div>}
                  {ev.source_url && <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[#0A3C75] underline">NTSB report ↗</a>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700"><ShieldCheck className="h-4 w-4" /> No NTSB event evidence is available in the connected records. This does not confirm a damage-free history.</div>
        )}
      </AdvisorSectionCard>

      <AdvisorSectionCard title="Service Bulletins" source={data?.service_bulletins?.source || null} icon={FileCheck2} locked={!unlocked}>
        {data?.service_bulletins?.available ? (
          <>
            <div className="mb-2 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#fbfaf7] p-3">
                <div className="text-[10px] font-bold uppercase text-[#102033]/45">Status</div>
                <div className="mt-1 text-sm font-black capitalize">{String(data.service_bulletins.status).replace(/_/g, " ")}</div>
              </div>
              <div className="rounded-xl bg-[#fbfaf7] p-3">
                <div className="text-[10px] font-bold uppercase text-[#102033]/45">Bulletins</div>
                <div className="mt-1 text-xl font-black">{data.service_bulletins.count}</div>
              </div>
            </div>
            {data.service_bulletins.items?.length > 0 && (
              <div className="max-h-32 space-y-1.5 overflow-auto">
                {data.service_bulletins.items.slice(0, 8).map((sb, i) => (
                  <div key={sb.number || i} className="flex items-start gap-2 rounded-lg border border-[#102033]/8 bg-white px-3 py-1.5 text-[10px]">
                    <span className="font-mono font-bold text-[#b98427]">{sb.number}</span>
                    <span className="text-[#102033]/60">{sb.title}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl bg-[#fbfaf7] px-4 py-3 text-xs text-[#102033]/55">No service bulletin review on file. Upload engine/logbook records to enable SB cross-check.</div>
        )}
      </AdvisorSectionCard>

      <AdvisorSectionCard title="Public Sale Evidence" source={data?.marketplace_evidence ? "Web Search" : null} icon={ShoppingBag} locked={!unlocked}>
        {data?.marketplace_evidence?.listings?.length > 0 ? (
          <>
            <div className="mb-2 text-xs text-[#102033]/55">{data.marketplace_evidence.search_summary || `${data.marketplace_evidence.listings.length} public listing(s) found.`}</div>
            <div className="space-y-2">
              {data.marketplace_evidence.listings.map((l, i) => (
                <div key={i} className="rounded-lg border border-[#102033]/8 bg-white px-3 py-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0A3C75]">{l.marketplace_or_group_name}</span>
                    {l.asking_price && <span className="font-mono font-bold text-[#b98427]">{l.asking_price}</span>}
                  </div>
                  {l.summary && <div className="mt-1 text-[#102033]/65">{l.summary}</div>}
                  <div className="mt-1 flex flex-wrap gap-2 text-[#102033]/45">
                    {l.listed_date && <span>Listed {l.listed_date}</span>}
                    {l.location && <span>· {l.location}</span>}
                  </div>
                  {l.url && <a href={l.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[#0A3C75] underline">View listing ↗</a>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-[#fbfaf7] px-4 py-3 text-xs text-[#102033]/55">{data?.marketplace_evidence?.search_summary || "Public listing search has not returned evidence for this registration."}</div>
        )}
      </AdvisorSectionCard>

      <AdvisorSectionCard title="Valuation" source={unlocked ? "ATI Full Report" : null} icon={TrendingUp} locked={!unlocked}>
        {unlocked && premium.data?.valuation ? (
          <dl>
            <Row label="OMVM Value" value={premium.data.valuation.mid ? `$${Number(premium.data.valuation.mid).toLocaleString()}` : null} />
            <Row label="Range Low" value={premium.data.valuation.low ? `$${Number(premium.data.valuation.low).toLocaleString()}` : null} />
            <Row label="Range High" value={premium.data.valuation.high ? `$${Number(premium.data.valuation.high).toLocaleString()}` : null} />
            <Row label="Verdict" value={premium.data.valuation.verdict} />
          </dl>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-[#fbfaf7] px-4 py-3 text-xs text-[#102033]/55">
            <LockKeyhole className="h-4 w-4 text-[#b98427]" />
            Valuation, ATI score and deal analysis unlock with the Full Intelligence Report.
          </div>
        )}
      </AdvisorSectionCard>
    </div>
  );
}