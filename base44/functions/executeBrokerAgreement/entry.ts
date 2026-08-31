import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Broker Agreement lifecycle: initiate → broker signs → owner signs → active.
// E-signature = full name + User ID + UTC timestamp recorded in an audit object,
// rendered onto the regenerated PDF (DocuSign-style flow, in-app).

function normalizeReg(input) {
  const clean = String(input || '').trim().toUpperCase().replace(/^N/, '');
  return clean ? `N${clean}` : '';
}

function buildAgreementPDF(a) {
  const doc = new jsPDF();
  const AMBER = [245, 194, 66];
  const INK = [11, 18, 32];

  doc.setFillColor(...INK);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setTextColor(...AMBER);
  doc.setFontSize(9);
  doc.text('ABOS — OFFICIAL BROKER AGREEMENT', 14, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(`Aircraft Brokerage Agreement — ${a.registration}`, 14, 26);

  let y = 50;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);

  const para = (text) => {
    const lines = doc.splitTextToSize(text, 182);
    doc.text(lines, 14, y);
    y += lines.length * 5.5 + 4;
    if (y > 260) { doc.addPage(); y = 20; }
  };
  const heading = (t) => {
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(t, 14, y);
    doc.setDrawColor(...AMBER);
    doc.line(14, y + 2, 196, y + 2);
    y += 9;
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
  };

  heading('1. PARTIES');
  para(`This Broker Agreement ("Agreement") is entered into between ${a.owner_name || '[Registered Owner]'} ("Owner"), the registered owner of the Aircraft, and ${a.broker_name} (${a.broker_license || 'ABOS Verified Broker'}) ("Broker").`);

  heading('2. AIRCRAFT');
  para(`Registration: ${a.registration} · ${a.aircraft_label || ''}. As identified in the ABOS Digital Twin record and the FAA Civil Aviation Registry.`);

  heading('3. ENGAGEMENT & EXCLUSIVITY');
  para(`Owner grants Broker the exclusive right to market and negotiate the sale of the Aircraft for a period of ${a.exclusivity_days || 90} days from the date of full execution of this Agreement.`);

  heading('4. COMMISSION');
  para(`Upon closing of a sale procured during the exclusivity period, Owner shall pay Broker a commission of ${a.commission_pct || 2}% of the final gross sale price, payable at closing through the ABOS escrow system.`);

  heading('5. TRANSPARENCY & ATI');
  para('Broker agrees to maintain the aircraft ATI Passport (Digital Twin) with accurate, verifiable data. Any material discrepancy discovered during the term must be disclosed in the ATI record within 5 business days.');

  heading('6. ELECTRONIC SIGNATURES');
  para('The parties agree that electronic signatures recorded via the ABOS platform (full name, platform User ID and UTC timestamp) constitute valid and binding signatures under eIDAS (EU) 910/2014 and the U.S. ESIGN Act.');

  // Signature blocks
  if (y > 200) { doc.addPage(); y = 20; }
  y += 8;
  heading('SIGNATURES');

  const sigBlock = (label, sig) => {
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(label, 14, y);
    y += 12;
    doc.setDrawColor(60, 60, 60);
    doc.line(14, y, 100, y);
    if (sig?.signed_at) {
      doc.setFontSize(11);
      doc.setTextColor(...INK);
      doc.setFont(undefined, 'italic');
      doc.text(sig.name || '', 16, y - 2);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Signed electronically · User ID: ${sig.user_id} · ${sig.signed_at}`, 14, y + 5);
    } else {
      doc.setFontSize(8);
      doc.setTextColor(180, 140, 40);
      doc.text('— awaiting signature —', 16, y - 2);
    }
    y += 16;
  };

  sigBlock(`BROKER: ${a.broker_name || ''}`, a.broker_signature);
  sigBlock(`OWNER: ${a.owner_name || ''}`, a.owner_signature);

  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(`ABOS s.r.o. · Agreement ID: ${a.id || 'draft'} · Generated ${new Date().toISOString()}`, 14, 285);

  return doc.output('arraybuffer');
}

async function uploadPdf(base44, bytes, filename) {
  const file = new File([bytes], filename, { type: 'application/pdf' });
  const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });
  return file_url;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ── ACTION: initiate ──
    if (action === 'initiate') {
      const reg = normalizeReg(body.registration);
      if (!reg) return Response.json({ error: 'registration required' }, { status: 400 });

      // Verify caller is an approved broker
      const brokers = await svc.BrokerProfile.filter({ user_id: user.id }, '-created_date', 1);
      const broker = brokers[0];
      if (!broker || broker.verified_status !== 'approved' || broker.is_blocked) {
        return Response.json({ error: 'Approved BrokerProfile required to initiate agreements' }, { status: 403 });
      }

      // Resolve passport + FAA owner data
      const [passports, faaRecs] = await Promise.all([
        svc.ATIPassport.filter({ registration: reg }, '-created_date', 1),
        svc.FAAAircraft.filter({ n_number: reg.replace(/^N/, '') }, '-created_date', 1),
      ]);
      const passport = passports[0];
      const faa = faaRecs[0];
      if (!passport) return Response.json({ error: `No Digital Twin found for ${reg}. Initialize it first.` }, { status: 404 });
      if (passport.broker_agreement_status === 'active') {
        return Response.json({ error: 'This aircraft already has an active broker agreement' }, { status: 409 });
      }

      const aircraftLabel = `${faa?.year_mfr || ''} ${faa?.mfr_mdl_code || ''} ${reg}`.trim();
      const agreement = await svc.BrokerAgreement.create({
        passport_id: passport.id,
        registration: reg,
        aircraft_label: aircraftLabel,
        broker_id: user.id,
        broker_name: broker.full_name,
        broker_email: broker.email,
        broker_license: broker.broker_id,
        owner_name: faa?.name || '',
        owner_email: body.owner_email || '',
        exclusivity_days: body.exclusivity_days || 90,
        commission_pct: body.commission_pct || 2,
        status: 'draft',
      });

      const pdfBytes = buildAgreementPDF({ ...agreement, id: agreement.id });
      const pdfUrl = await uploadPdf(base44, pdfBytes, `Broker-Agreement-${reg}-${agreement.id}.pdf`);
      await svc.BrokerAgreement.update(agreement.id, { pdf_url: pdfUrl });
      await svc.ATIPassport.update(passport.id, { broker_agreement_status: 'pending' });

      return Response.json({ ok: true, agreementId: agreement.id, pdf_url: pdfUrl, status: 'draft' });
    }

    // ── ACTION: sign ──
    if (action === 'sign') {
      const agreementId = body.agreement_id;
      const signedName = String(body.signed_name || '').trim();
      if (!agreementId || !signedName) {
        return Response.json({ error: 'agreement_id and signed_name required' }, { status: 400 });
      }

      const agreement = await svc.BrokerAgreement.get(agreementId);
      if (!agreement) return Response.json({ error: 'Agreement not found' }, { status: 404 });

      const signature = {
        name: signedName,
        user_id: user.id,
        signed_at: new Date().toISOString(),
      };

      const isBroker = agreement.broker_id === user.id;
      const isOwner = agreement.owner_email && agreement.owner_email.toLowerCase() === user.email.toLowerCase();
      if (!isBroker && !isOwner && user.role !== 'admin') {
        return Response.json({ error: 'You are not a party to this agreement' }, { status: 403 });
      }

      const update = {};
      if (isBroker && !agreement.broker_signature?.signed_at) {
        update.broker_signature = signature;
      } else if ((isOwner || user.role === 'admin') && !agreement.owner_signature?.signed_at) {
        update.owner_signature = signature;
      } else {
        return Response.json({ error: 'Your signature is already recorded' }, { status: 409 });
      }

      const merged = { ...agreement, ...update };
      const bothSigned = merged.broker_signature?.signed_at && merged.owner_signature?.signed_at;
      update.status = bothSigned ? 'fully_signed' : 'broker_signed';

      // Regenerate PDF with the signatures rendered
      const pdfBytes = buildAgreementPDF(merged);
      update.pdf_url = await uploadPdf(base44, pdfBytes, `Broker-Agreement-${agreement.registration}-${agreement.id}.pdf`);

      await svc.BrokerAgreement.update(agreementId, update);

      // On full execution: activate broker on the passport
      if (bothSigned && agreement.passport_id) {
        await svc.ATIPassport.update(agreement.passport_id, {
          broker_id: agreement.broker_id,
          broker_agreement_status: 'active',
          agreement_doc_url: update.pdf_url,
          broker_signed_at: merged.broker_signature.signed_at,
          owner_signed_at: merged.owner_signature.signed_at,
        });
        // Bump broker agreement count
        const brokers = await svc.BrokerProfile.filter({ user_id: agreement.broker_id }, '-created_date', 1);
        if (brokers[0]) {
          await svc.BrokerProfile.update(brokers[0].id, {
            agreement_count: (brokers[0].agreement_count || 0) + 1,
          });
        }
      }

      return Response.json({
        ok: true,
        status: update.status,
        pdf_url: update.pdf_url,
        fully_signed: !!bothSigned,
      });
    }

    // ── ACTION: get (agreement detail for viewer) ──
    if (action === 'get') {
      const agreementId = body.agreement_id;
      if (!agreementId) return Response.json({ error: 'agreement_id required' }, { status: 400 });
      const agreement = await svc.BrokerAgreement.get(agreementId);
      if (!agreement) return Response.json({ error: 'Agreement not found' }, { status: 404 });
      const isParty = agreement.broker_id === user.id
        || (agreement.owner_email && agreement.owner_email.toLowerCase() === user.email.toLowerCase())
        || user.role === 'admin';
      if (!isParty) return Response.json({ error: 'Forbidden' }, { status: 403 });
      return Response.json({ ok: true, agreement });
    }

    return Response.json({ error: 'Invalid action. Use: initiate | sign | get' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});