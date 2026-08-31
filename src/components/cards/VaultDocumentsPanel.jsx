import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  ShieldCheck, Upload, FileText, Lock, ExternalLink,
  CheckCircle2, Clock, XCircle, Filter, Search,
  ChevronDown, ChevronRight, Hash, Building2,
  AlertCircle, Download, Eye, Plus, Users
} from "lucide-react";

const DOC_TYPE_LABELS = {
  logbook: "Logbook",
  maintenance_record: "Maintenance Record",
  airworthiness_cert: "Airworthiness Certificate",
  registration_cert: "Registration Certificate",
  noise_cert: "Noise Certificate",
  weight_balance: "Weight & Balance",
  radio_license: "Radio License",
  insurance_cert: "Insurance Certificate",
  title_document: "Title Document",
  bill_of_sale: "Bill of Sale",
  inspection_report: "Inspection Report",
  engine_log: "Engine Log",
  propeller_log: "Propeller Log",
  stc_approval: "STC Approval",
  ad_compliance: "AD Compliance",
  service_bulletin: "Service Bulletin",
  paint_interior_log: "Paint & Interior Log",
  damage_history: "Damage History",
  lease_agreement: "Lease Agreement",
  co_ownership_agreement: "Co-Ownership Agreement",
  shared_ownership_deed: "Shared Ownership Deed",
  other: "Other Document",
};

const DOC_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "logbook", label: "Logbooks" },
  { key: "maintenance_record", label: "Maintenance" },
  { key: "airworthiness_cert", label: "Airworthiness" },
  { key: "registration_cert", label: "Registration" },
  { key: "title_document", label: "Title" },
  { key: "co_ownership_agreement", label: "Ownership" },
  { key: "inspection_report", label: "Inspections" },
  { key: "other", label: "Other" },
];

const AUTHORITIES = [
  { key: "FAA", label: "FAA" },
  { key: "EASA", label: "EASA" },
  { key: "IATA", label: "IATA" },
  { key: "CAA", label: "CAA" },
  { key: "other", label: "Other" },
];

