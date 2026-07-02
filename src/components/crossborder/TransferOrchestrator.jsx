import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Clock, FileText, Plane, ChevronRight } from "lucide-react";

/* ═══════════════════════════════════════
   TRANSFER WORKFLOW ORCHESTRATOR
   Tracks an aircraft through the full
   deregistration → freight → registration
   pipeline between jurisdictions.
═══════════════════════════════════════ */

const AUTHORITIES = ["FAA", "UK CAA", "EASA"];

const WORKFLOW_STAGES = [
  {
    id: "deregistration",
    label: "Deregistration",
    icon: Circle,
    category: "Origin Authority",
    description: "Cancel registration at the origin authority",
    tasks: [
      { id: "dereg-submit", label: "Submit deregistration application", docs: ["AC 8050-64 / Form CA1"] },
      { id: "dereg-bos", label: "Provide Bill of Sale / ownership transfer", docs: ["Bill of Sale"] },
      { id: "dereg-cor", label: "Surrender original Certificate of Registration", docs: ["Original CofR"] },
      { id: "dereg-lien", label: "Clear liens & encumbrances", docs: ["Title search", "Lien release"] },
    ],
  },
  {
    id: "export-cofa",
    label: "Export CofA",
    icon: FileText,
    category: "Airworthiness",
    description: "Obtain Export Certificate of Airworthiness",
    tasks: [
      { id: "exp-mx", label: "Maintenance records review (AD/SB compliance)", docs: ["Maintenance logs", "AD compliance list"] },
      { id: "exp-inspect", label: "Pre-export inspection by authority surveyor", docs: ["Inspection report"] },
      { id: "exp-issue", label: "Issue Export CofA (FAA Form 8130-4 / EASA Form 27)", docs: ["Export CofA"] },
      { id: "exp-noise", label: "Obtain noise certificate", docs: ["Noise certificate"] },
    ],
  },
  {
    id: "customs-export",
    label: "Customs (Export)",
    icon: FileText,
    category: "Customs",
    description: "Clear aircraft for export from origin country",
    tasks: [
      { id: "cex-harmonized", label: "File HS code classification (8802.20/8802.30)", docs: ["HS classification"] },
      { id: "cex-export-decl", label: "Submit export declaration (EEI/AES/SAD)", docs: ["Export declaration"] },
      { id: "cex-vat", label: "VAT/sales tax exemption or refund filing", docs: ["Tax exemption cert"] },
      { id: "cex-clear", label: "Customs clearance at departure airport", docs: ["Customs release"] },
    ],
  },
  {
    id: "freight",
    label: "International Freight",
    icon: Plane,
    category: "Logistics",
    description: "Ferry flight or cargo transport to destination",
    tasks: [
      { id: "fr-ferry", label: "Ferry permit / special flight authorization", docs: ["Ferry permit"] },
      { id: "fr-insurance", label: "Transit insurance (hull + liability)", docs: ["Insurance policy"] },
      { id: "fr-route", label: "Route planning & overflight permits", docs: ["Flight plan", "Overflight clearances"] },
      { id: "fr-dispatch", label: "Dispatch & fuel arrangement", docs: ["Dispatch release"] },
    ],
  },
  {
    id: "customs-import",
    label: "Customs (Import)",
    icon: FileText,
    category: "Customs",
    description: "Clear aircraft for import at destination country",
    tasks: [
      { id: "cim-import-decl", label: "File import declaration at destination", docs: ["Import declaration"] },
      { id: "cim-duty", label: "Pay import duties / VAT / customs fees", docs: ["Duty payment receipt"] },
      { id: "cim-clear", label: "Customs clearance at arrival airport", docs: ["Customs release"] },
      { id: "cim-temp", label: "Temporary admission (if applicable)", docs: ["Carnet ATA (optional)"] },
    ],
  },
  {
    id: "registration",
    label: "Registration",
    icon: CheckCircle2,
    category: "Destination Authority",
    description: "Register aircraft under destination authority",
    tasks: [
      { id: "reg-validate", label: "Validate Export CofA at destination CAA", docs: ["Validation application"] },
      { id: "reg-apply", label: "Submit registration application", docs: ["Registration form"] },
      { id: "reg-ownership", label: "Provide ownership proof & entity docs", docs: ["Ownership proof", "Corporate docs"] },
      { id: "reg-issue", label: "Issue new Certificate of Registration & CofA", docs: ["New CofR", "New CofA"] },
    ],
  },
];

