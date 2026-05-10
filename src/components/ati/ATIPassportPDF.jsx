import jsPDF from "jspdf";

const DIMS = [
  { key: "documentation", label: "Documentation & Records", desc: "Logbooks, airframe records" },
  { key: "technical", label: "Maintenance History", desc: "AD compliance, service trail" },
  { key: "transparency", label: "Engine Condition", desc: "SMOH, TBO, compressions" },
  { key: "transaction_ready", label: "Avionics Package", desc: "GPS/WAAS, ADS-B, autopilot" },
  { key: "usage_mission", label: "Operational History", desc: "Private vs training vs charter" },
  { key: "storage_exposure", label: "Storage & Climate", desc: "Hangared, dry vs outdoor" },
  { key: "config_clarity", label: "Configuration Clarity", desc: "Specs, STCs, mods" },
  { key: "market_readiness", label: "Market Readiness", desc: "Annual freshness, completeness" },
];

function parseList(str) {
  if (!str) return [];
  return str.split("\n").filter(Boolean);
}

function scoreColor(score) {
  if (score >= 108) return [15, 122, 86];
  if (score >= 90) return [24, 95, 165];
  if (score >= 72) return [212, 160, 23];
  if (score >= 54) return [166, 124, 0];
  if (score >= 36) return [205, 127, 50];
  return [192, 57, 43];
}

function scoreLabel(score) {
  if (score >= 108) return "EXCEPTIONAL";
  if (score >= 90) return "STRONG BUY";
  if (score >= 72) return "FAIR";
  if (score >= 54) return "CAUTION";
  if (score >= 36) return "RED FLAGS";
  return "AVOID";
}

