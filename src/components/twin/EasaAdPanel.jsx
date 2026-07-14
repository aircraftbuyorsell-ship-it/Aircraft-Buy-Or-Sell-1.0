import { useState } from "react";
import { ExternalLink, FileWarning, Loader2, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

const AMBER = "#f5c242";

const TYPE_STYLES = {
  AD: { bg: "rgba(226,75,74,0.12)", color: "#e24b4a" },
  EAD: { bg: "rgba(226,75,74,0.12)", color: "#e24b4a" },
  PAD: { bg: "rgba(245,194,66,0.12)", color: AMBER },
  SIB: { bg: "rgba(93,202,165,0.12)", color: "#5dcaa5" },
  SD: { bg: "rgba(122,122,122,0.12)", color: "rgba(255,255,255,0.6)" },
};

export default function EasaAdPanel({ registration }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const lookup = async () => {
    setState("loading");
    setError("");
    try {
      const res = await base44.functions.invoke("easaAdLookup", { registration });
      setData(res.data);
      setState("done");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "EASA AD lookup failed");
      setState("error");
    }
  };

  const pubs = data?.publications || [];
  const activePubs = pubs.filter((p) => !p.superseded);
  const supersededPubs = pubs.filter((p) => p.superseded);

  return (
    <div className="rounded-xl px-5 py-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileWarning className="w-3.5 h-3.5" style={{ color: AMBER }} />
          <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[rgba(255,255,255,0.7)]">
            EASA Airworthiness Directives
          </p>
        </div>
        {state === "done" && (
          <span className="text-[10px] font-bold" style={{ color: activePubs.length > 0 ? "#e24b4a" : "#5dcaa5" }}>
            {activePubs.length} active {activePubs.length === 1 ? "directive" : "directives"}
          </span>
        )}
      </div>

      {state === "idle" && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[rgba(255,255,255,0.4)] italic">
            Check for applicable EASA safety publications
          </p>
          <button onClick={lookup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-80"
            style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.25)", color: AMBER }}>
            <Search className="w-3 h-3" /> Check EASA ADs
          </button>
        </div>
      )}

      {state === "loading" && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} />
          <p className="text-[12px] text-[rgba(255,255,255,0.5)]">Searching EASA publications database…</p>
        </div>
      )}

      {state === "error" && (
        <div className="py-2">
          <p className="text-[12px] text-[#e24b4a] mb-2">{error}</p>
          <button onClick={lookup}
            className="text-[11px] font-bold text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.8)] underline">
            Retry
          </button>
        </div>
      )}

      {state === "done" && (
        <div className="space-y-2">
          {pubs.length === 0 ? (
            <p className="text-[12px] text-[rgba(255,255,255,0.4)] italic">
              No EASA publications found for {data?.aircraft_label || registration}
            </p>
          ) : (
            <>
              {activePubs.map((pub) => {
                const ts = TYPE_STYLES[pub.publication_type] || TYPE_STYLES.AD;
                return (
                  <a key={pub.number} href={pub.url} target="_blank" rel="noopener noreferrer"
                    className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                    style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-bold text-[rgba(255,255,255,0.9)]">{pub.number}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{ background: ts.bg, color: ts.color }}>
                          {pub.publication_type}
                        </span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-[rgba(255,255,255,0.3)] flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-[12px] text-[rgba(255,255,255,0.65)] leading-snug mb-1">{pub.title}</p>
                    <div className="flex gap-3 text-[10px] text-[rgba(255,255,255,0.35)]">
                      {pub.issue_date && <span>Issued: {pub.issue_date}</span>}
                      {pub.effective_date && <span>Effective: {pub.effective_date}</span>}
                    </div>
                  </a>
                );
              })}
              {supersededPubs.length > 0 && (
                <details className="mt-2">
                  <summary className="text-[10px] text-[rgba(255,255,255,0.35)] cursor-pointer hover:text-[rgba(255,255,255,0.5)]">
                    {supersededPubs.length} superseded {supersededPubs.length === 1 ? "directive" : "directives"}
                  </summary>
                  <div className="space-y-1.5 mt-2">
                    {supersededPubs.map((pub) => (
                      <a key={pub.number} href={pub.url} target="_blank" rel="noopener noreferrer"
                        className="block rounded-lg px-3 py-2 opacity-50 hover:opacity-75"
                        style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.04)" }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[11px] font-bold text-[rgba(255,255,255,0.6)]">{pub.number}</span>
                          <span className="text-[9px] text-[rgba(255,255,255,0.3)]">SUPERSEDED</span>
                        </div>
                        <p className="text-[11px] text-[rgba(255,255,255,0.4)] leading-snug">{pub.title}</p>
                      </a>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
          <p className="text-[10px] text-[rgba(255,255,255,0.25)] pt-1">
            Source: {data?.source_url} · Retrieved {new Date(data?.fetched_at).toLocaleDateString("en-GB")}
          </p>
        </div>
      )}
    </div>
  );
}