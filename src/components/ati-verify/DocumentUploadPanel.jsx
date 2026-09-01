import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle, Eye, Trash2, Hexagon, BadgeCheck, XCircle } from "lucide-react";

export default function DocumentUploadPanel({ sessionId, docType, label, icon, existingDocs = [] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Anchor document hash to Polygon blockchain
      let polygonData = {};
      try {
        const anchorRes = await base44.functions.invoke("anchorVaultDocument", {
          file_url,
          file_name: file.name,
          document_type: docType,
        });
        polygonData = {
          polygon_tx_hash: anchorRes.data?.tx_hash || null,
          polygon_block_number: anchorRes.data?.block_number || null,
          polygon_verified_at: anchorRes.data?.verified_at || null,
        };
      } catch (anchorErr) {
        console.warn("Polygon anchoring skipped:", anchorErr.message);
      }

      await base44.entities.ATIVerifyDocument.create({
        session: sessionId,
        document_type: docType,
        title: `${label} - ${file.name}`,
        file_url,
        ...polygonData,
      });
      queryClient.invalidateQueries({ queryKey: ["ati-verify-docs", sessionId] });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (docId) => {
    try {
      await base44.entities.ATIVerifyDocument.delete(docId);
      queryClient.invalidateQueries({ queryKey: ["ati-verify-docs", sessionId] });
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const latest = existingDocs[0];
  const isOwnershipProof = docType === "ownership_proof";

  return (
  <div className={`bg-[#11162b] border rounded-xl p-4 ${isOwnershipProof ? "border-[#D4A017]/30" : "border-white/[0.06]"}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <p className="text-[11px] font-bold text-white/80">{label}</p>
        {latest?.ocr_status === "completed" && !isOwnershipProof && (
          <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
        )}
        {isOwnershipProof && latest?.ownership_verified && (
          <BadgeCheck className="w-3.5 h-3.5 text-[#D4A017]" />
        )}
        {isOwnershipProof && latest?.ocr_status === "review_required" && (
          <XCircle className="w-3.5 h-3.5 text-[#f87171]" />
        )}
      </div>

      {latest ? (
        <div className="space-y-2">
          <div className="bg-[#0c0f1a] border border-white/[0.06] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-white/40 truncate max-w-[70%]">{latest.title}</span>
              <div className="flex items-center gap-1.5">
                {latest.file_url && (
                  <a href={latest.file_url} target="_blank" rel="noopener noreferrer"
                    className="text-white/20 hover:text-white/50 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={() => handleDelete(latest.id)}
                  className="text-white/20 hover:text-[#f87171] transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            {latest.ocr_status === "completed" ? (
              <div className="space-y-1 text-[10px]">
                {latest.extracted_name && <p><span className="text-white/30">Name:</span> <span className="text-white/70 font-bold">{latest.extracted_name}</span></p>}
                {latest.extracted_document_number && <p><span className="text-white/30">Doc #:</span> <span className="text-white/70">{latest.extracted_document_number}</span></p>}
                {latest.extracted_registration && <p><span className="text-white/30">Reg:</span> <span className="text-[#60a5fa] font-bold">{latest.extracted_registration}</span></p>}
                {latest.confidence_score != null && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.06]">
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#4ade80]" style={{ width: `${latest.confidence_score}%` }} />
                    </div>
                    <span className="text-white/30">{latest.confidence_score}%</span>
                  </div>
                )}
                {latest.polygon_tx_hash && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                    <Hexagon className="w-3 h-3 text-[#8247E5]" />
                    <span className="text-[9px] text-[#8247E5] font-bold uppercase tracking-wider">Polygon Anchored</span>
                  </div>
                )}
              </div>
            ) : latest.ocr_status === "processing" ? (
              <div className="flex items-center gap-2 text-[10px] text-[#facc15]">
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing OCR...
              </div>
            ) : latest.ocr_status === "failed" ? (
              <div className="flex items-center gap-2 text-[10px] text-[#f87171]">
                <AlertCircle className="w-3 h-3" />
                OCR failed
              </div>
            ) : latest.ocr_status === "review_required" ? (
              <div className="flex items-center gap-2 text-[10px] text-[#f87171]">
                <XCircle className="w-3 h-3" />
                Review Required — name/reg mismatch
              </div>
            ) : (
              <p className="text-[10px] text-white/20">Awaiting verification</p>
            )}
            {/* Ownership verified badge */}
            {isOwnershipProof && latest?.ownership_verified && (
              <div className="mt-2 pt-2 border-t border-[#D4A017]/20">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span className="text-[9px] text-[#D4A017] font-black uppercase tracking-wider">Verified by Owner</span>
                </div>
              </div>
            )}
          </div>
          <label className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-white/[0.1] text-[10px] text-white/30 hover:text-white/60 hover:border-white/[0.2] cursor-pointer transition-all">
            <Upload className="w-3 h-3" />
            Replace
            <input type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 w-full py-8 rounded-xl border-2 border-dashed border-white/[0.08] text-white/30 hover:text-[#60a5fa] hover:border-[#60a5fa]/30 cursor-pointer transition-all">
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-[#60a5fa]" />
              <span className="text-[10px]">Uploading...</span>
            </>
          ) : (
            <>
              <FileText className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Upload {label}</span>
              <span className="text-[9px] opacity-50">PNG, JPG, PDF</span>
            </>
          )}
          <input type="file" accept="image/*,.pdf" onChange={handleUpload} disabled={uploading} className="hidden" />
        </label>
      )}
      {error && <p className="text-[10px] text-[#f87171] mt-2">{error}</p>}
    </div>
  );
}