import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ─── Mock OCR data templates ────────────────────────────────────
const MOCK_EXTRACTIONS = {
  passport: {
    extracted_name: "John A. Smith",
    extracted_document_number: "P12345678",
    extracted_expiry_date: "2028-05-15",
    extracted_country: "United States",
    confidence_score: 94,
  },
  pilot_license: {
    extracted_name: "John A. Smith",
    extracted_document_number: "PL-2854961",
    extracted_country: "FAA",
    confidence_score: 91,
  },
  registration_cert: {
    extracted_name: "SkyVentures LLC",
    extracted_registration: "N9169Q",
    extracted_serial: "172S11023",
    extracted_country: "United States",
    confidence_score: 88,
  },
  airworthiness_cert: {
    extracted_registration: "N9169Q",
    extracted_serial: "172S11023",
    extracted_country: "FAA",
    confidence_score: 85,
  },
  insurance: {
    extracted_name: "Global Aviation Insurance Co.",
    extracted_document_number: "GAIC-2026-88421",
    extracted_expiry_date: "2027-01-01",
    confidence_score: 82,
  },
  logbook: {
    extracted_registration: "N9169Q",
    extracted_serial: "172S11023",
    confidence_score: 75,
  },
  ownership_proof: {
    extracted_name: "John A. Smith",
    extracted_registration: "N9169Q",
    extracted_country: "United States",
    confidence_score: 92,
  },
};

