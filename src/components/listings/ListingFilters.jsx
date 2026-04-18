import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";

export default function ListingFilters({ filters, setFilters, makes, maxPrice }) {
  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));
  const currentYear = new Date().getFullYear();

  return (
    <div className="p-5 space-y-6 sticky top-0">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-widest">
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </div>

      {/* Search */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            className="pl-9 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 h-9 text-sm"
            placeholder="Make, model, reg…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
          />
        </div>
      </div>

      {/* Make */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Make</label>
        <select
          className="w-full bg-slate-800 border border-slate-700 rounded-md text-slate-100 text-sm h-9 px-3 focus:outline-none focus:ring-1 focus:ring-sky-500"
          value={filters.make}
          onChange={(e) => set("make", e.target.value)}
        >
          <option value="">All makes</option>
          {makes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5">
          Price: ${filters.priceMin.toLocaleString()} — ${filters.priceMax.toLocaleString()}
        </label>
        <div className="space-y-2">
          <input
            type="range" min={0} max={maxPrice} step={5000}
            value={filters.priceMin}
            onChange={(e) => set("priceMin", +e.target.value)}
            className="w-full accent-sky-500"
          />
          <input
            type="range" min={0} max={maxPrice} step={5000}
            value={filters.priceMax}
            onChange={(e) => set("priceMax", +e.target.value)}
            className="w-full accent-sky-500"
          />
        </div>
      </div>

      {/* ATI min */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5">
          ATI Score min: {filters.atiMin}
        </label>
        <input
          type="range" min={0} max={100} step={1}
          value={filters.atiMin}
          onChange={(e) => set("atiMin", +e.target.value)}
          className="w-full accent-violet-500"
        />
      </div>

      {/* Year range */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5">
          Year: {filters.yearFrom} — {filters.yearTo}
        </label>
        <div className="space-y-2">
          <input
            type="range" min={1960} max={currentYear} step={1}
            value={filters.yearFrom}
            onChange={(e) => set("yearFrom", +e.target.value)}
            className="w-full accent-emerald-500"
          />
          <input
            type="range" min={1960} max={currentYear} step={1}
            value={filters.yearTo}
            onChange={(e) => set("yearTo", +e.target.value)}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => setFilters({ search: "", make: "", priceMin: 0, priceMax: maxPrice, atiMin: 0, yearFrom: 1960, yearTo: currentYear })}
        className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors"
      >
        Reset filters
      </button>
    </div>
  );
}