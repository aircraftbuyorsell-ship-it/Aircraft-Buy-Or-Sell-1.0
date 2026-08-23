import { useState } from "react";
import { FileText, PenLine } from "lucide-react";
import AircraftLookup from "@/components/bill-of-sale/AircraftLookup";
import FieldGroup from "@/components/bill-of-sale/FieldGroup";
import WarningsPanel from "@/components/bill-of-sale/WarningsPanel";
import ReviewTable from "@/components/bill-of-sale/ReviewTable";
import OwnershipUpload from "@/components/bill-of-sale/OwnershipUpload";
import ConfirmationsPanel from "@/components/bill-of-sale/ConfirmationsPanel";
import DraftActions from "@/components/bill-of-sale/DraftActions";
import useBillOfSaleDraft from "@/hooks/useBillOfSaleDraft";
import { FIELD_GROUPS } from "@/lib/billOfSale";
import FAAFormsLinks from "@/components/aircraft/FAAFormsLinks";

export default function BillOfSaleAutofill() {
  const [view, setView] = useState("edit");
  const { draft, update, setValue, lookup, save, loading, saving, error } = useBillOfSaleDraft();
  return <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-24 pt-10 md:px-8">
    <header className="mb-7"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><FileText className="h-3.5 w-3.5" /> ABOS Smart Document Fill</div><h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">FAA Bill of Sale Autofill</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Prepare a review draft for FAA AC Form 8050-2 using FAA and ABOS data. Signatures are never generated or autofilled, and ABOS does not claim legal validity without complete human review.</p></header>
    <div className="mb-5 flex gap-2"><button onClick={() => setView("edit")} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${view === "edit" ? "bg-primary text-primary-foreground" : "border border-border text-foreground"}`}><PenLine className="mr-2 inline h-4 w-4" />Edit draft</button><button onClick={() => setView("review")} className={`min-h-11 rounded-xl px-4 text-sm font-bold ${view === "review" ? "bg-primary text-primary-foreground" : "border border-border text-foreground"}`}>Smart review ({draft.warnings.length})</button></div>
    {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>}
    <div className="space-y-5"><AircraftLookup onLookup={lookup} loading={loading} />{view === "edit" ? <>{FIELD_GROUPS.map((group) => <FieldGroup key={group.title} group={group} draft={draft} onChange={update} />)}<OwnershipUpload urls={draft.chain_of_ownership_urls} onChange={(urls) => setValue("chain_of_ownership_urls", urls)} /><ConfirmationsPanel draft={draft} onChange={setValue} /></> : <><ReviewTable draft={draft} /><WarningsPanel warnings={draft.warnings} /><ConfirmationsPanel draft={draft} onChange={setValue} /></>}<FAAFormsLinks context="transaction" compact /><DraftActions draft={draft} save={save} saving={saving} /></div>
  </main>;
}