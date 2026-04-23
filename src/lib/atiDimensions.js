/**
 * ATI Wizard dimension definitions. Each dimension is scored 0-15
 * by the LLM using the structured inputs collected here.
 */
export const ATI_DIMENSIONS = [
  {
    key: "documentation",
    label: "Documentation Completeness",
    desc: "Logbooks, airframe/engine records, damage history",
    fields: [
      { key: "logbooks_complete", label: "Logbooks complete & present", type: "select",
        options: ["Yes, all original", "Partial / some gaps", "Missing or reconstructed"] },
      { key: "damage_history", label: "Damage history disclosed", type: "select",
        options: ["No damage on record", "Minor / documented repairs", "Major damage / unknown"] },
      { key: "records_notes", label: "Additional notes on records", type: "textarea" },
    ],
    evidenceLabel: "Upload logbook scans / records",
  },
  {
    key: "technical",
    label: "Maintenance Traceability",
    desc: "AD compliance, 337s, squawks",
    fields: [
      { key: "ad_compliance", label: "AD compliance status", type: "select",
        options: ["All current", "Minor overdue", "Multiple overdue / unknown"] },
      { key: "last_annual_date", label: "Last annual inspection date", type: "date" },
      { key: "known_squawks", label: "Known squawks / open items", type: "textarea" },
    ],
    evidenceLabel: "Upload AD list / Form 337s",
  },
  {
    key: "transparency",
    label: "Engine Health",
    desc: "SMOH vs TBO, compressions, oil use",
    fields: [
      { key: "smoh_hours", label: "SMOH (hours since major overhaul)", type: "number" },
      { key: "tbo_hours", label: "TBO (manufacturer recommended)", type: "number" },
      { key: "compressions", label: "Latest compression readings (#/80)", type: "text",
        placeholder: "e.g. 76/78/74/76" },
      { key: "oil_consumption", label: "Oil consumption", type: "select",
        options: ["Normal", "Elevated", "High / unknown"] },
    ],
    evidenceLabel: "Upload borescope / compression report",
  },
  {
    key: "transaction_ready",
    label: "Avionics Quality",
    desc: "ADS-B, WAAS GPS, autopilot, glass",
    fields: [
      { key: "ads_b_out", label: "ADS-B Out compliant", type: "select",
        options: ["Yes", "No", "Unknown"] },
      { key: "waas_gps", label: "WAAS GPS installed", type: "select",
        options: ["Yes", "No"] },
      { key: "autopilot", label: "Autopilot", type: "select",
        options: ["Modern digital", "Analog / legacy", "None"] },
      { key: "glass_panel", label: "Glass panel / PFD", type: "select",
        options: ["Full glass", "Partial", "Steam gauges"] },
      { key: "avionics_list", label: "Other avionics", type: "textarea" },
    ],
    evidenceLabel: "Upload avionics photos / invoices",
  },
  {
    key: "usage_mission",
    label: "Usage / Mission Risk",
    desc: "Private vs training vs charter",
    fields: [
      { key: "usage_type", label: "Primary usage", type: "select",
        options: ["Private / owner-flown", "Corporate", "Flight school / training", "Charter / commercial"] },
      { key: "hours_per_year", label: "Average hours per year", type: "number" },
      { key: "usage_notes", label: "Additional usage notes", type: "textarea" },
    ],
    evidenceLabel: "Upload supporting docs (optional)",
  },
  {
    key: "storage_exposure",
    label: "Storage & Exposure",
    desc: "Hangared vs outdoor, climate",
    fields: [
      { key: "storage_type", label: "Storage", type: "select",
        options: ["Hangared", "Shade / covered", "Tied down outdoor"] },
      { key: "climate", label: "Climate exposure", type: "select",
        options: ["Dry inland", "Moderate", "Coastal / humid"] },
      { key: "location", label: "Based at (airport / region)", type: "text" },
    ],
    evidenceLabel: "Upload hangar / ramp photos",
  },
  {
    key: "config_clarity",
    label: "Configuration Clarity",
    desc: "STCs, mods, spec consistency",
    fields: [
      { key: "stcs", label: "STCs installed", type: "textarea" },
      { key: "mods", label: "Modifications", type: "textarea" },
      { key: "spec_consistency", label: "Specs match documented config", type: "select",
        options: ["Fully consistent", "Minor discrepancies", "Significant discrepancies"] },
    ],
    evidenceLabel: "Upload STC paperwork",
  },
  {
    key: "market_readiness",
    label: "Market Readiness",
    desc: "Annual freshness, photos, pre-buy",
    fields: [
      { key: "fresh_annual", label: "Fresh annual", type: "select",
        options: ["Yes (within 60 days)", "Recent (within 6 months)", "Older"] },
      { key: "pre_buy_accepted", label: "Pre-buy inspection allowed", type: "select",
        options: ["Yes, encouraged", "Yes, at buyer's cost", "No / restricted"] },
      { key: "photos_quality", label: "Listing photos quality", type: "select",
        options: ["Professional", "Good amateur", "Poor / few"] },
    ],
    evidenceLabel: "Upload current listing photos",
  },
];