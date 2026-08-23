import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { buildDraft, resolveAircraft, validateDraft } from "@/lib/billOfSale";

const EMPTY = { status: "draft", currency: "USD", owner_count: 1, signature_count: 0, chain_of_ownership_urls: [], field_confidence: {}, warnings: [], price_confirmed: false, sale_date_confirmed: false, purchaser_name_confirmed: false, user_reviewed: false };
const LEGAL_FIELDS = ["purchaser_name", "seller_name", "serial_number"];
export default function useBillOfSaleDraft() {
  const [draft, setDraft] = useState(EMPTY), [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState("");
  useEffect(() => { const id = new URLSearchParams(window.location.search).get("draft_id"); if (!id) return; setLoading(true); base44.entities.BillOfSaleDraft.get(id).then(setDraft).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const warnings = useMemo(() => validateDraft(draft), [draft]);
  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value, field_confidence: { ...current.field_confidence, [field]: { source: "Manual input", level: LEGAL_FIELDS.includes(field) ? "manual_required" : "likely", score: LEGAL_FIELDS.includes(field) ? .3 : .75 } } }));
  const setValue = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const lookup = async (mode, query) => { setLoading(true); setError(""); try { const result = await resolveAircraft(mode, query); setDraft((current) => ({ ...current, ...buildDraft(result) })); } catch (e) { setError(e?.response?.data?.error || e.message); } finally { setLoading(false); } };
  const save = async (status = draft.status) => { setSaving(true); setError(""); try { const { id, created_date, updated_date, created_by_id, ...fields } = draft; const payload = { ...fields, status, warnings }; const saved = id ? await base44.entities.BillOfSaleDraft.update(id, payload) : await base44.entities.BillOfSaleDraft.create(payload); setDraft(saved); if (!id) window.history.replaceState({}, "", `${window.location.pathname}?draft_id=${saved.id}`); return saved; } catch (e) { setError(e.message); throw e; } finally { setSaving(false); } };
  return { draft: { ...draft, warnings }, setDraft, update, setValue, lookup, save, loading, saving, error };
}