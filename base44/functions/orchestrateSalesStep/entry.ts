import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Sales Pipeline Orchestrator — the "spider" execution engine.
// Actions:
//   execute   — run the mapped backend function for a step (one-click)
//   complete  — manually mark a step complete (with optional notes)
//   skip      — skip a step (with reason)
//   ai_review — run AI document analysis for verification steps (damage, AD/SB, logbook)

const AI_REVIEW_PROMPTS = {
  damage_history: `You are an aviation damage history analyst. Review the provided documents for:
- FAA Form 337 filings (major repairs/alterations)
- Damage event disclosures
- NTSB incident/accident references
- Repair quality and documentation completeness

Provide a structured review:
1. FINDINGS: List each damage event or repair found (or "None identified")
2. RISK_LEVEL: LOW | MODERATE | HIGH
3. RED_FLAGS: Any undocumented repairs or inconsistencies
4. RECOMMENDATION: What the buyer should verify or request before proceeding

Be conservative — missing documentation is a risk, not a clearance.`,

  ad_sb_compliance: `You are an aviation maintenance compliance auditor. Review the provided maintenance records for:
- Airworthiness Directive (AD) compliance — all applicable ADs addressed
- Service Bulletin (SB) status — recurring vs one-time
- Supplemental Type Certificate (STC) documentation
- Compliance dates and signatures

Provide a structured review:
1. ADS_REVIEWED: List each AD found with compliance status (COMPLIANT / NON-COMPLIANT / UNKNOWN)
2. SBS_REVIEWED: List each SB found with status
3. STCS_FOUND: List any STCs documented
4. COMPLIANCE_STATUS: COMPLIANT | PARTIAL | NON-COMPLIANT | UNVERIFIABLE
5. OVERDUE_ITEMS: Any ADs/SBs past due
6. RECOMMENDATION: What needs resolution before sale

Be thorough — unverified compliance is a deal risk.`,

  logbook_review: `You are a senior A&P mechanic reviewing aircraft logbooks. Analyze the provided logbook entries for:
- Entry completeness (are all required fields present?)
- Hour tracking consistency (tach, hobbs, total time)
- Oil change regularity and engine health trends
- Inspection signatures and certifications
- Gaps in the maintenance timeline (missing entries = red flag)

Provide a structured review:
1. COMPLETENESS_SCORE: 0-100
2. ENTRY_COUNT: Number of entries reviewed
3. GAPS_FOUND: List any timeline gaps or missing periods
4. CONSISTENCY: Are hour-tracking methods consistent?
5. RED_FLAGS: Any suspicious entries, erasures, or inconsistencies
6. VERDICT: PASS | REVIEW_RECOMMENDED | FAIL
7. RECOMMENDATION: What the buyer should request clarification on

A gap in logbooks is a major red flag — flag it explicitly.`,
};

