import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Sparkles, ArrowLeft, RefreshCw } from "lucide-react";
import { getTemplate, detectAircraftClass } from "@/lib/salesBlueprints";
import CommandCard from "@/components/pipeline/CommandCard";
import PipelineSpider from "@/components/pipeline/PipelineSpider";

export default function SalesPipeline() {
  const { registration: urlReg } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [regInput, setRegInput] = useState(urlReg || "");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [busyStepId, setBusyStepId] = useState(null);
  const [fileUrls, setFileUrls] = useState({});

  const normalizedReg = (urlReg || "").toUpperCase().trim();

  // Find existing pipeline for this registration
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["sales-pipeline", normalizedReg],
    queryFn: async () => {
      if (!normalizedReg) return null;
      const res = await base44.entities.SalesPipeline.filter({ registration: normalizedReg }, "-created_date", 1);
      return res[0] || null;
    },
    enabled: !!normalizedReg,
  });

  // Fetch passport for the command card
  const { data: passport } = useQuery({
    queryKey: ["pipeline-passport", normalizedReg],
    queryFn: async () => {
      if (!normalizedReg) return null;
      const res = await base44.entities.ATIPassport.filter({ registration: normalizedReg }, "-created_date", 1);
      return res[0] || null;
    },
    enabled: !!normalizedReg,
  });

  const handleCreate = useCallback(async () => {
    const reg = regInput.trim().toUpperCase();
    if (!reg) return;

    setCreating(true);
    setError(null);

    try {
      // Check if pipeline already exists
      const existing = await base44.entities.SalesPipeline.filter({ registration: reg }, "-created_date", 1);
      if (existing[0]) {
        navigate(`/sales-pipeline/${reg}`);
        return;
      }

      // Initialize Digital Twin first to get aircraft context
      let aircraftLabel = reg;
      let aircraftClass = "sep";
      let passportId = null;
      let listingId = null;

      try {
        const twinRes = await base44.functions.invoke("initDigitalTwin", { registration: reg });
        const twin = twinRes?.data;
        if (twin?.ok !== false) {
          passportId = twin?.passportId || null;
          const faa = twin?.providers?.faa_registry;
          if (faa) {
            aircraftLabel = `${faa.year || ""} ${reg}`.trim();
          }
        }
      } catch {
        // Twin init is best-effort — pipeline can still be created
      }

      // Also check for an existing passport
      if (!passportId) {
        const passports = await base44.entities.ATIPassport.filter({ registration: reg }, "-created_date", 1);
        if (passports[0]) {
          passportId = passports[0].id;
          aircraftClass = detectAircraftClass(
            passports[0].aircraft_label || "",
            "",
            passports[0].engine_type
          );
        }
      }

      const template = getTemplate(aircraftClass);

      const newPipeline = await base44.entities.SalesPipeline.create({
        registration: reg,
        passport_id: passportId,
        listing_id: listingId,
        aircraft_label: aircraftLabel,
        aircraft_class: aircraftClass,
        status: "active",
        current_step_id: template[0]?.id || null,
        progress_pct: 0,
        steps: template.map(s => ({ ...s, status: "pending" })),
      });

      queryClient.invalidateQueries({ queryKey: ["sales-pipeline", reg] });
      navigate(`/sales-pipeline/${reg}`);
    } catch (e) {
      setError(e.message || "Failed to create pipeline");
    } finally {
      setCreating(false);
    }
  }, [regInput, navigate, queryClient]);

  const handleStepAction = useCallback(async (step, action) => {
    if (!pipeline) return;
    setBusyStepId(step.id);
    setError(null);

    try {
      const payload = {
        pipelineId: pipeline.id,
        stepId: step.id,
        action,
      };

      if (action === "ai_review") {
        payload.fileUrls = fileUrls[step.id] || [];
        if (payload.fileUrls.length === 0) {
          setError(`Please upload documents for "${step.label}" before running AI review.`);
          setBusyStepId(null);
          return;
        }
      }

      if (action === "complete" && step.status === "blocked") {
        payload.notes = "Manually overridden by user";
      }

      await base44.functions.invoke("orchestrateSalesStep", payload);
      queryClient.invalidateQueries({ queryKey: ["sales-pipeline", normalizedReg] });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Action failed");
    } finally {
      setBusyStepId(null);
    }
  }, [pipeline, fileUrls, normalizedReg, queryClient]);

  const handleFileUpload = useCallback(async (stepId, files) => {
    if (!files || files.length === 0) return;
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push(file_url);
      }
      setFileUrls(prev => ({ ...prev, [stepId]: [...(prev[stepId] || []), ...uploaded] }));
    } catch (e) {
      setError("File upload failed: " + (e.message || ""));
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Back link */}
        {normalizedReg && (
          <button onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-[12px] text-[rgba(255,255,255,0.50)] hover:text-[#4e8ef7] transition-colors font-medium mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
        )}

        {/* Creation form (no pipeline loaded) */}
        {!normalizedReg && (
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="px-6 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.2)" }}>
                <Sparkles className="w-7 h-7 text-[#f5c242]" />
              </div>
              <p className="text-[#f5c242] text-[9px] uppercase tracking-[0.25em] font-black mb-2">Sales Pipeline Spider</p>
              <h2 className="text-white text-xl font-black mb-2">Start a Deal Pipeline</h2>
              <p className="text-[rgba(255,255,255,0.50)] text-sm max-w-sm mx-auto leading-relaxed mb-6">
                Enter an aircraft registration to initialize the full sales workflow — from Digital Twin to closing.
              </p>

              <div className="flex gap-2 max-w-sm mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.3)]" />
                  <input
                    value={regInput}
                    onChange={e => setRegInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                    placeholder="N12345"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[14px] font-mono outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#fff" }}
                  />
                </div>
                <button onClick={handleCreate} disabled={creating || !regInput.trim()}
                  className="px-5 py-2.5 rounded-lg text-[13px] font-black transition-colors disabled:opacity-40"
                  style={{ background: "#f5c242", color: "#04060a" }}>
                  {creating ? "Initializing…" : "Start"}
                </button>
              </div>

              {error && (
                <p className="text-[#e24b4a] text-[12px] mt-3">{error}</p>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {normalizedReg && isLoading && (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            <div className="h-96 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
          </div>
        )}

        {/* No pipeline found — offer to create */}
        {normalizedReg && !isLoading && !pipeline && (
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] p-8 text-center"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[rgba(255,255,255,0.60)] text-sm mb-4">
              No pipeline found for <span className="font-mono font-bold text-[#f5c242]">{normalizedReg}</span>
            </p>
            <button onClick={() => { setRegInput(normalizedReg); handleCreate(); }} disabled={creating}
              className="px-5 py-2.5 rounded-lg text-[13px] font-black transition-colors disabled:opacity-40"
              style={{ background: "#f5c242", color: "#04060a" }}>
              {creating ? "Initializing…" : "Create Pipeline"}
            </button>
            {error && <p className="text-[#e24b4a] text-[12px] mt-3">{error}</p>}
          </div>
        )}

        {/* Pipeline loaded */}
        {normalizedReg && !isLoading && pipeline && (
          <div className="space-y-4">
            {error && (
              <div className="rounded-xl px-4 py-3 text-[12px] text-[#e24b4a]"
                style={{ background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.15)" }}>
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
              </div>
            )}

            <CommandCard pipeline={pipeline} passport={passport} />

            {/* Document upload area for verification steps */}
            {pipeline.steps?.some(s => s.ai_driven && !s.function_name && s.status === "pending") && (
              <DocumentUploadBar
                pipeline={pipeline}
                fileUrls={fileUrls}
                onUpload={handleFileUpload}
              />
            )}

            <PipelineSpider
              pipeline={pipeline}
              onAction={handleStepAction}
              busyStepId={busyStepId}
            />

            {/* Refresh button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["sales-pipeline", normalizedReg] })}
                className="flex items-center gap-1.5 text-[11px] text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.60)] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh pipeline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline document upload component for AI review steps
function DocumentUploadBar({ pipeline, fileUrls, onUpload }) {
  const reviewSteps = (pipeline.steps || []).filter(s => s.ai_driven && !s.function_name && s.status === "pending");

  if (reviewSteps.length === 0) return null;

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] p-4"
      style={{ background: "rgba(255,255,255,0.02)" }}>
      <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[rgba(255,255,255,0.35)] mb-3">
        Document Upload — for AI Review Steps
      </p>
      <div className="space-y-2">
        {reviewSteps.map(step => (
          <div key={step.id} className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-[rgba(255,255,255,0.70)] min-w-[140px]">{step.label}</span>
            <label className="cursor-pointer flex-1">
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => onUpload(step.id, Array.from(e.target.files))}
              />
              <span className="block text-[11px] text-[rgba(255,255,255,0.40)] px-3 py-1.5 rounded-lg border border-dashed"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                {fileUrls[step.id]?.length > 0
                  ? `${fileUrls[step.id].length} file(s) uploaded — click to add more`
                  : "Click to upload documents (logbooks, Form 337, etc.)"}
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}