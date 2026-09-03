import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plane, Check, ArrowRight, Mail, MapPin, Sparkles } from "lucide-react";

const AFFILIATE_URL = import.meta.env.VITE_AIRVISIONS_AFFILIATE_URL || "https://www.airvisions.cz/";
const AFFILIATE_SLUG = import.meta.env.VITE_AIRVISIONS_AFFILIATE_SLUG || "ABOS_SKYLARK";

// Prices are intentionally configuration placeholders until AirVisions supplies the official 2026 price matrix.
// Set VITE_SKYLARK_BASE_PRICE and option prices when the manufacturer confirms them.
const BASE_PRICE = Number(import.meta.env.VITE_SKYLARK_BASE_PRICE || 0);
const ENGINES = [
  { id: "rotax-912", label: "Rotax 912", price: 0 },
  { id: "rotax-914", label: "Rotax 914", price: 0 },
  { id: "rotax-915-is", label: "Rotax 915 iS", price: 0 },
  { id: "rotax-916-is", label: "Rotax 916 iS", price: 0 },
];
const AVIONICS = [
  { id: "standard", label: "Standard avionics", price: 0 },
  { id: "advanced", label: "Advanced avionics package", price: 0 },
];
const EQUIPMENT = [
  { id: "premium-interior", label: "Premium interior", price: 0 },
  { id: "custom-paint", label: "Custom paint", price: 0 },
  { id: "additional-options", label: "Additional equipment", price: 0 },
];

