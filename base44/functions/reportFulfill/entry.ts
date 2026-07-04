import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { createMimeMessage } from 'npm:mimetext@3.0.27';

// After Stripe payment: verify session → generate ATI Report PDF → email via Gmail.
// Idempotent: already-delivered requests return delivered=true without re-sending.

function normalizeReg(input) {
  const clean = String(input || '').trim().toUpperCase().replace(/^N/, '');
  return clean ? `N${clean}` : '';
}

function buildReportPDF({ reg, faa, passport, engineSpec }) {
  const doc = new jsPDF();
  const AMBER = [245, 194, 66];
  const INK = [11, 18, 32];

  // Header band
  doc.setFillColor(...INK);
  doc.rect(0, 0, 210, 42, 'F');
  doc.setTextColor(...AMBER);
  doc.setFontSize(9);
  doc.text('ABOS — AIRCRAFT TRANSPARENCY INDEX', 14, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(`ATI Report — ${reg}`, 14, 26);
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(`Generated ${new Date().toISOString().slice(0, 10)} · Digital Twin v1`, 14, 35);

  let y = 54;
  doc.setTextColor(20, 20, 20);

  const section = (title) => {
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(title.toUpperCase(), 14, y);
    doc.setDrawColor(...AMBER);
    doc.setLineWidth(0.8);
    doc.line(14, y + 2, 196, y + 2);
    y += 10;
  };
  const row = (label, value) => {
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(label, 14, y);
    doc.setTextColor(20, 20, 20);
    doc.text(String(value ?? 'Data unavailable'), 80, y);
    y += 7;
    if (y > 270) { doc.addPage(); y = 20; }
  };

  section('ATI Score');
  row('Total Score', passport?.ati_total != null ? `${passport.ati_total} / 120` : 'Not yet scored');
  row('Rating', passport?.score_label || '—');

  section('FAA Registry');
  row('Registration', reg);
  row('Serial Number', faa?.serial_number);
  row('Year of Manufacture', faa?.year_mfr);
  row('Registered Owner', faa?.name);
  row('Location', [faa?.city, faa?.state].filter(Boolean).join(', ') || null);
  row('Registration Status', faa?.status_code === 'V' ? 'Valid' : faa?.status_code);
  row('Airworthiness Date', faa?.air_worth_date);
  row('Registration Expiry', faa?.expiration_date);
  row('ICAO Hex (Mode-S)', faa?.mode_s_hex);

  section('Engine');
  if (engineSpec) {
    row('Manufacturer', engineSpec.manufacturer);
    row('Model', engineSpec.model_name);
    row('TBO', engineSpec.tbo_hours ? `${engineSpec.tbo_hours} hrs` : null);
    row('Horsepower', engineSpec.hp);
    row('Fuel Type', engineSpec.fuel_type);
  } else {
    row('Engine Data', faa?.engine_mfr ? `${faa.engine_mfr} ${faa.engine_model || ''}`.trim() : 'Engine spec not mapped');
  }

  if (passport) {
    section('Dimension Scores (0–15 each)');
    row('Documentation & Records', passport.documentation);
    row('Maintenance History', passport.technical);
    row('Engine Condition', passport.transparency);
    row('Avionics Package', passport.transaction_ready);
    row('Operational History', passport.usage_mission);
    row('Storage & Climate', passport.storage_exposure);
    row('Configuration Clarity', passport.config_clarity);
    row('Transaction Readiness', passport.market_readiness);

    if (passport.ai_summary) {
      section('Summary');
      const lines = doc.splitTextToSize(passport.ai_summary, 180);
      doc.setFontSize(10);
      doc.setTextColor(20, 20, 20);
      doc.text(lines, 14, y);
      y += lines.length * 6 + 4;
    }

    if (Array.isArray(passport.data_gaps) && passport.data_gaps.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      section('Data Gaps');
      for (const gap of passport.data_gaps) {
        doc.setFontSize(9);
        doc.setTextColor(120, 80, 0);
        doc.text(`· ${gap}`, 14, y);
        y += 6;
        if (y > 275) { doc.addPage(); y = 20; }
      }
    }
  }

  // Disclaimer footer
  if (y > 245) { doc.addPage(); y = 20; }
  y += 6;
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  const disclaimer = doc.splitTextToSize(
    'This report is a documentation and data-completeness assessment. It is NOT a pre-purchase inspection, airworthiness certification, or investment advice. Data is aggregated from FAA registry, ADS-B networks and ABOS records; ABOS does not independently verify all data points. Always consult a certified A&P mechanic before any transaction. © ABOS s.r.o.',
    182
  );
  doc.text(disclaimer, 14, y);

  return doc.output('arraybuffer');
}

async function sendReportEmail(base44, { email, reg, pdfBytes }) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

  const msg = createMimeMessage();
  msg.setSender({ name: 'ABOS Aircraft Intelligence', addr: 'me' });
  msg.setRecipient(email);
  msg.setSubject(`Your ATI Aircraft Report — ${reg}`);
  msg.addMessage({
    contentType: 'text/html',
    data: `<div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="color:#0B1220">Your ATI Report for ${reg} is ready</h2>
      <p>Thank you for your purchase. The full Aircraft Transparency Index report is attached as a PDF.</p>
      <p><strong>Want more?</strong> Create a free ABOS account to get report history, change alerts on this aircraft, and buyer tools.</p>
      <p style="color:#888;font-size:12px">ABOS s.r.o. · Aircraft Transparency Index · This report is not a pre-purchase inspection.</p>
    </div>`,
  });
  // Chunked base64 encoding (spread on large arrays overflows the call stack)
  const bytes = new Uint8Array(pdfBytes);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  }
  msg.addAttachment({
    filename: `ATI-Report-${reg}.pdf`,
    contentType: 'application/pdf',
    data: btoa(binary),
  });

  const raw = btoa(msg.asRaw()).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail send failed: ${err.slice(0, 200)}`);
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.session_id || '').trim();
    if (!sessionId) return Response.json({ error: 'session_id required' }, { status: 400 });

    const svc = base44.asServiceRole.entities;

    // Find the request by session
    const requests = await svc.ReportRequest.filter({ stripe_session_id: sessionId }, '-created_date', 1);
    const request = requests[0];
    if (!request) return Response.json({ error: 'Report request not found' }, { status: 404 });

    // Idempotency
    if (request.status === 'delivered') {
      return Response.json({ ok: true, delivered: true, already: true });
    }

    // Verify payment with Stripe (source of truth — never trust client)
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed', payment_status: session.payment_status }, { status: 402 });
    }

    await svc.ReportRequest.update(request.id, { status: 'paid' });

    const reg = normalizeReg(request.registration);
    const nLookup = reg.replace(/^N/, '');

    // Gather report data
    const [faaRecs, passports] = await Promise.all([
      svc.FAAAircraft.filter({ n_number: nLookup }, '-created_date', 1),
      svc.ATIPassport.filter({ registration: reg }, '-created_date', 1),
    ]);
    const faa = faaRecs[0] || null;
    const passport = passports[0] || null;
    let engineSpec = null;
    if (passport?.engine_spec_id) {
      try { engineSpec = await svc.EngineSpec.get(passport.engine_spec_id); } catch (_) { /* skip */ }
    }

    // Generate + send
    const pdfBytes = buildReportPDF({ reg, faa, passport, engineSpec });
    try {
      await sendReportEmail(base44, { email: request.email, reg, pdfBytes });
    } catch (mailErr) {
      await svc.ReportRequest.update(request.id, {
        status: 'failed',
        delivery_error: mailErr.message.slice(0, 490),
      });
      return Response.json({ error: `PDF generated but email delivery failed: ${mailErr.message}` }, { status: 500 });
    }

    await svc.ReportRequest.update(request.id, {
      status: 'delivered',
      pdf_sent_at: new Date().toISOString(),
    });

    return Response.json({ ok: true, delivered: true, email: request.email, registration: reg });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});