export default function ProtocolTabs({ active, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] p-1" role="tablist" aria-label="Protocol documentation">
      {[['rfc', 'RFC Series'], ['specs', 'Protocol Specs']].map(([key, label]) => (
        <button key={key} role="tab" aria-selected={active === key} onClick={() => onChange(key)} className="min-h-11 rounded-full px-5 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c242]" style={active === key ? { background: "#f5c242", color: "#04060a" } : { color: "rgba(255,255,255,.62)" }}>{label}</button>
      ))}
    </div>
  );
}