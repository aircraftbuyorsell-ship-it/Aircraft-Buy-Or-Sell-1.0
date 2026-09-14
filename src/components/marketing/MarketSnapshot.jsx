export default function MarketSnapshot({ market }) {
  const summary = market?.summary;
  const metrics = [["Active listings", summary?.active ?? "—"], ["Median asking", summary?.medianPrice ? `$${summary.medianPrice.toLocaleString()}` : "—"], ["12-month trend", market?.delta?.pct != null ? `${market.delta.pct > 0 ? "+" : ""}${market.delta.pct}%` : "—"]];
  return <section className="grid grid-cols-3 gap-2">{metrics.map(([label, value]) => <div key={label} className="social-metric"><span>{label}</span><strong>{value}</strong></div>)}</section>;
}