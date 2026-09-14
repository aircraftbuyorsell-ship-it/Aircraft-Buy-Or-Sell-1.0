import { Database, Loader2, Radar, RefreshCw, Search, X } from "lucide-react";
import GlobeLayerFilter from "@/components/dashboard/GlobeLayerFilter";
import "@/components/traffic/intelligence-globe.css";

export default function IntelligenceGlobeHeader({ stats, filter, onFilterChange, search, onSearchChange, onSearch, onClear, refreshing, onRefresh }) {
  return <header className="ig-header">
    <div className="ig-title"><span className="ig-title-icon"><Radar /></span><div><span>Flight intelligence</span><h1>Aircraft Intelligence Globe</h1></div></div>
    <div className="ig-stats">
      {stats.map((stat) => <div key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}
    </div>
    <div className="ig-actions">
      <GlobeLayerFilter darkMode filter={filter} onChange={onFilterChange} />
      <form className="ig-search" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
        <div><Search /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="N-number, ICAO or callsign" aria-label="Aircraft identifier" />{search && <button type="button" onClick={onClear} aria-label="Clear search"><X /></button>}</div>
        <button type="submit"><Search /><span>Check</span></button>
      </form>
      <button className="ig-refresh" type="button" onClick={onRefresh} disabled={refreshing}>{refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}<span>Refresh</span></button>
    </div>
  </header>;
}