function TaskItem({ task, done, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left"
      style={{
        background: done ? "rgba(93,202,165,0.06)" : "rgba(255,255,255,0.02)",
        border: done ? "0.5px solid rgba(93,202,165,0.15)" : "0.5px solid rgba(255,255,255,0.06)",
        minHeight: 44,
      }}
    >
      <div className="mt-0.5 shrink-0">
        {done ? <CheckCircle2 size={16} style={{ color: "#5dcaa5" }} /> : <Circle size={16} style={{ color: "rgba(255,255,255,0.25)" }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          color: done ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.90)",
          textDecoration: done ? "line-through" : "none",
          lineHeight: 1.4,
        }}>
          {task.label}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {task.docs.map((doc, i) => (
            <span key={i} className="rounded-md"
              style={{ fontSize: 8, fontWeight: 600, padding: "1px 5px", background: "rgba(78,142,247,0.09)", color: "#4e8ef7", border: "0.5px solid rgba(78,142,247,0.20)" }}>
              {doc}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function StageCard({ stage, tasks, onToggleTask }) {
  const completed = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const allDone = completed === total;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: allDone ? "0.5px solid rgba(93,202,165,0.20)" : "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
      }}>
      <div style={{ height: 2, background: allDone ? "#5dcaa5" : pct > 0 ? "#f5c242" : "rgba(255,255,255,0.08)" }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <stage.icon size={16} style={{ color: allDone ? "#5dcaa5" : "#f5c242" }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.03em" }}>
                {stage.label}
              </p>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                {stage.category}
              </p>
            </div>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: allDone ? "#5dcaa5" : "#f5c242",
            background: allDone ? "rgba(93,202,165,0.09)" : "rgba(245,194,66,0.09)",
            border: `0.5px solid ${allDone ? "rgba(93,202,165,0.20)" : "rgba(245,194,66,0.22)"}`,
            padding: "2px 8px",
            borderRadius: 9999,
          }}>
            {completed}/{total}
          </span>
        </div>

        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 12, lineHeight: 1.4 }}>
          {stage.description}
        </p>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: allDone ? "#5dcaa5" : "#f5c242" }} />
        </div>

        <div className="space-y-2">
          {stage.tasks.map((task) => {
            const t = tasks.find(tt => tt.id === task.id) || { done: false };
            return (
              <TaskItem
                key={task.id}
                task={task}
                done={t.done}
                onToggle={() => onToggleTask(stage.id, task.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TransferOrchestrator() {
  // Configuration: from → to authority
  const [fromAuth, setFromAuth] = useState("FAA");
  const [toAuth, setToAuth] = useState("EASA");

  // Track completed tasks
  const [taskState, setTaskState] = useState({});

  const allTasks = useMemo(() => {
    const flat = [];
    WORKFLOW_STAGES.forEach(s => s.tasks.forEach(t => flat.push({ stage: s.id, ...t })));
    return flat;
  }, []);

  const toggleTask = (stageId, taskId) => {
    const key = `${stageId}__${taskId}`;
    setTaskState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStageTasks = (stage) =>
    stage.tasks.map(t => ({ id: t.id, done: !!taskState[`${stage.id}__${t.id}`] }));

  const totalDone = Object.values(taskState).filter(Boolean).length;
  const overallPct = Math.round((totalDone / allTasks.length) * 100);

  const canSwap = fromAuth !== toAuth;

  return (
    <div className="space-y-5">
      {/* Route configurator */}
      <div className="rounded-xl p-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 12 }}>
          Transfer Route
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {/* From */}
          <div className="flex-1 min-w-[140px]">
            <label style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4, display: "block" }}>
              From (Origin)
            </label>
            <select
              value={fromAuth}
              onChange={(e) => setFromAuth(e.target.value)}
              className="w-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.90)",
                fontSize: 13,
                fontWeight: 500,
                padding: "10px 12px",
                minHeight: 40,
              }}
            >
              {AUTHORITIES.map(a => <option key={a} value={a} style={{ background: "#0d1117" }}>{a}</option>)}
            </select>
          </div>

          {/* Swap */}
          <button
            onClick={() => { if (canSwap) { const t = fromAuth; setFromAuth(toAuth); setToAuth(t); } }}
            disabled={!canSwap}
            className="mt-5 rounded-lg transition-all shrink-0"
            style={{
              background: canSwap ? "rgba(245,194,66,0.09)" : "rgba(255,255,255,0.04)",
              border: canSwap ? "0.5px solid rgba(245,194,66,0.22)" : "0.5px solid rgba(255,255,255,0.08)",
              color: canSwap ? "#f5c242" : "rgba(255,255,255,0.25)",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={16} />
          </button>

          {/* To */}
          <div className="flex-1 min-w-[140px]">
            <label style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 4, display: "block" }}>
              To (Destination)
            </label>
            <select
              value={toAuth}
              onChange={(e) => setToAuth(e.target.value)}
              className="w-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.90)",
                fontSize: 13,
                fontWeight: 500,
                padding: "10px 12px",
                minHeight: 40,
              }}
            >
              {AUTHORITIES.map(a => <option key={a} value={a} style={{ background: "#0d1117" }}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Overall Progress
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: overallPct === 100 ? "#5dcaa5" : "#f5c242" }}>
                {totalDone}/{allTasks.length} ({overallPct}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${overallPct}%`, background: overallPct === 100 ? "#5dcaa5" : "#f5c242" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stage cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WORKFLOW_STAGES.map((stage) => (
          <StageCard
            key={stage.id}
            stage={stage}
            tasks={getStageTasks(stage)}
            onToggleTask={toggleTask}
          />
        ))}
      </div>
    </div>
  );
}