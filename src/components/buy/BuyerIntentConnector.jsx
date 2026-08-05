import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function BuyerIntentConnector() {
  const [value, setValue] = useState(""); const [result, setResult] = useState(null); const [loading, setLoading] = useState(false);
  const connect = async (e) => { e.preventDefault(); setLoading(true); const response = await base44.functions.invoke("connectBuyerIntent", { value }); setResult(response.data); setLoading(false); };
  return <section className="rounded-xl border border-border bg-card p-5"><p className="font-mono text-xs uppercase tracking-widest text-accent">The $ connector</p><h2 className="mt-1 text-xl font-bold">Připoj externí inzerát</h2><p className="mt-2 text-sm text-muted-foreground">Vlož URL nebo N-number. ABOS najde protistranu nebo připraví claim link.</p><form onSubmit={connect} className="mt-4 flex gap-2"><label className="sr-only" htmlFor="intent">Listing URL nebo N-number</label><input id="intent" required value={value} onChange={(e) => setValue(e.target.value)} className="min-w-0 flex-1 rounded-lg border px-3" placeholder="URL nebo N123AB" /><Button disabled={loading} className="bg-accent text-accent-foreground">{loading ? "Hledám…" : "Propojit"}</Button></form>{result && <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{result.message}{result.claimUrl && <a className="ml-1 font-semibold text-accent underline" href={result.claimUrl}>Otevřít claim link</a>}</p>}</section>;
}