function normalizeReg(input) {
  const clean = String(input || '').trim().toUpperCase().replace(/^N/, '');
  return clean ? `N${clean}` : '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { pipelineId, stepId, action, notes, fileUrls } = body;

    if (!pipelineId || !stepId || !action) {
      return Response.json({ error: 'pipelineId, stepId, action required' }, { status: 400 });
    }

    const pipeline = await base44.entities.SalesPipeline.get(pipelineId);
    if (!pipeline) return Response.json({ error: 'Pipeline not found' }, { status: 404 });

    const steps = [...(pipeline.steps || [])];
    const stepIdx = steps.findIndex(s => s.id === stepId);
    if (stepIdx === -1) return Response.json({ error: 'Step not found' }, { status: 404 });

    const step = { ...steps[stepIdx] };

    // ── EXECUTE: run the mapped backend function ──
    if (action === 'execute') {
      if (!step.function_name) {
        return Response.json({ error: 'Step has no mapped function' }, { status: 400 });
      }

      step.status = 'in_progress';
      steps[stepIdx] = step;
      await base44.entities.SalesPipeline.update(pipelineId, { steps });

      try {
        const payload = {
          registration: pipeline.registration,
          listingId: pipeline.listing_id,
          passportId: pipeline.passport_id,
          pipelineId,
        };

        const result = await base44.functions.invoke(step.function_name, payload);
        const data = result?.data || result;

        step.status = 'completed';
        step.result_data = data;
        step.ai_notes = typeof data?.ai_summary === 'string' ? data.ai_summary : (typeof data?.narrative?.summary === 'string' ? data.narrative.summary : 'Function executed successfully');
        step.completed_at = new Date().toISOString();
        step.completed_by = user.id;
        step.blocked_reason = null;
      } catch (fnErr) {
        step.status = 'blocked';
        step.blocked_reason = fnErr?.message || 'Function execution failed';
        steps[stepIdx] = step;
        await base44.entities.SalesPipeline.update(pipelineId, { steps });
        return Response.json({ ok: false, error: step.blocked_reason, step }, { status: 500 });
      }
    }

    // ── AI_REVIEW: run AI document analysis ──
    else if (action === 'ai_review') {
      if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
        return Response.json({ error: 'fileUrls required for ai_review' }, { status: 400 });
      }

      const promptTemplate = AI_REVIEW_PROMPTS[step.id];
      if (!promptTemplate) {
        return Response.json({ error: `No AI review prompt for step: ${step.id}` }, { status: 400 });
      }

      step.status = 'in_progress';
      steps[stepIdx] = step;
      await base44.entities.SalesPipeline.update(pipelineId, { steps });

      try {
        const llmResult = await base44.integrations.Core.InvokeLLM({
          prompt: `${promptTemplate}

═══ AIRCRAFT CONTEXT ═══
Registration: ${pipeline.registration}
Aircraft: ${pipeline.aircraft_label || 'N/A'}

═══ DOCUMENTS PROVIDED ═══
${fileUrls.length} document(s) attached for review.

Analyze the documents and provide your structured review.`,
          file_urls: fileUrls,
          response_json_schema: {
            type: 'object',
            properties: {
              review_summary: { type: 'string' },
              risk_level: { type: 'string' },
              findings: { type: 'array', items: { type: 'string' } },
              red_flags: { type: 'array', items: { type: 'string' } },
              recommendation: { type: 'string' },
            },
          },
        });

        step.status = 'completed';
        step.result_data = llmResult;
        step.ai_notes = llmResult.review_summary || 'AI review completed';
        step.completed_at = new Date().toISOString();
        step.completed_by = user.id;
        step.blocked_reason = null;

        // Anchor the review report to the vault
        try {
          await base44.entities.VaultDocument.create({
            passport_id: pipeline.passport_id,
            registration: pipeline.registration,
            document_type: `ai_review_${step.id}`,
            title: `AI Review: ${step.label} — ${pipeline.registration}`,
            content: JSON.stringify(llmResult, null, 2),
            uploaded_by: user.id,
          });
        } catch (vaultErr) {
          // Non-blocking — vault save is optional
        }
      } catch (aiErr) {
        step.status = 'blocked';
        step.blocked_reason = aiErr?.message || 'AI review failed';
        steps[stepIdx] = step;
        await base44.entities.SalesPipeline.update(pipelineId, { steps });
        return Response.json({ ok: false, error: step.blocked_reason, step }, { status: 500 });
      }
    }

    // ── COMPLETE: manual completion ──
    else if (action === 'complete') {
      step.status = 'completed';
      step.ai_notes = notes || 'Manually completed';
      step.completed_at = new Date().toISOString();
      step.completed_by = user.id;
      step.blocked_reason = null;
    }

    // ── SKIP ──
    else if (action === 'skip') {
      step.status = 'skipped';
      step.ai_notes = notes || 'Skipped by user';
      step.completed_at = new Date().toISOString();
      step.completed_by = user.id;
    }

    // ── BLOCK ──
    else if (action === 'block') {
      step.status = 'blocked';
      step.blocked_reason = notes || 'Blocked';
    }

    else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    steps[stepIdx] = step;

    // ── Advance pipeline ──
    const nextStep = steps.find(s =>
      s.status === 'pending' &&
      (s.prerequisite_ids || []).every(pid =>
        steps.some(ps => ps.id === pid && (ps.status === 'completed' || ps.status === 'skipped'))
      )
    );

    const completedCount = steps.filter(s => s.status === 'completed' || s.status === 'skipped').length;
    const progress = Math.round((completedCount / steps.length) * 100);
    const allDone = !steps.some(s => s.status === 'pending' || s.status === 'in_progress');

    await base44.entities.SalesPipeline.update(pipelineId, {
      steps,
      current_step_id: nextStep?.id || null,
      progress_pct: progress,
      status: allDone ? 'completed' : 'active',
    });

    return Response.json({
      ok: true,
      step,
      nextStep,
      progress,
      pipelineStatus: allDone ? 'completed' : 'active',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});