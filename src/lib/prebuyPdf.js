import { jsPDF } from 'jspdf';

export async function exportPreBuyPdf(report) {
  const doc = new jsPDF(); let y = 48;
  const page = () => { if (y > 270) { doc.addPage(); y = 20; } };
  const heading = title => { page(); doc.setTextColor(11,18,32); doc.setFontSize(13); doc.text(title, 14, y); doc.setDrawColor(212,160,23); doc.line(14, y + 2, 196, y + 2); y += 10; };
  const text = value => { page(); doc.setTextColor(45,45,45); doc.setFontSize(9); const lines = doc.splitTextToSize(String(value || 'Data unavailable'), 180); doc.text(lines, 14, y); y += lines.length * 5 + 4; };
  doc.setFillColor(11,18,32); doc.rect(0,0,210,38,'F'); doc.setTextColor(212,160,23); doc.setFontSize(9); doc.text('ABOS INSPECTION WORKSPACE',14,13); doc.setTextColor(255,255,255); doc.setFontSize(19); doc.text(`Pre-Buy Report · ${report.aircraft?.registration || ''}`,14,25); doc.setFontSize(8); doc.text(`${report.report_id} · Version ${report.version} · ${report.verification_status}`,14,33);
  heading('Aircraft & Inspection'); text(`${report.aircraft?.year || ''} ${report.aircraft?.make || ''} ${report.aircraft?.model || ''}\nSerial: ${report.aircraft?.serial_number || 'Data unavailable'}\nInspection date: ${report.inspection_date || ''}\nFinalized: ${report.finalized_at || ''}`);
  heading('Executive Summary'); text(report.executive_summary); heading('Risk Assessment'); text(report.risk_assessment); heading('Recommendation'); text(`${report.decision_guidance}\n${report.recommended_next_actions || ''}`);
  heading('Findings');
  for (const finding of report.findings || []) { page(); doc.setFontSize(10); doc.setTextColor(11,18,32); doc.text(`${finding.severity?.toUpperCase()} · ${finding.category} · ${finding.title}`,14,y); y += 6; text(`${finding.description || ''}\nAction: ${finding.recommended_action || '—'}\nInspector: ${finding.inspector_comments || '—'}\nSeller response: ${finding.seller_response || '—'}`); }
  const photos = (report.media || []).filter(m => String(m.type).startsWith('image/')).slice(0, 8);
  if (photos.length) { heading('Photo Evidence'); for (const photo of photos) { try { const blob = await fetch(photo.url).then(r => r.blob()); const data = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(blob); }); if (y > 205) { doc.addPage(); y = 20; } doc.addImage(data, blob.type.includes('png') ? 'PNG' : 'JPEG', 14, y, 80, 55); doc.setFontSize(8); doc.text(photo.name || 'Inspection photo', 14, y + 60); y += 68; } catch {} } }
  heading('Inspector Certification'); text(`${report.inspector_signature?.name || 'Unsigned'}\nCertificate: ${report.inspector_signature?.certificate || 'Not provided'}\nSigned: ${report.inspector_signature?.signed_at || '—'}`);
  heading('Audit History'); (report.audit_history || []).forEach(a => text(`${a.timestamp} · ${a.actor_name} · ${a.event}${a.details ? ` · ${a.details}` : ''}`));
  doc.save(`${report.report_id}-v${report.version}.pdf`);
}