import { useState, useMemo } from "react";
import { Globe, X, Check, Search } from "lucide-react";

export default function CountryPicker({ countries = [], value, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return countries;
    const s = q.toLowerCase();
    return countries.filter((c) =>
      (c.name || c.countryName || "").toLowerCase().includes(s) ||
      (c.code || c.countryCode || "").toLowerCase().includes(s)
    );
  }, [countries, q]);

  const selected = countries.find(
    (c) => (c.name || c.countryName) === value
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2.5 bg-white border border-black/10 rounded-xl text-sm hover:border-[#0B2D5B] transition-colors min-w-[140px]"
      >
        <Globe className="w-4 h-4 text-[#E8A83A] shrink-0" />
        <span className={`truncate ${value ? "text-[#1A1814] font-bold" : "text-[#6B6560]"}`}>
          {value || "All countries"}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setOpen(false)} />
          <div className="fixed left-0 right-0 bottom-0 sm:inset-0 sm:m-auto sm:max-w-md sm:max-h-[80vh] sm:rounded-2xl z-[61] bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col safe-bottom">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/[0.06]">
              <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[#0B2D5B]">Select country</p>
              <button onClick={() => setOpen(false)} className="text-[#6B6560] hover:text-[#1A1814]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-black/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search country…"
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <button
                onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full flex items-center justify-between px-5 py-3 text-left border-b border-black/[0.04] ${!value ? "bg-[rgba(11,45,91,0.06)]" : "hover:bg-[#F7F4EF]"}`}
              >
                <span className={`text-[15px] ${!value ? "font-black text-[#0B2D5B]" : "text-[#1A1814]"}`}>
                  🌍 All countries
                </span>
                {!value && <Check className="w-5 h-5 text-[#0B2D5B]" />}
              </button>

              {filtered.map((c, i) => {
                const name = c.name || c.countryName;
                const isSel = name === value;
                return (
                  <button
                    key={name + i}
                    onClick={() => { onChange(name); setOpen(false); }}
                    className={`w-full flex items-center justify-between px-5 py-3 text-left border-b border-black/[0.04] ${isSel ? "bg-[rgba(11,45,91,0.06)]" : "hover:bg-[#F7F4EF]"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {c.flag && <img src={c.flag} alt="" className="w-6 h-4 object-cover rounded-sm shrink-0" onError={(e) => e.currentTarget.style.display = "none"} />}
                      <span className={`text-[15px] truncate ${isSel ? "font-black text-[#0B2D5B]" : "text-[#1A1814]"}`}>{name}</span>
                      {c.stationscount != null && (
                        <span className="text-[10px] text-[#AAA49C] shrink-0">{c.stationscount}</span>
                      )}
                    </div>
                    {isSel && <Check className="w-5 h-5 text-[#0B2D5B] shrink-0" />}
                  </button>
                );
              })}

              {!loading && filtered.length === 0 && (
                <p className="text-sm text-[#AAA49C] text-center py-10">No countries found</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}