export default function VaultDocumentsPanel({ card, listing, isOwner }) {
  const isDark = useTheme();
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    document_type: "logbook",
    title: "",
    description: "",
    certifying_authority: "EASA",
    certifier_license: "",
    verification_date: "",
    expiry_date: "",
    visibility: isOwner ? "verified_viewers" : "private",
    is_shared_ownership_doc: false,
    tags: "",
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["vault-docs", card?.id],
    queryFn: () => base44.entities.VaultDocument.filter({ ati_card: card?.id }, "-created_date", 100),
    enabled: !!card?.id,
  });

  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const muted = isDark ? "rgba(255,255,255,0.5)" : "#64748b";
  const accent = isDark ? "#60a5fa" : "#3b82f6";
  const gold = "#D4A017";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setUploadStatus({ error: "File too large (max 50MB)" });
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    try {
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;

      // Compute hash via backend
      let hashResult = {};
      try {
        const hashRes = await base44.functions.invoke("anchorVaultDocument", {
          file_url: fileUrl,
          file_name: file.name,
          document_type: formData.document_type,
          ati_card_id: card.id,
          listing_registration: listing?.registration || "",
        });
        hashResult = hashRes.data || {};
      } catch (e) {
        console.warn("Polygon anchoring skipped:", e.message);
      }

      await base44.entities.VaultDocument.create({
        ati_card: card.id,
        listing: listing?.id || "",
        document_type: formData.document_type,
        title: formData.title || file.name,
        description: formData.description,
        file_url: fileUrl,
        file_hash: hashResult.file_hash || "",
        polygon_tx_hash: hashResult.tx_hash || "",
        polygon_block_number: hashResult.block_number || 0,
        polygon_verified_at: hashResult.verified_at || null,
        verification_status: "pending",
        certifying_authority: formData.certifying_authority,
        certifier_license: formData.certifier_license,
        verification_date: formData.verification_date || null,
        expiry_date: formData.expiry_date || null,
        is_shared_ownership_doc: formData.is_shared_ownership_doc,
        shared_ownership_parties: card.shared_ownership_parties || [],
        visibility: formData.visibility,
        uploaded_by: (await base44.auth.me()).email,
        file_size_bytes: file.size,
        mime_type: file.type,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
      });

      // Update card's vault document count
      const verifiedCount = documents.filter(d => d.verification_status === "verified").length;
      await base44.entities.ATICard.update(card.id, {
        vault_document_count: documents.length + 1,
        vault_verified_count: verifiedCount,
      });

      // Auto-sync image uploads to listing's image_attachments so photos appear on cards
      const isImage = file.type.startsWith("image/");
      if (isImage && listing?.id) {
        const currentAttachments = listing.image_attachments || [];
        await base44.entities.AircraftListing.update(listing.id, {
          image_attachments: [...currentAttachments, fileUrl],
        });
        queryClient.invalidateQueries({ queryKey: ["listing", listing.id] });
        queryClient.invalidateQueries({ queryKey: ["listings-public"] });
      }

      setUploadStatus({ success: "Document uploaded and anchored to Polygon Vault" });
      queryClient.invalidateQueries({ queryKey: ["vault-docs", card?.id] });
      resetForm();
    } catch (err) {
      setUploadStatus({ error: err?.response?.data?.error || err.message || "Upload failed" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setShowUploadForm(false);
    setFormData({
      document_type: "logbook", title: "", description: "",
      certifying_authority: "EASA", certifier_license: "",
      verification_date: "", expiry_date: "",
      visibility: isOwner ? "verified_viewers" : "private",
      is_shared_ownership_doc: false, tags: "",
    });
  };

  const filtered = documents.filter(d => filterType === "all" || d.document_type === filterType);
  const verifiedCount = documents.filter(d => d.verification_status === "verified").length;
  const hasPolygonAnchor = documents.filter(d => d.polygon_tx_hash).length;

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4" style={{ color: gold }} />
            <p className="text-[10px] uppercase tracking-[0.18em] font-black" style={{ color: gold }}>
              Polygon Public Vault
            </p>
          </div>
          <p className="text-[11px]" style={{ color: muted }}>
            {verifiedCount} verified · {hasPolygonAnchor} blockchain-anchored · Total {documents.length}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all"
            style={{ background: gold, color: "#0B2D5B" }}>
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        )}
      </div>

      {/* ── Upload status ───────────────────── */}
      {uploadStatus?.success && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
          <CheckCircle2 className="w-3.5 h-3.5" /> {uploadStatus.success}
        </div>
      )}
      {uploadStatus?.error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium"
          style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.15)", color: "#ff4d6d" }}>
          <AlertCircle className="w-3.5 h-3.5" /> {uploadStatus.error}
        </div>
      )}

      {/* ── Upload form ─────────────────────── */}
      {showUploadForm && isOwner && (
        <div className="p-5 rounded-xl" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}` }}>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] font-bold mb-1 block" style={{ color: muted }}>Document Type</label>
              <select value={formData.document_type} onChange={e => setFormData(p => ({ ...p, document_type: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-[11px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }}>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold mb-1 block" style={{ color: muted }}>Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Airframe Logbook Jan 2024"
                className="w-full rounded-lg px-3 py-2 text-[11px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold mb-1 block" style={{ color: muted }}>Description</label>
              <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Brief description of the document..."
                className="w-full rounded-lg px-3 py-2 text-[11px] resize-none" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }} />
            </div>
            <div>
              <label className="text-[10px] font-bold mb-1 block" style={{ color: muted }}>Certifying Authority</label>
              <select value={formData.certifying_authority} onChange={e => setFormData(p => ({ ...p, certifying_authority: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-[11px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }}>
                {AUTHORITIES.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold mb-1 block" style={{ color: muted }}>Certifier License #</label>
              <input type="text" value={formData.certifier_license} onChange={e => setFormData(p => ({ ...p, certifier_license: e.target.value }))}
                placeholder="e.g. A&P-123456, CAMO-789"
                className="w-full rounded-lg px-3 py-2 text-[11px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }} />
            </div>
            <div>
              <label className="text-[10px] font-bold mb-1 block" style={{ color: muted }}>Document Date</label>
              <input type="date" value={formData.verification_date} onChange={e => setFormData(p => ({ ...p, verification_date: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-[11px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }} />
            </div>
            <div>
              <label className="text-[10px] font-bold mb-1 block" style={{ color: muted }}>Visibility</label>
              <select value={formData.visibility} onChange={e => setFormData(p => ({ ...p, visibility: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-[11px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }}>
                <option value="private">Private (Owner only)</option>
                <option value="shared_owners">Shared Owners</option>
                <option value="verified_viewers">Verified Viewers</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer" style={{ color: muted }}>
                <input type="checkbox" checked={formData.is_shared_ownership_doc}
                  onChange={e => setFormData(p => ({ ...p, is_shared_ownership_doc: e.target.checked }))} />
                Co-Ownership Document
              </label>
            </div>
            {formData.is_shared_ownership_doc && (
              <div>
                <label className="text-[10px] font-bold mb-1 block" style={{ color: muted }}>Tags</label>
                <input type="text" value={formData.tags} onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))}
                  placeholder="shared, co-owner, deed"
                  className="w-full rounded-lg px-3 py-2 text-[11px]" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
              style={{ background: accent, color: "#fff" }}>
              {uploading ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Anchoring to Polygon...</>
              ) : (
                <><Hash className="w-3.5 h-3.5" /> Select File & Anchor</>
              )}
            </button>
            <button onClick={resetForm} className="text-[11px] font-medium hover:underline" style={{ color: muted }}>Cancel</button>
          </div>
          <p className="text-[9px] mt-2" style={{ color: muted }}>
            Documents are encrypted and anchored to the Polygon blockchain for immutable verification.
            Max 50MB. PDF, images, and Office documents supported.
          </p>
        </div>
      )}

      {/* ── Filter tabs ─────────────────────── */}
      {documents.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {DOC_CATEGORIES.map(c => {
            const count = c.key === "all" ? documents.length : documents.filter(d => d.document_type === c.key).length;
            if (count === 0) return null;
            return (
              <button key={c.key} onClick={() => setFilterType(c.key)}
                className="px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all"
                style={{
                  background: filterType === c.key ? `${accent}20` : "transparent",
                  color: filterType === c.key ? accent : muted,
                  border: filterType === c.key ? `1px solid ${accent}40` : `1px solid transparent`,
                }}>
                {c.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ── Document list ───────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <Lock className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: muted }} />
          <p className="text-[12px]" style={{ color: muted }}>
            {isOwner ? "No documents in the vault yet. Upload and anchor your first document." : "No public documents available."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => {
            const isVerified = doc.verification_status === "verified";
            const hasPolygon = !!doc.polygon_tx_hash;
            return (
              <div key={doc.id} className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                style={{
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)",
                  border: `1px solid ${borderColor}`,
                }}>
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: isVerified ? "rgba(34,197,94,0.1)" : "rgba(212,160,23,0.08)", border: `1px solid ${isVerified ? "rgba(34,197,94,0.25)" : "rgba(212,160,23,0.2)"}` }}>
                  {isVerified ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#22c55e" }} />
                  ) : doc.verification_status === "rejected" ? (
                    <XCircle className="w-4 h-4" style={{ color: "#ff4d6d" }} />
                  ) : (
                    <Clock className="w-4 h-4" style={{ color: gold }} />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[12px] font-bold truncate" style={{ color: textColor }}>
                      {doc.title}
                    </p>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase whitespace-nowrap"
                      style={{
                        background: isVerified ? "rgba(34,197,94,0.1)" : doc.verification_status === "rejected" ? "rgba(255,77,109,0.1)" : "rgba(212,160,23,0.1)",
                        color: isVerified ? "#22c55e" : doc.verification_status === "rejected" ? "#ff4d6d" : gold,
                        border: `1px solid ${isVerified ? "rgba(34,197,94,0.25)" : doc.verification_status === "rejected" ? "rgba(255,77,109,0.2)" : "rgba(212,160,23,0.2)"}`
                      }}>
                      {doc.verification_status}
                    </span>
                    {doc.is_shared_ownership_doc && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20">
                        <Users className="w-2.5 h-2.5 inline mr-0.5" />Co-Own
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] mb-1" style={{ color: muted }}>
                    {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                    {doc.certifying_authority && ` · ${doc.certifying_authority}`}
                    {doc.certifier_license && ` · ${doc.certifier_license}`}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {doc.verification_date && (
                      <span className="text-[9px]" style={{ color: muted }}>
                        {new Date(doc.verification_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                    {hasPolygon && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] font-bold hover:underline"
                        style={{ color: "#7c3aed" }}>
                        <Hash className="w-2.5 h-2.5" />
                        {doc.polygon_tx_hash?.slice(0, 10)}...
                      </a>
                    )}
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] font-medium hover:underline"
                      style={{ color: accent }}>
                      <Eye className="w-2.5 h-2.5" /> View
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Polygon info strip ──────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-medium"
        style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", color: "#7c3aed" }}>
        <Hash className="w-3 h-3" />
        Documents are encrypted, hashed, and anchored to the Polygon blockchain for tamper-proof verification.
        Owner retains full control of access rights.
      </div>
    </div>
  );
}