import { useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ReportEvidenceInput({ registration, onSaved }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const save = async () => {
    if (!text.trim() && !files.length) return;
    setSaving(true); setMessage("");
    try {
      const user = await base44.auth.me();
      const uploaded = [];
      for (const file of files) uploaded.push(await base44.integrations.Core.UploadPrivateFile({ file }));
      const draft = await base44.entities.ReportInputDraft.create({ user_email: user.email, aircraft_registration: registration, listing_text: text.trim(), document_uris: uploaded.map(x => x.file_uri), document_names: files.map(x => x.name), status: "attached" });
      onSaved?.(draft.id); setMessage(`${files.length} document(s) and listing text attached privately.`);
    } catch (error) { setMessage(error.message || "Evidence could not be saved."); }
    finally { setSaving(false); }
  };
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2"><FileUp className="h-5 w-5 text-primary" /><h2 className="text-sm font-bold">Add Evidence for a Better Report</h2></div>
      <label htmlFor="listing-text" className="mt-4 block text-xs font-semibold">Listing Text</label>
      <textarea id="listing-text" value={text} onChange={e => setText(e.target.value)} rows={5} className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Paste the complete aircraft advertisement, equipment, maintenance and price details…" />
      <label htmlFor="report-documents" className="mt-4 block text-xs font-semibold">Documents</label>
      <input id="report-documents" type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} className="mt-2 block w-full text-sm" />
      <p className="mt-2 text-xs text-muted-foreground">Add multiple files; they are stored privately. The storage provider’s per-file upload limit still applies.</p>
      <button type="button" onClick={save} disabled={saving || (!text.trim() && !files.length)} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Saving…" : "Attach to Report"}</button>
      {message && <p className="mt-3 text-xs text-muted-foreground" role="status">{message}</p>}
    </section>
  );
}