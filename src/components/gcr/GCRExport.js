import { jsPDF } from "jspdf";

/**
 * Exports a Global Compliance Report as a professional PDF.
 * Includes ABOS header, watermark, score, three-panel details, flags, and recommendations.
 */
export function exportGCRPDF({ report, registration, userName }) {
  const doc = new jsPDF();
  const reg = registration || report?.registration || "—";
  const score = report?.score ?? "—";
  const label = report?.score_label || "—";

  // ── Header (dark bar) ──
  doc.setFillColor(4, 6, 10);
  doc.rect(0, 0, 210, 38, "F");
  doc.setTextColor(245, 194, 66);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ABOS MarketSpace", 105, 16, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("Global Compliance Report", 105, 25, { align: "center" });
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB")}  ·  User: ${userName || "—"}`,
    105, 32, { align: "center" }
  );

  // ── Score section ──
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Registration:`, 20, 50);
  doc.setFont("helvetica", "bold");
  doc.text(reg, 60, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Compliance Score:", 20, 58);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(score >= 75 ? 34 : score >= 40 ? 245 : 239, score >= 75 ? 197 : 194, score >= 75 ? 94 : 68);
  doc.text(`${score}/100`, 60, 58);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`(${label})`, 90, 58);

  // ── Three panels ──
  let y = 72;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Triple-Check Validation", 20, y);
  y += 6;

  const subs = report?.sub_scores || {};
  const panels = [
    { title: "Registry Validity", ...subs.registry },
    { title: "Visual Evidence", ...subs.visual },
    { title: "Flight Activity", ...subs.traffic },
  ];

  panels.forEach((p) => {
    if (!p) return;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`${p.title}:`, 25, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(`${p.score || 0}/${p.max || "—"}`, 70, y);
    y += 5;
  });

  // ── Registry details ──
  y += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Registry Data", 20, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const rd = report?.registry_data || {};
  const regRows = [
    ["Source", report?.registry_source],
    ["Make", rd.make],
    ["Model", rd.model],
    ["Country", rd.country],
    ["Status", rd.status_code],
    ["Mode S Hex", rd.mode_s_hex],
  ];
  regRows.forEach(([l, v]) => {
    if (!v) return;
    doc.text(`${l}:`, 25, y);
    doc.text(String(v), 60, y);
    y += 4;
  });

  // ── Traffic data ──
  y += 3;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Flight Activity Data", 20, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const td = report?.traffic_data || {};
  if (td.flight_count_last_180_days != null) {
    doc.text(`Flights (180d): ${td.flight_count_last_180_days}`, 25, y); y += 4;
  }
  if (td.avg_altitude != null) {
    doc.text(`Avg Altitude: ${td.avg_altitude} ft`, 25, y); y += 4;
  }
  if (td.last_seen_at) {
    doc.text(`Last Seen: ${new Date(td.last_seen_at).toLocaleDateString("en-GB")}`, 25, y); y += 4;
  }

  // ── Integrity flags ──
  y += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Integrity Flags", 20, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const flags = report?.integrity_flags || [];
  if (flags.length === 0) {
    doc.setTextColor(34, 197, 94);
    doc.text("No integrity issues detected", 25, y);
    y += 4;
  } else {
    doc.setTextColor(239, 68, 68);
    flags.forEach((f) => {
      doc.text(`• ${f.replace(/_/g, " ")}`, 25, y);
      y += 4;
    });
  }

  // ── Recommendations ──
  y += 4;
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("Recommendations", 20, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  (report?.recommendations || []).forEach((r) => {
    const lines = doc.splitTextToSize(`• ${r}`, 170);
    doc.text(lines, 25, y);
    y += lines.length * 4;
  });

  // ── Footer ──
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "ABOS MarketSpace · Global Compliance Report · This report is generated from public registry, photo, and traffic data.",
    105, 290, { align: "center" }
  );
  doc.text("It does not constitute a pre-purchase inspection or airworthiness certification.", 105, 294, { align: "center" });

  doc.save(`GCR-${reg.replace(/[^A-Z0-9]/gi, "_")}.pdf`);
}

/**
 * Exports a Global Compliance Report as a .docx (plain text blob).
 */
export function exportGCRDocx({ report, registration, userName }) {
  const reg = registration || report?.registration || "—";
  const lines = [];

  lines.push("GLOBAL COMPLIANCE REPORT");
  lines.push("ABOS MarketSpace — Aircraft Buy Or Sell");
  lines.push("=".repeat(60));
  lines.push(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
  lines.push(`User: ${userName || "—"}`);
  lines.push(`Registration: ${reg}`);
  lines.push("");

  lines.push(`COMPLIANCE SCORE: ${report?.score ?? "—"}/100 (${report?.score_label || "—"})`);
  lines.push("-".repeat(40));

  const subs = report?.sub_scores || {};
  lines.push(`Registry Validity: ${subs.registry?.score || 0}/${subs.registry?.max || 40}`);
  lines.push(`Visual Evidence:   ${subs.visual?.score || 0}/${subs.visual?.max || 25}`);
  lines.push(`Flight Activity:    ${subs.traffic?.score || 0}/${subs.traffic?.max || 35}`);
  lines.push("");

  lines.push("REGISTRY DATA");
  lines.push("-".repeat(40));
  const rd = report?.registry_data || {};
  lines.push(`Source: ${report?.registry_source || "—"}`);
  if (rd.make) lines.push(`Make: ${rd.make}`);
  if (rd.model) lines.push(`Model: ${rd.model}`);
  if (rd.country) lines.push(`Country: ${rd.country}`);
  if (rd.status_code) lines.push(`Status: ${rd.status_code}`);
  if (rd.mode_s_hex) lines.push(`Mode S Hex: ${rd.mode_s_hex}`);
  lines.push("");

  lines.push("FLIGHT ACTIVITY DATA");
  lines.push("-".repeat(40));
  const td = report?.traffic_data || {};
  lines.push(`Flights (180d): ${td.flight_count_last_180_days ?? "—"}`);
  lines.push(`Avg Altitude: ${td.avg_altitude ?? "—"} ft`);
  lines.push(`Last Seen: ${td.last_seen_at ? new Date(td.last_seen_at).toLocaleDateString("en-GB") : "—"}`);
  lines.push("");

  lines.push("INTEGRITY FLAGS");
  lines.push("-".repeat(40));
  const flags = report?.integrity_flags || [];
  if (flags.length === 0) {
    lines.push("No integrity issues detected.");
  } else {
    flags.forEach((f) => lines.push(`• ${f.replace(/_/g, " ")}`));
  }
  lines.push("");

  lines.push("RECOMMENDATIONS");
  lines.push("-".repeat(40));
  (report?.recommendations || []).forEach((r) => lines.push(`• ${r}`));
  lines.push("");

  lines.push("=".repeat(60));
  lines.push("ABOS MarketSpace · Global Compliance Report");
  lines.push("This report does not constitute a pre-purchase inspection or airworthiness certification.");

  const blob = new Blob([lines.join("\n")], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GCR-${reg.replace(/[^A-Z0-9]/gi, "_")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}