export async function exportATIPassportPDF({ listing, passport, card }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 14;
  const contentW = W - margin * 2;
  let y = 0;

  // ── HEADER BAND ──────────────────────────────────────────────
  doc.setFillColor(11, 45, 91); // #0B2D5B navy
  doc.rect(0, 0, W, 38, "F");

  // Logo text
  doc.setTextColor(232, 168, 58); // #E8A83A gold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("ABOS · AVIATION INTRAZONE", margin, 11);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ATI SCORE CARD", margin, 22);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 195, 215);
  doc.text("Aircraft Transparency Index  ·  Verified Deal Intelligence", margin, 29);

  // Issue date top-right
  doc.setFontSize(7);
  doc.setTextColor(180, 195, 215);
  const dateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  doc.text(`Issued: ${dateStr}`, W - margin, 11, { align: "right" });

  if (card?.public_card_code) {
    doc.setFontSize(7);
    doc.text(`Card: ${card.public_card_code}`, W - margin, 17, { align: "right" });
  }

  y = 46;

  // ── AIRCRAFT IDENTITY ─────────────────────────────────────────
  doc.setFillColor(247, 244, 239);
  doc.roundedRect(margin, y, contentW, 22, 3, 3, "F");

  doc.setTextColor(26, 24, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(`${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`, margin + 5, y + 10);

  if (listing.registration) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 101, 96);
    doc.text(listing.registration, margin + 5, y + 17);
  }

  // Asking price top-right of identity band
  if (listing.asking_price) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(11, 45, 91);
    doc.text(`$${listing.asking_price.toLocaleString()}`, W - margin - 5, y + 10, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(170, 164, 156);
    doc.text("Asking Price", W - margin - 5, y + 17, { align: "right" });
  }

  y += 30;

  // ── ATI SCORE CIRCLE (drawn as filled circle + text) ─────────────────
  const scoreVal = passport.ati_total || 0;
  const [cr, cg, cb] = scoreColor(scoreVal);
  const circX = margin + 22;
  const circY = y + 18;
  const circR = 16;

  // Outer ring background
  doc.setDrawColor(240, 237, 230);
  doc.setLineWidth(2);
  doc.circle(circX, circY, circR);

  // Filled arc approximation — filled circle with color
  doc.setFillColor(cr, cg, cb);
  doc.circle(circX, circY, circR - 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(String(scoreVal), circX, circY + 1.5, { align: "center" });
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.text("/ 120", circX, circY + 6.5, { align: "center" });

  // Score label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(cr, cg, cb);
  doc.text(scoreLabel(scoreVal), circX + circR + 5, circY - 3);

  // Badges
  let bx = circX + circR + 5;
  doc.setFontSize(7);
  if (passport.deal_radar_eligible) {
    doc.setFillColor(212, 160, 23);
    doc.roundedRect(bx, circY + 2, 28, 5.5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("DEAL RADAR", bx + 14, circY + 6.5, { align: "center" });
    bx += 31;
  }
  if (passport.co_ownership_viable) {
    doc.setFillColor(24, 95, 165);
    doc.roundedRect(bx, circY + 2, 28, 5.5, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.text("CO-OWNERSHIP", bx + 14, circY + 6.5, { align: "center" });
  }

  y += 44;

  // ── OMVM VALUATION ROW ────────────────────────────────────────
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(212, 160, 23, 0.3);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 18, 2, 2, "FD");

  const valItems = [
    { label: "Asking Price", value: listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : "—", color: [26, 24, 20] },
    { label: "Market Estimate (OMVM)", value: passport.omvm_value ? `$${passport.omvm_value.toLocaleString()}` : "—", color: [26, 24, 20] },
    { label: "Discount vs Market", value: passport.discount_pct != null ? `${passport.discount_pct >= 0 ? "▼" : "▲"} ${Math.abs(passport.discount_pct)}%` : "—", color: passport.discount_pct >= 0 ? [15, 122, 86] : [192, 57, 43] },
    { label: "Deal Rating", value: (passport.deal_label || "—").toUpperCase(), color: [212, 160, 23] },
  ];
  const colW = contentW / 4;
  valItems.forEach((item, i) => {
    const cx = margin + colW * i + colW / 2;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(170, 164, 156);
    doc.text(item.label, cx, y + 6, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...item.color);
    doc.text(item.value, cx, y + 13, { align: "center" });
  });

  y += 25;

  // ── ATI DIMENSIONS ────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(212, 160, 23);
  doc.text("SCORE BREAKDOWN  ·  8 MODULES × 15 POINTS", margin, y);
  y += 5;

  DIMS.forEach((dim, i) => {
    const val = passport[dim.key] ?? 0;
    const pct = val / 15;
    const [br, bg, bb] = pct >= 0.8 ? [15, 122, 86] : pct >= 0.6 ? [24, 95, 165] : pct >= 0.4 ? [212, 160, 23] : [192, 57, 43];
    const row = margin;
    const barW = contentW - 30;

    // Zebra bg
    if (i % 2 === 0) {
      doc.setFillColor(250, 248, 244);
      doc.rect(margin, y - 1, contentW, 7, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(26, 24, 20);
    doc.text(dim.label, row + 1, y + 4);

    // Bar track
    doc.setFillColor(230, 228, 224);
    doc.roundedRect(row + 70, y + 1.5, barW - 70, 2.5, 0.5, 0.5, "F");

    // Bar fill
    doc.setFillColor(br, bg, bb);
    doc.roundedRect(row + 70, y + 1.5, (barW - 70) * pct, 2.5, 0.5, 0.5, "F");

    // Score value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(br, bg, bb);
    doc.text(`${val}/15`, W - margin - 1, y + 4.5, { align: "right" });

    y += 8;
  });

  y += 4;

  // ── ANALYSIS SECTION ─────────────────────────────────────────
  if (passport.ai_summary) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(11, 45, 91);
    doc.text("EXECUTIVE SUMMARY", margin, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 101, 96);
    const summaryLines = doc.splitTextToSize(passport.ai_summary, contentW);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4 + 4;
  }

  // ── STRENGTHS / RISKS / RECOMMENDATIONS ─────────────────────
  const sections = [
    { title: "KEY STRENGTHS", items: parseList(passport.strengths), color: [15, 122, 86] },
    { title: "RISK FACTORS", items: parseList(passport.risks), color: [192, 57, 43] },
    { title: "BUYER ACTIONS", items: parseList(passport.recommendations), color: [212, 160, 23] },
  ];

  // Check if we need a new page
  if (y > 210) { doc.addPage(); y = 20; }

  const thirdW = contentW / 3 - 2;
  sections.forEach((sect, idx) => {
    const sx = margin + idx * (thirdW + 3);
    const [r, g, b] = sect.color;

    // Header
    doc.setFillColor(r, g, b);
    doc.roundedRect(sx, y, thirdW, 6, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sect.title, sx + thirdW / 2, y + 4, { align: "center" });

    let iy = y + 9;
    (sect.items.slice(0, 4)).forEach(item => {
      doc.setFillColor(r, g, b);
      doc.circle(sx + 1.5, iy - 0.5, 0.8, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(60, 55, 50);
      const lines = doc.splitTextToSize(item, thirdW - 5);
      doc.text(lines, sx + 4, iy);
      iy += lines.length * 3.5 + 1.5;
    });
  });

  y += 52;

  // ── MISSING DATA ──────────────────────────────────────────────
  const missing = parseList(passport.missing_data);
  if (missing.length > 0 && y < 265) {
    doc.setFillColor(252, 243, 243);
    doc.setDrawColor(192, 57, 43, 0.3);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentW, 8 + missing.length * 5, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(192, 57, 43);
    doc.text("MISSING / UNVERIFIED DATA", margin + 3, y + 5);
    missing.forEach((m, i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(150, 50, 40);
      doc.text(`• ${m}`, margin + 3, y + 10 + i * 5);
    });
    y += 10 + missing.length * 5 + 4;
  }

  // ── FOOTER ───────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const footY = 285;
    doc.setFillColor(11, 45, 91);
    doc.rect(0, footY, W, 12, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(130, 145, 165);
    doc.text("ABOS Aviation IntraZone  ·  Confidential Deal Intelligence  ·  Not a legal appraisal", margin, footY + 5);
    doc.text(`abos.aero  ·  Page ${p} of ${pageCount}`, W - margin, footY + 5, { align: "right" });

    doc.setFontSize(5.5);
    doc.setTextColor(100, 115, 135);
    doc.text("This ATI Score Card is prepared for qualified aviation professionals. All valuations are estimates based on market comparables.", margin, footY + 9);
  }

  // Save
  const filename = `ATI-${listing.registration || listing.make + "-" + listing.model}-${new Date().getFullYear()}.pdf`;
  doc.save(filename);
}