function normalize(value) {
  return (value || "").toUpperCase().trim().replace(/[\s-]/g, "");
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return Response.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await base44.entities.ATIVerifySession.get(sessionId);

    // Update session status
    await base44.asServiceRole.entities.ATIVerifySession.update(sessionId, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    });

    // Get all documents for this session
    const documents = await base44.asServiceRole.entities.ATIVerifyDocument.filter(
      { session: sessionId },
      '-created_date',
      50
    );

    // Process each document — mock OCR extraction
    const extractedData = [];
    let ownershipVerified = false;

    for (const doc of documents) {
      const mockData = MOCK_EXTRACTIONS[doc.document_type] || {
        confidence_score: Math.floor(Math.random() * 20) + 65,
      };

      // ── Ownership Proof: compare extracted fields with session ──
      if (doc.document_type === "ownership_proof") {
        const extractedName = mockData.extracted_name || "";
        const extractedReg = mockData.extracted_registration || "";

        const sessionName = normalize(session.seller_name);
        const sessionReg = normalize(session.aircraft_registration);

        const nameMatch = normalize(extractedName) === sessionName;
        const regMatch = normalize(extractedReg) === sessionReg;

        if (nameMatch && regMatch) {
          // Auto-verify — fields match
          await base44.asServiceRole.entities.ATIVerifyDocument.update(doc.id, {
            ocr_status: 'completed',
            ocr_raw_text: `[SIMULATED OCR] Document: ${doc.title}\nType: ${doc.document_type}\nExtracted at: ${new Date().toISOString()}\nConfidence: ${mockData.confidence_score}%\nOwnership match: NAME ✓ REG ✓`,
            ...mockData,
            ownership_verified: true,
          });

          // Update session
          await base44.asServiceRole.entities.ATIVerifySession.update(sessionId, {
            ownership_verified_at: new Date().toISOString(),
          });

          // Update linked ATI Card
          try {
            const cards = await base44.asServiceRole.entities.ATICard.filter(
              { aircraft_registration: session.aircraft_registration },
              '-created_date',
              1
            );
            if (cards.length > 0) {
              await base44.asServiceRole.entities.ATICard.update(cards[0].id, {
                owner_verified: true,
                owner_verified_at: new Date().toISOString(),
              });
            }
          } catch (_) {
            // Card not found — non-blocking
          }

          ownershipVerified = true;
        } else {
          // Mismatch — flag for review
          await base44.asServiceRole.entities.ATIVerifyDocument.update(doc.id, {
            ocr_status: 'review_required',
            ocr_raw_text: `[SIMULATED OCR] Document: ${doc.title}\nType: ${doc.document_type}\nExtracted at: ${new Date().toISOString()}\nConfidence: ${mockData.confidence_score}%\nOwnership MISMATCH: Name='${extractedName}' vs '${session.seller_name}' | Reg='${extractedReg}' vs '${session.aircraft_registration}'`,
            ...mockData,
            ownership_verified: false,
          });
        }

        extractedData.push({ type: doc.document_type, ...mockData, ownership_verified });
        continue;
      }

      // ── Standard document processing ──
      await base44.asServiceRole.entities.ATIVerifyDocument.update(doc.id, {
        ocr_status: 'completed',
        ocr_raw_text: `[SIMULATED OCR] Document: ${doc.title}\nType: ${doc.document_type}\nExtracted at: ${new Date().toISOString()}\nConfidence: ${mockData.confidence_score}%`,
        ...mockData,
      });

      extractedData.push({ type: doc.document_type, ...mockData });
    }

    // Calculate ATI scores
    const hasPassport = extractedData.some(d => d.type === 'passport');
    const hasPilotLicense = extractedData.some(d => d.type === 'pilot_license');
    const hasRegistration = extractedData.some(d => d.type === 'registration_cert');
    const hasAirworthiness = extractedData.some(d => d.type === 'airworthiness_cert');
    const hasInsurance = extractedData.some(d => d.type === 'insurance');

    // Identity Score: based on passport + pilot license
    const passportConf = extractedData.find(d => d.type === 'passport')?.confidence_score || 0;
    const licenseConf = extractedData.find(d => d.type === 'pilot_license')?.confidence_score || 0;
    const identityScore = hasPassport ? Math.round((passportConf * 0.6 + (hasPilotLicense ? licenseConf * 0.4 : 0))) : hasPilotLicense ? Math.round(licenseConf * 0.6) : 0;

    // Ownership Score: registration + airworthiness + insurance + ownership_proof bonus
    const regConf = extractedData.find(d => d.type === 'registration_cert')?.confidence_score || 0;
    const awConf = extractedData.find(d => d.type === 'airworthiness_cert')?.confidence_score || 0;
    const insConf = extractedData.find(d => d.type === 'insurance')?.confidence_score || 0;
    const ownershipProofVerified = extractedData.some(d => d.type === 'ownership_proof' && d.ownership_verified);
    const ownershipScore = hasRegistration ? Math.round(regConf * 0.4 + (hasAirworthiness ? awConf * 0.35 : 0) + (hasInsurance ? insConf * 0.25 : 0)) : 0;

    // Document Confidence: average of all document confidence scores
    const allConfidences = extractedData.map(d => d.confidence_score).filter(Boolean);
    const docConfidence = allConfidences.length > 0
      ? Math.round(allConfidences.reduce((s, c) => s + c, 0) / allConfidences.length)
      : 0;

    // Overall: weighted average — ownership_proof bonus adds 5 points if matched
    const totalDocs = documents.length;
    const weightComplete = Math.min(totalDocs / 7, 1); // fraction of 7 doc types present (incl ownership_proof)
    const ownershipBonus = ownershipProofVerified ? 5 : 0;
    const overallScore = Math.round(
      identityScore * 0.28 +
      ownershipScore * 0.35 +
      docConfidence * 0.15 +
      weightComplete * 100 * 0.12 +
      ownershipBonus * 0.10
    );

    // Determine verification status
    let verificationStatus = 'review_required';
    if (overallScore >= 85 && hasPassport && hasRegistration) {
      verificationStatus = 'verified';
    } else if (overallScore < 50) {
      verificationStatus = 'rejected';
    }

    const scoreDetails = JSON.stringify({
      identity: { score: identityScore, factors: { passport: hasPassport, pilot_license: hasPilotLicense } },
      ownership: { score: ownershipScore, factors: { registration_cert: hasRegistration, airworthiness: hasAirworthiness, insurance: hasInsurance, ownership_proof_verified: ownershipProofVerified } },
      documents: { score: docConfidence, total_processed: documents.length },
      overall: overallScore,
      completeness: `${totalDocs}/7 document types`,
      ownership_proof: { verified: ownershipProofVerified },
    });

    // Save score
    await base44.entities.ATIVerifyScore.create({
      session: sessionId,
      identity_score: identityScore,
      ownership_score: ownershipScore,
      document_confidence_score: docConfidence,
      overall_score: overallScore,
      score_details: scoreDetails,
    });

    // Update session with final status
    await base44.asServiceRole.entities.ATIVerifySession.update(sessionId, {
      status: 'completed',
      verification_status: verificationStatus,
      completed_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      documents_processed: documents.length,
      identity_score: identityScore,
      ownership_score: ownershipScore,
      document_confidence_score: docConfidence,
      overall_score: overallScore,
      verification_status: verificationStatus,
      ownership_verified: ownershipVerified,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});