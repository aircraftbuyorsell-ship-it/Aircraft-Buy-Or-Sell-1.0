import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Mail, CalendarDays, ExternalLink, Loader2 } from "lucide-react";

const AMBER = "#f5c242";

function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

const inputStyle = { background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#fff" };

export default function IntegrationHub({ pipeline }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [docUrl, setDocUrl] = useState(null);
  const [emailTo, setEmailTo] = useState(pipeline?.buyer_email || "");
  const [emailSent, setEmailSent] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("inspection");
  const [eventLink, setEventLink] = useState(null);

  const invoke = async (key, payload) => {
    setBusy(key);
    setError(null);
    try {
      const res = await base44.functions.invoke("pipelineIntegrations", { pipelineId: pipeline.id, ...payload });
      return res.data;
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Action failed");
      return null;
    } finally {
      setBusy(null);
    }
  };

  const handleContract = async () => {
    const data = await invoke("contract", { action: "generate_contract" });
    if (data?.docUrl) setDocUrl(data.docUrl);
  };

  const handleEmail = async () => {
    if (!emailTo.trim()) { setError("Enter recipient email"); return; }
    const data = await invoke("email", {
      action: "send_email",
      to: emailTo.trim(),
      subject: `Purchase agreement — ${pipeline.registration}`,
      body: `Hello,\n\nPlease find the purchase agreement draft for aircraft ${pipeline.aircraft_label || pipeline.registration}.\n\nBest regards,\nABOS MarketSpace`,
      docUrl,
    });
    if (data?.ok) setEmailSent(true);
  };

  const handleEvent = async () => {
    if (!eventDate) { setError("Pick a date and time"); return; }
    const label = eventType === "inspection" ? "Pre-buy inspection" : "Closing";
    const data = await invoke("event", {
      action: "schedule_event",
      eventTitle: `${pipeline.registration} — ${label}`,
      eventDate,
      attendeeEmail: emailTo.trim() || undefined,
    });
    if (data?.eventLink) setEventLink(data.eventLink);
  };

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
      <p className="text-[10px] uppercase tracking-[0.2em] font-black mb-3" style={{ color: AMBER }}>
        Integration Hub — Docs · Gmail · Calendar
      </p>

      {error && (
        <div className="rounded-lg px-3 py-2 mb-3 text-[11px] text-[#e24b4a]"
          style={{ background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.15)" }}>
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        {/* Google Docs — contract */}
        <Section icon={FileText} title="Contract (Docs)" color="#a78bfa">
          <button onClick={handleContract} disabled={busy === "contract"}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold disabled:opacity-40"
            style={{ background: "rgba(167,139,250,0.1)", border: "0.5px solid rgba(167,139,250,0.25)", color: "#a78bfa" }}>
            {busy === "contract" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            {docUrl ? "Regenerate draft" : "Generate agreement"}
          </button>
          {docUrl && (
            <a href={docUrl} target="_blank" rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#a78bfa] hover:underline">
              Open in Google Docs <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </Section>

        {/* Gmail — send */}
        <Section icon={Mail} title="Send (Gmail)" color="#5dcaa5">
          <input value={emailTo} onChange={e => { setEmailTo(e.target.value); setEmailSent(false); }}
            placeholder="buyer@email.com" type="email"
            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-2" style={inputStyle} />
          <button onClick={handleEmail} disabled={busy === "email"}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold disabled:opacity-40"
            style={{ background: "rgba(93,202,165,0.1)", border: "0.5px solid rgba(93,202,165,0.25)", color: "#5dcaa5" }}>
            {busy === "email" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {emailSent ? "✓ Sent — send again" : docUrl ? "Email agreement" : "Send notification"}
          </button>
        </Section>

        {/* Calendar — schedule */}
        <Section icon={CalendarDays} title="Schedule (Calendar)" color="#4e8ef7">
          <div className="flex gap-1.5 mb-2">
            <select value={eventType} onChange={e => setEventType(e.target.value)}
              className="rounded-lg text-[11px] px-2 py-2 outline-none" style={inputStyle}>
              <option value="inspection">Inspection</option>
              <option value="closing">Closing</option>
            </select>
            <input type="datetime-local" value={eventDate} onChange={e => { setEventDate(e.target.value); setEventLink(null); }}
              className="flex-1 min-w-0 px-2 py-2 rounded-lg text-[11px] outline-none" style={inputStyle} />
          </div>
          <button onClick={handleEvent} disabled={busy === "event"}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold disabled:opacity-40"
            style={{ background: "rgba(78,142,247,0.1)", border: "0.5px solid rgba(78,142,247,0.25)", color: "#4e8ef7" }}>
            {busy === "event" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
            Add to calendar
          </button>
          {eventLink && (
            <a href={eventLink} target="_blank" rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-[#4e8ef7] hover:underline">
              View event <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </Section>
      </div>
    </div>
  );
}