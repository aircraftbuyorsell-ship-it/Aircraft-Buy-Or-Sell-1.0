/**
 * Strict documentation requirements for ATI scoring.
 * Points are ONLY awarded when:
 * 1. Documentation is uploaded and verified, OR
 * 2. Explicitly marked "not applicable" with justification
 * 
 * Missing documentation = 0 points for that dimension
 */

export const REQUIRED_DOCUMENTS = {
  documentation: [
    { name: "Logbook (complete)", description: "Full aircraft logbook records", critical: true },
    { name: "Title/Deed", description: "Aircraft ownership certificate", critical: true },
    { name: "Airworthiness Certificate", description: "Current airworthiness documentation", critical: true },
    { name: "Registration Certificate", description: "FAA registration (Form 1500 or equivalent)", critical: true },
    { name: "Damage History", description: "Accident/incident history disclosure", critical: true },
  ],
  technical: [
    { name: "Annual Inspection Records", description: "Recent annual inspection reports", critical: true },
    { name: "AD Compliance Log", description: "Airworthiness Directive compliance proof", critical: true },
    { name: "Maintenance Records", description: "Service/repair documentation (last 5 years)", critical: true },
    { name: "Engine Overhaul Documentation", description: "Major overhaul certificates & logs", critical: false },
  ],
  transparency: [
    { name: "Engine Compression Test", description: "Recent compression check results", critical: true },
    { name: "Oil Analysis Report", description: "Engine oil analysis (last 100 hrs)", critical: false },
    { name: "TBO Documentation", description: "Proof of TBO calculation & remaining life", critical: true },
  ],
  transaction_ready: [
    { name: "Avionics Logbook", description: "Avionics installation & maintenance records", critical: false },
    { name: "TSO/STC Certificates", description: "Technical Standard Order approvals", critical: false },
  ],
  storage_exposure: [
    { name: "Storage Location Documentation", description: "Proof of current hangar/storage", critical: false },
  ],
  config_clarity: [
    { name: "Aircraft Configuration Sheet", description: "Current equipment list (W&B)", critical: true },
    { name: "STC/Modification List", description: "All modifications & their approval docs", critical: true },
  ],
  market_readiness: [
    { name: "Photos (exterior/interior/panel)", description: "High-quality aircraft photos", critical: false },
    { name: "Recent Annual Inspection", description: "Annual inspection within 12 months", critical: true },
  ],
};

export const SCORING_RULES = {
  documentation: {
    noEvidence: "If no files uploaded AND not marked 'not applicable' → 0 points",
    pending: "If files uploaded but not verified → max 8 points",
    verified: "If files verified by admin → full 15 points",
    notApplicable: "If marked 'not applicable' with clear reason → proceed to evaluation",
  },
  general: {
    missing: "Missing or vague data must lower the score",
    noInput: "If no user input provided, cap at 7 points",
    conservative: "Always err on the side of caution",
  },
};

/**
 * Check if documentation for a dimension is sufficient
 * @param {string} dimensionKey - The dimension key
 * @param {number} evidenceCount - Number of evidence files uploaded
 * @param {Object} answers - User answers for the dimension
 * @returns {Object} - { sufficient: boolean, reason: string, score: number }
 */
export function checkDocumentationSufficiency(dimensionKey, evidenceCount = 0, answers = {}) {
  // Non-documentation dimensions don't have strict upload requirements
  if (dimensionKey !== "documentation") {
    return { sufficient: true, reason: "General dimension - no strict upload requirement" };
  }

  const hasEvidence = evidenceCount > 0;
  const isNotApplicable = answers?.documentation_status === "not_applicable" && answers?.not_applicable_reason;
  const isVerified = answers?.verification_status === "verified";

  if (!hasEvidence && !isNotApplicable) {
    return {
      sufficient: false,
      reason: "No documentation uploaded and not marked as 'not applicable'",
      score: 0,
    };
  }

  if (hasEvidence && !isVerified) {
    return {
      sufficient: true,
      reason: "Documentation uploaded but not yet verified",
      score: Math.min(8, evidenceCount * 2),
    };
  }

  if (isVerified) {
    return {
      sufficient: true,
      reason: "Documentation verified",
      score: 15,
    };
  }

  if (isNotApplicable) {
    return {
      sufficient: true,
      reason: `Marked not applicable: ${answers.not_applicable_reason}`,
      score: 10, // Partial credit for justified N/A
    };
  }

  return { sufficient: true, reason: "Documentation complete", score: 15 };
}