function money(value) {
  if (!value) return "Price to be confirmed";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export default function SkylarkConfigurator() {
  const [engine, setEngine] = useState(ENGINES[0].id);
  const [avionics, setAvionics] = useState(AVIONICS[0].id);
  const [equipment, setEquipment] = useState([]);
  const [paint, setPaint] = useState("Standard");
  const [demoFlight, setDemoFlight] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("en");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedEngine = ENGINES.find(x => x.id === engine);
  const selectedAvionics = AVIONICS.find(x => x.id === avionics);
  const selectedEquipment = EQUIPMENT.filter(x => equipment.includes(x.id));
  const total = useMemo(() => BASE_PRICE + (selectedEngine?.price || 0) + (selectedAvionics?.price || 0) + selectedEquipment.reduce((s, x) => s + x.price, 0), [selectedEngine, selectedAvionics, selectedEquipment]);
  const priceStatus = total > 0 ? "indicative" : "not_configured";

  const toggleEquipment = id => setEquipment(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (honeypot) return;
    if (!name.trim() || !email.trim() || !consent) {
      setError(language === "cs" ? "Vyplňte jméno, e-mail a souhlas se zpracováním údajů." : "Please enter your name, email and accept the privacy notice.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(), email: email.trim(), country: country.trim(), language,
        engine: selectedEngine?.label, avionics: selectedAvionics?.label,
        equipment: selectedEquipment.map(x => x.label), paint,
        estimated_price: total || null, currency: "EUR", price_status: priceStatus,
        campaign: "airvisions-skylark-90d", affiliate_slug: AFFILIATE_SLUG,
        referrer: typeof window !== "undefined" ? window.location.href : "",
        demo_flight_interest: demoFlight, consent: true, website: honeypot,
      };
      await base44.functions.invoke("submitSkylarkQuote", payload);
      setSubmitted(true);
      setTimeout(() => window.location.assign(`${AFFILIATE_URL}${AFFILIATE_URL.includes("?") ? "&" : "?"}abos_ref=${encodeURIComponent(AFFILIATE_SLUG)}`), 900);
    } catch (err) {
      setError(err?.message || (language === "cs" ? "Poptávku se nepodařilo odeslat." : "We could not send your request. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return <main className="min-h-screen bg-[#f7f4ef] text-[#111827] flex items-center justify-center p-6"><section className="max-w-xl w-full rounded-3xl bg-white border border-black/10 p-8 md:p-12 text-center shadow-xl"><div className="mx-auto mb-5 w-14 h-14 rounded-full bg-[#d6ad45] flex items-center justify-center"><Check className="w-7 h-7" /></div><p className="text-xs uppercase tracking-[.2em] font-bold text-[#8b6a20]">Aircraft Buy Or Sell × LANDA Aircraft</p><h1 className="text-3xl font-black mt-3">{language === "cs" ? "Vaše konfigurace je připravena." : "Your configuration is ready."}</h1><p className="mt-4 text-black/60">{total ? `${money(total)} indicative configuration price.` : "AirVisions will confirm the indicative price for your selected configuration."}</p><p className="mt-2 text-sm text-black/50">Redirecting you to AirVisions…</p></section></main>;
  }

  const cs = language === "cs";
  return <main className="min-h-screen bg-[#f7f4ef] text-[#111827]">
    <header className="border-b border-black/10 bg-white/80 backdrop-blur sticky top-0 z-20"><div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-[#d6ad45] flex items-center justify-center"><Plane className="w-5 h-5" /></div><div><div className="font-black tracking-tight">AIRCRAFT BUY OR SELL</div><div className="text-[10px] uppercase tracking-[.18em] text-black/45">LANDA Aircraft · Skylark</div></div></div><select value={language} onChange={e => setLanguage(e.target.value)} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold"><option value="en">English</option><option value="cs">Čeština</option></select></div></header>
    <div className="max-w-6xl mx-auto px-5 py-10 md:py-16 grid lg:grid-cols-[1.2fr_.8fr] gap-10">
      <section><p className="text-xs uppercase tracking-[.2em] font-bold text-[#8b6a20]">{cs ? "Vyrobeno v České republice" : "Built in the Czech Republic"}</p><h1 className="text-4xl md:text-6xl font-black tracking-tight mt-3">{cs ? "Sestavte si svůj Skylark." : "Build your Skylark."}</h1><p className="text-lg text-black/55 max-w-2xl mt-5">{cs ? "Vyberte motorizaci a výbavu. Odešlete konfiguraci a obdržíte nezávaznou orientační cenu e-mailem." : "Choose your engine and equipment. Submit your configuration and receive a non-binding indicative price by email."}</p>
        <div className="mt-8 rounded-3xl overflow-hidden bg-[#18201f] text-white p-7 md:p-9 min-h-[250px] flex flex-col justify-end"><p className="text-[10px] uppercase tracking-[.2em] text-white/45">LANDA AIRCRAFT</p><h2 className="text-3xl md:text-4xl font-black mt-2">SKYLARK</h2><p className="text-white/55 mt-2">Two-seat · low-wing · Czech-built</p><div className="mt-6 flex gap-3 flex-wrap"><span className="px-3 py-1.5 rounded-full bg-white/10 text-xs">AirVisions</span><span className="px-3 py-1.5 rounded-full bg-white/10 text-xs">Aircraft Buy Or Sell</span></div></div>
      </section>
      <form onSubmit={submit} className="bg-white rounded-3xl border border-black/10 shadow-lg p-6 md:p-8 space-y-7">
        <div><p className="text-xs uppercase tracking-[.16em] font-bold text-black/40">01 · {cs ? "Motorizace" : "Engine"}</p><div className="grid grid-cols-2 gap-2 mt-3">{ENGINES.map(x => <button type="button" key={x.id} onClick={() => setEngine(x.id)} className={`text-left rounded-2xl border p-3 transition ${engine === x.id ? "border-[#c59a32] bg-[#fbf5e5]" : "border-black/10"}`}><div className="font-bold text-sm">{x.label}</div><div className="text-[11px] text-black/45">{x.price ? money(x.price) : "Manufacturer pricing"}</div></button>)}</div></div>
        <div><p className="text-xs uppercase tracking-[.16em] font-bold text-black/40">02 · {cs ? "Avionika" : "Avionics"}</p><div className="grid gap-2 mt-3">{AVIONICS.map(x => <button type="button" key={x.id} onClick={() => setAvionics(x.id)} className={`text-left rounded-2xl border p-3 ${avionics === x.id ? "border-[#c59a32] bg-[#fbf5e5]" : "border-black/10"}`}><div className="font-bold text-sm">{x.label}</div></button>)}</div></div>
        <div><p className="text-xs uppercase tracking-[.16em] font-bold text-black/40">03 · {cs ? "Výbava" : "Equipment"}</p><div className="grid gap-2 mt-3">{EQUIPMENT.map(x => <button type="button" key={x.id} onClick={() => toggleEquipment(x.id)} className={`flex items-center justify-between text-left rounded-2xl border p-3 ${equipment.includes(x.id) ? "border-[#c59a32] bg-[#fbf5e5]" : "border-black/10"}`}><span className="font-bold text-sm">{x.label}</span>{equipment.includes(x.id) && <Check className="w-4 h-4" />}</button>)}</div></div>
        <div><p className="text-xs uppercase tracking-[.16em] font-bold text-black/40">04 · {cs ? "Barva" : "Paint"}</p><select value={paint} onChange={e => setPaint(e.target.value)} className="mt-3 w-full rounded-2xl border border-black/10 p-3 bg-white"><option>Standard</option><option>Custom</option></select></div>
        <label className="flex gap-3 items-start rounded-2xl bg-[#f7f4ef] p-4 cursor-pointer"><input type="checkbox" checked={demoFlight} onChange={e => setDemoFlight(e.target.checked)} className="mt-1" /><span className="text-sm"><b>{cs ? "Mám zájem o demo flight v Brně" : "I'm interested in a demo flight in Brno"}</b><span className="block text-black/45 text-xs mt-1">DirectFly Brno · subject to availability</span></span></label>
        <div className="border-t border-black/10 pt-6"><p className="text-xs uppercase tracking-[.16em] font-bold text-black/40">05 · {cs ? "Kam poslat cenu" : "Where should we send it?"}</p><div className="space-y-3 mt-3"><input required value={name} onChange={e => setName(e.target.value)} placeholder={cs ? "Jméno a příjmení" : "Full name"} className="w-full rounded-2xl border border-black/10 p-3.5 outline-none focus:border-[#c59a32]" /><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-2xl border border-black/10 p-3.5 outline-none focus:border-[#c59a32]" /><div className="grid grid-cols-2 gap-3"><input value={country} onChange={e => setCountry(e.target.value)} placeholder={cs ? "Země" : "Country"} className="w-full rounded-2xl border border-black/10 p-3.5" /><input value={honeypot} onChange={e => setHoneypot(e.target.value)} aria-hidden="true" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] opacity-0" /></div><label className="flex gap-2 text-xs text-black/55"><input required type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> {cs ? "Souhlasím se zpracováním údajů pro vyřízení poptávky." : "I agree to the processing of my data to handle this request."}</label></div></div>
        <div className="rounded-2xl bg-[#18201f] text-white p-5"><div className="text-xs text-white/45 uppercase tracking-[.15em]">{cs ? "Orientační cena konfigurace" : "Indicative configuration price"}</div><div className="text-2xl font-black mt-1">{money(total)}</div><div className="text-[11px] text-white/45 mt-1">{total ? "Non-binding indicative price" : "Final pricing confirmed by AirVisions"}</div></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-2xl bg-[#d6ad45] hover:bg-[#c59a32] disabled:opacity-50 p-4 font-black flex items-center justify-center gap-2">{loading ? (cs ? "Odesílám…" : "Sending…") : (cs ? "Získat nezávaznou cenu" : "Get indicative price")}<ArrowRight className="w-4 h-4" /></button>
        <p className="text-[10px] text-black/40 text-center flex items-center justify-center gap-1"><Mail className="w-3 h-3" /> {cs ? "Cena a potvrzení konfigurace přijde na e-mail." : "Your configuration and indicative price will be sent by email."}</p>
      </form>
    </div>
    <footer className="max-w-6xl mx-auto px-5 pb-10 text-xs text-black/40 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Brno · Czech Republic <Sparkles className="w-3.5 h-3.5 ml-2" /> Aircraft Buy Or Sell manufacturer pilot</footer>
  </main>;
}
