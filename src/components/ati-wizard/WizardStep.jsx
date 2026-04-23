import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Loader2, FileCheck } from "lucide-react";

/**
 * Renders one dimension step: structured fields + evidence uploader.
 * All state is lifted — parent owns `values` and `evidence`.
 */
export default function WizardStep({ dimension, values, onChange, evidence, onEvidenceChange }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const inputRef = useRef(null);

  const setField = (key, value) => onChange({ ...values, [key]: value });

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setErr(null);
    try {
      const urls = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          setErr(`"${file.name}" > 10 MB`);
          continue;
        }
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      onEvidenceChange([...(evidence || []), ...urls]);
    } catch (e) {
      setErr(e.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeEvidence = (url) => onEvidenceChange(evidence.filter((u) => u !== url));

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">{dimension.key}</p>
        <h2 className="text-xl md:text-2xl font-black text-[#1A1814] uppercase tracking-tight mt-1">{dimension.label}</h2>
        <p className="text-sm text-[#6B6560] mt-1">{dimension.desc}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {dimension.fields.map((f) => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">
              {f.label}
            </label>
            {f.type === "select" ? (
              <select
                value={values[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]"
              >
                <option value="">— select —</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                value={values[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                rows={3}
                placeholder={f.placeholder || ""}
                className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm resize-none focus:outline-none focus:border-[#0B2D5B]"
              />
            ) : (
              <input
                type={f.type}
                value={values[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder={f.placeholder || ""}
                className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]"
              />
            )}
          </div>
        ))}
      </div>

      {/* Evidence */}
      <div className="pt-3 border-t border-black/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#6B6560]">
            {dimension.evidenceLabel}
          </p>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple onChange={handleUpload} className="hidden" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 bg-[#F7F4EF] hover:bg-[#eae5dc] text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-md"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Uploading" : "Attach"}
          </button>
        </div>
        {err && <p className="text-xs text-[#C0392B] mb-2">{err}</p>}
        {(evidence || []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {evidence.map((url) => (
              <div key={url} className="relative group w-16 h-16 rounded-md overflow-hidden border border-black/[0.08] bg-[#F7F4EF]">
                {/\.(png|jpe?g|gif|webp)$/i.test(url) ? (
                  <img src={url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-[#0B2D5B]" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeEvidence(url)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#AAA49C]">No evidence attached (optional but boosts score accuracy)</p>
        )}
      </div>
    </div>
  );
}