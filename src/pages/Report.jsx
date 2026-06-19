import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ExternalLink, Shield, AlertTriangle, CheckCircle2, HelpCircle, Plane, Loader2, FileText } from "lucide-react";

const SECTION_CONFIG = [
  { key: "getFAARegistration", title: "FAA Registration", icon: <FileText className="w-5 h-5" /> },
  { key: "getAirworthinessCertificate", title: "Airworthiness Certificate", icon: <Shield className="w-5 h-5" /> },
  { key: "getNTSBAccidents", title: "Accident Records", icon: <AlertTriangle className="w-5 h-5" /> },
  { key: "getAirworthinessDirectives", title: "AD Compliance", icon: <CheckCircle2 className="w-5 h-5" /> },
  { key: "getServiceDifficultyReports", title: "Service Difficulty Reports", icon: <HelpCircle className="w-5 h-5" /> },
  { key: "getSTCs", title: "Supplemental Type Certificates", icon: <FileText className="w-5 h-5" /> },
  { key: "getServiceBulletins", title: "Service Bulletins", icon: <FileText className="w-5 h-5" /> },
  { key: "getEngineDatabase", title: "Engine Database", icon: <FileText className="w-5 h-5" /> },
];

function StatusBadge({ status }) {
  const config = {
    success: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Clear", className: "bg-green-100 text-green-700 border-green-200" },
    issues_found: { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Issues Found", className: "bg-red-100 text-red-700 border-red-200" },
    data_unavailable: { icon: <HelpCircle className="w-3.5 h-3.5" />, label: "Data Unavailable", className: "bg-gray-100 text-gray-600 border-gray-200" },
    error: { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Error", className: "bg-red-100 text-red-700 border-red-200" },
  };
  const c = config[status] || config.data_unavailable;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.className}`}>
      {c.icon} {c.label}
    </span>
  );
}

function StatusBorder({ status }) {
  const colorMap = { success: "border-l-green-500", issues_found: "border-l-red-500", data_unavailable: "border-l-gray-300", error: "border-l-red-400" };
  return colorMap[status] || "border-l-gray-300";
}

function DataTable({ data }) {
  if (!data || typeof data !== "object") return <p className="text-sm text-muted-foreground">No data available</p>;

  const entries = Object.entries(data).filter(([k]) => !k.startsWith("_"));
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No details available</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-baseline gap-2 py-1.5 border-b border-border/50 last:border-0">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[120px] flex-shrink-0">
            {key.replace(/_/g, " ")}
          </span>
          <span className="text-sm text-foreground break-all">
            {value === null || value === undefined ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportCard({ sectionKey, title, icon, data, status, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  const summaryText = (() => {
    if (!data) return "";
    if (data.total_records !== undefined) return `${data.total_records} record${data.total_records !== 1 ? "s" : ""}`;
    if (data.total_applicable !== undefined) return `${data.total_applicable} directive${data.total_applicable !== 1 ? "s" : ""}`;
    if (data.total_reports !== undefined) return `${data.total_reports} report${data.total_reports !== 1 ? "s" : ""}`;
    if (data.total_stcs !== undefined) return `${data.total_stcs} STC${data.total_stcs !== 1 ? "s" : ""}`;
    if (data.total_bulletins !== undefined) return `${data.total_bulletins} bulletin${data.total_bulletins !== 1 ? "s" : ""}`;
    if (data.total_references !== undefined) return `${data.total_references} reference${data.total_references !== 1 ? "s" : ""}`;
    if (data.manufacturer) return `${data.manufacturer} ${data.model || ""}`.trim();
    return "";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-xl border border-border border-l-4 ${StatusBorder(status)} overflow-hidden`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            {summaryText && <p className="text-xs text-muted-foreground mt-0.5">{summaryText}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-border mx-5">
              <div className="pt-4">
                <DataTable data={data} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Report() {
  const { nNumber } = useParams();
  const [searchParams] = useSearchParams();
  const partnerId = searchParams.get("partner");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partner, setPartner] = useState(null);

  const loadReport = useCallback(async () => {
    if (!nNumber) return;
    setLoading(true);
    setError("");

    try {
      // If partner param present, load partner for branding
      if (partnerId) {
        try {
          const partners = await base44.entities.Partner.filter({ id: partnerId });
          if (partners && partners.length > 0) {
            setPartner(partners[0]);
          }
        } catch (_) {
          // Partner not found, continue without
        }
      }

      // Fetch all data sources in parallel
      const sources = [
        "getFAARegistration", "getAirworthinessCertificate", "getNTSBAccidents",
        "getAirworthinessDirectives", "getServiceDifficultyReports", "getSTCs",
        "getServiceBulletins", "getEngineDatabase"
      ];

      const sectionResults = {};
      await Promise.all(
        sources.map(async (fn) => {
          try {
            const res = await base44.functions.invoke(fn, { nNumber });
            sectionResults[fn] = res;
          } catch (err) {
            sectionResults[fn] = {
              source: fn,
              data: null,
              fetched_at: new Date().toISOString(),
              status: "error",
              error: err.message
            };
          }
        })
      );

      setReport({
        n_number: nNumber.toUpperCase(),
        generated_at: new Date().toISOString(),
        sections: sectionResults,
      });
    } catch (err) {
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [nNumber, partnerId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Partner branding overrides
  const accentColor = partner?.primary_color || null;
  const logoSrc = partner?.logo_url || null;
  const isWhiteLabel = !!partner;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Generating report for N-Number <span className="font-bold text-foreground">{nNumber?.toUpperCase()}</span>...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16 px-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Report Unavailable</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Report header */}
      <div
        className="border-b border-border"
        style={accentColor ? { backgroundColor: accentColor + "0D" } : {}}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {isWhiteLabel && logoSrc ? (
                <img src={logoSrc} alt={partner?.name} className="h-10 object-contain" />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                    <Plane className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-xl text-foreground">
                    ANY<span className="text-accent">AIR</span>
                  </span>
                </div>
              )}
              <div className="hidden sm:block w-px h-8 bg-border" />
              <div>
                <h1 className="text-2xl font-extrabold text-foreground">Aircraft History Report</h1>
                <p className="text-sm text-muted-foreground">
                  N-Number: <span className="font-bold text-foreground">{report.n_number}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Generated</p>
              <p className="text-sm font-medium text-foreground">
                {new Date(report.generated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report sections */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-3">
          {SECTION_CONFIG.map((section, i) => {
            const sectionData = report.sections[section.key];
            const data = sectionData?.data || null;
            const status = sectionData?.status || "data_unavailable";
            return (
              <ReportCard
                key={section.key}
                sectionKey={section.key}
                title={section.title}
                icon={section.icon}
                data={data}
                status={status}
                defaultOpen={i === 0}
              />
            );
          })}
        </div>
      </div>

      {/* White-label attribution */}
      {isWhiteLabel && (
        <div className="max-w-5xl mx-auto px-6 pb-12">
          <p className="text-center text-xs text-muted-foreground">
            Powered by <span className="font-semibold">ANYAIR</span> — FAA-official aircraft data
          </p>
        </div>
      )}

      {/* External links */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-xl bg-muted/30 p-5 flex flex-wrap gap-4 items-center justify-center">
          <a
            href={`https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${report.n_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline flex items-center gap-1.5 font-medium"
          >
            View on FAA Registry <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <span className="text-border hidden sm:inline">|</span>
          <a
            href={`https://www.ntsb.gov/_layouts/ntsb.aviation/Results.aspx?query=nNumber:${report.n_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline flex items-center gap-1.5 font-medium"
          >
            View on NTSB Database <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}