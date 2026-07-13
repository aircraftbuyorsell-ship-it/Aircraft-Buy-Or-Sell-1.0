import { jsPDF } from "jspdf";

export function downloadBillOfSalePdf(draft) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const line = (label, value, y) => { doc.setFont("helvetica", "bold"); doc.text(label, 46, y); doc.setFont("helvetica", "normal"); doc.text(String(value || "—"), 220, y); };
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text("AIRCRAFT BILL OF SALE — REVIEW DRAFT", 46, 48);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text("Prepared for manual review against FAA AC Form 8050-2 (12-2024). This is not a signed or legally validated filing.", 46, 66);
  doc.setFontSize(11);
  const rows = [
    ["Consideration", draft.consideration_amount ? `$${Number(draft.consideration_amount).toLocaleString("en-US")} ${draft.currency || "USD"}` : ""],
    ["Registration", draft.registration_number ? `N${draft.registration_number}` : ""], ["Manufacturer", draft.manufacturer], ["Model", draft.model], ["Serial number", draft.serial_number],
    ["Date of sale", [draft.sale_day, draft.sale_month, draft.sale_year].filter(Boolean).join(" ")], ["Purchaser", draft.purchaser_name],
    ["Purchaser address", [draft.purchaser_street, draft.purchaser_apt_suite, draft.purchaser_city, draft.purchaser_state, draft.purchaser_zip].filter(Boolean).join(", ")],
    ["Purchaser phone", draft.purchaser_phone], ["Purchaser email", draft.purchaser_email], ["Dealer certificate", draft.dealer_certificate_number],
    ["Seller", draft.seller_name], ["Seller title", draft.seller_title],
  ];
  rows.forEach(([label, value], index) => line(label, value, 102 + index * 26));
  doc.setFont("helvetica", "bold"); doc.text("Seller signature(s):", 46, 470); doc.line(170, 472, 520, 472);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("Signature intentionally left blank. Ink or valid digital signature must be provided by every required seller.", 46, 489);
  doc.setTextColor(170, 40, 40); doc.text(`${draft.warnings?.length || 0} warning(s) remain. User review is required before signature or filing.`, 46, 520);
  doc.save(`FAA-8050-2-draft-${draft.registration_number || "aircraft"}.pdf`);
}