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
};

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
    for (const doc of documents) {
      const mockData = MOCK_EXTRACTIONS[doc.document_type] || {
        confidence_score: Math.floor(Math.random() * 20) + 65,
      };

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

    // Ownership Score: registration + airworthiness + insurance
    const regConf = extractedData.find(d => d.type === 'registration_cert')?.confidence_score || 0;
    const awConf = extractedData.find(d => d.type === 'airworthiness_cert')?.confidence_score || 0;
    const insConf = extractedData.find(d => d.type === 'insurance')?.confidence_score || 0;
    const ownershipScore = hasRegistration ? Math.round(regConf * 0.4 + (hasAirworthiness ? awConf * 0.35 : 0) + (hasInsurance ? insConf * 0.25 : 0)) : 0;

    // Document Confidence: average of all document confidence scores
    const allConfidences = extractedData.map(d => d.confidence_score).filter(Boolean);
    const docConfidence = allConfidences.length > 0
      ? Math.round(allConfidences.reduce((s, c) => s + c, 0) / allConfidences.length)
      : 0;

    // Overall: weighted average
    const totalDocs = documents.length;
    const weightComplete = Math.min(totalDocs / 6, 1); // fraction of 6 doc types present
    const overallScore = Math.round(
      identityScore * 0.30 +
      ownershipScore * 0.40 +
      docConfidence * 0.15 +
      weightComplete * 100 * 0.15
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
      ownership: { score: ownershipScore, factors: { registration_cert: hasRegistration, airworthiness: hasAirworthiness, insurance: hasInsurance } },
      documents: { score: docConfidence, total_processed: documents.length },
      overall: overallScore,
      completeness: `${totalDocs}/6 document types`,
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});