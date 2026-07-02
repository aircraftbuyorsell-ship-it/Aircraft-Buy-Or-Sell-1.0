import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import {
  X, Upload, Loader2, CheckCircle, BadgeCheck, Euro,
  ChevronRight, ChevronLeft, FileText, ShieldCheck
} from "lucide-react";

const CERT_OPTIONS = [
  "A&P", "IA", "EASA Part-66 B1", "EASA Part-66 B2", "EASA Part-66 C",
  "FAA Part 145", "Type Rated Inspector", "DAR", "Other"
];

export default function ExpertOnboardingModal({ open, onClose, userId, userEmail, userFullName }) {
  const [step, setStep] = useState(0);
  const [certs, setCerts] = useState([]);
  const [scanUrl, setScanUrl] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [priceEur, setPriceEur] = useState(75);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const qc = useQueryClient();

  if (!open) return null;

  const toggleCert = (c) => {
    setCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setError(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScanUrl(file_url);
      setUploading(false);

      // Auto-extract cert data
      setExtracting(true);
      const res = await base44.functions.invoke("verifyCertificate", { file_url });
      const data = res.data || res;
      setExtracted(data.extracted || null);
    } catch (e) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleSubmit = async () => {
    if (certs.length === 0 || !scanUrl) {
      setError("Please select certifications and upload a certificate scan.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await base44.entities.ExpertProfile.create({
        user_id: userId,
        full_name: userFullName || "",
        email: userEmail || "",
        certifications: certs,
        cert_scan_url: scanUrl,
        cert_extracted: extracted || null,
        price_eur: priceEur,
        bio: bio || null,
        verified_status: "pending",
      });
      qc.invalidateQueries({ queryKey: ["expert-profile", userId] });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  const steps = ["Certifications", "Upload Certificate", "Set Rate"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.80)" }}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0B1220", border: "0.5px solid rgba(245,194,66,0.20)" }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "0.5px solid rgba(245,194,66,0.12)" }}>
          <div className="flex items-center gap-2">
            <BadgeCheck size={16} style={{ color: "#f5c242" }} />
            <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#f5c242]">Expert Onboarding</p>
          </div>
          <button onClick={onClose} className="text-[rgba(255,255,255,0.40)] hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 flex items-center gap-2" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all"
                style={{
                  background: i <= step ? "#f5c242" : "rgba(255,255,255,0.06)",
                  color: i <= step ? "#04060a" : "rgba(255,255,255,0.40)",
                }}
              >
                {i < step ? <CheckCircle size={12} /> : i + 1}
              </div>
              <span className="text-[10px] font-bold" style={{ color: i <= step ? "#f5c242" : "rgba(255,255,255,0.30)" }}>
                {label}
              </span>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px" style={{ background: i < step ? "#f5c242" : "rgba(255,255,255,0.06)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-6 min-h-[280px]">
          {error && (
            <div className="mb-4 text-[11px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.20)] rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Step 0: Certifications */}
          {step === 0 && (
            <div>
              <p className="text-[11px] text-[rgba(255,255,255,0.50)] mb-4">
                Select all certifications you hold. These will be displayed on your expert profile and bids.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CERT_OPTIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleCert(c)}
                    className="text-left px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all"
                    style={{
                      background: certs.includes(c) ? "rgba(245,194,66,0.10)" : "rgba(255,255,255,0.03)",
                      border: certs.includes(c) ? "0.5px solid rgba(245,194,66,0.30)" : "0.5px solid rgba(255,255,255,0.06)",
                      color: certs.includes(c) ? "#f5c242" : "rgba(255,255,255,0.60)",
                    }}
                  >
                    {certs.includes(c) && <CheckCircle size={10} className="inline mr-1" />}
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              <p className="text-[11px] text-[rgba(255,255,255,0.50)] mb-4">
                Upload a scan of your certificate. Our AI will extract key details for admin verification.
              </p>
              {!scanUrl ? (
                <label
                  className="flex flex-col items-center justify-center py-10 rounded-xl cursor-pointer transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(245,194,66,0.25)" }}
                >
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin text-[#f5c242] mb-2" />
                  ) : (
                    <Upload size={24} style={{ color: "#f5c242" }} className="mb-2" />
                  )}
                  <span className="text-[12px] font-bold text-[rgba(255,255,255,0.60)]">
                    {uploading ? "Uploading…" : "Click to upload certificate scan"}
                  </span>
                  <span className="text-[10px] text-[rgba(255,255,255,0.30)] mt-1">PDF, PNG, JPG — max 10MB</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={e => e.target.files[0] && handleUpload(e.target.files[0])}
                  />
                </label>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "0.5px solid rgba(34,197,94,0.20)" }}>
                    <CheckCircle size={14} className="text-[#22c55e]" />
                    <span className="text-[11px] font-bold text-[#22c55e]">Certificate uploaded</span>
                  </div>
                  {extracting ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 size={16} className="animate-spin text-[#f5c242]" />
                      <span className="text-[11px] text-[rgba(255,255,255,0.50)]">Extracting certificate data with AI…</span>
                    </div>
                  ) : extracted ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider font-black text-[#f5c242] mb-2">AI-Extracted Data</p>
                      {[
                        { l: "Type", v: extracted.cert_type },
                        { l: "Number", v: extracted.cert_number },
                        { l: "Issuer", v: extracted.issuer },
                        { l: "Holder", v: extracted.holder_name },
                        { l: "Expiry", v: extracted.expiry_date },
                      ].map(r => (
                        <div key={r.l} className="flex justify-between text-[11px]">
                          <span className="text-[rgba(255,255,255,0.40)]">{r.l}</span>
                          <span className="text-[rgba(255,255,255,0.80)] font-semibold">{r.v || "—"}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button
                    onClick={() => { setScanUrl(null); setExtracted(null); }}
                    className="mt-3 text-[10px] text-[rgba(255,255,255,0.40)] hover:text-white"
                  >
                    Upload different file
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Set Rate */}
          {step === 2 && (
            <div>
              <p className="text-[11px] text-[rgba(255,255,255,0.50)] mb-4">
                Set your default rate. You can adjust this per bid.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.40)] mb-1.5 block">
                    Default Rate (EUR)
                  </label>
                  <div className="relative">
                    <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.30)]" />
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={priceEur}
                      onChange={e => setPriceEur(+e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg text-[13px] font-bold"
                      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "#fff" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.40)] mb-1.5 block">
                    Professional Bio (optional)
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Brief overview of your experience, specializations, etc."
                    className="w-full px-3 py-2.5 rounded-lg text-[11px] resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "#fff" }}
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}>
                  <ShieldCheck size={14} style={{ color: "#f5c242" }} />
                  <span className="text-[10px] text-[rgba(255,255,255,0.50)]">
                    Your profile will be reviewed by an admin before going live.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="text-[11px] font-bold text-[rgba(255,255,255,0.40)] hover:text-white flex items-center gap-1"
          >
            <ChevronLeft size={14} />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && certs.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[11px] font-black transition-all disabled:opacity-30"
              style={{ background: "#f5c242", color: "#04060a" }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || !scanUrl}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[11px] font-black transition-all disabled:opacity-30"
              style={{ background: "#f5c242", color: "#04060a" }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Submit for Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}