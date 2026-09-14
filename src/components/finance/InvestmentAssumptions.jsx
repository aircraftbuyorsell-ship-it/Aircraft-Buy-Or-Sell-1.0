const FIELDS = [
  ["purchase_price", "Purchase price ($)"], ["down_payment_pct", "Down payment (%)"],
  ["interest_rate_pct", "Interest rate (%)"], ["loan_term_years", "Loan term (years)"],
  ["holding_period_years", "Holding period (years)"], ["residual_value_pct", "Residual value (%)"],
  ["downtime_days", "Downtime (days/year)"], ["maintenance_reserve_annual", "Maintenance reserve ($/year)"],
  ["transaction_costs", "Transaction costs ($)"],
];

export default function InvestmentAssumptions({ value, onChange }) {
  const update = (key, next) => onChange({ ...value, [key]: Number(next) });
  return <fieldset className="space-y-3"><legend className="text-xs font-bold text-foreground">Ownership assumptions</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{FIELDS.map(([key, label]) => <label key={key} className="block"><span className="mb-1 block text-xs text-muted-foreground">{label}</span><input type="number" min="0" value={value[key]} onChange={event => update(key, event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" /></label>)}</div><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs text-muted-foreground">VAT status</span><select value={value.vat_status} onChange={event => onChange({ ...value, vat_status: event.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="unknown">Not confirmed</option><option value="recoverable">Recoverable</option><option value="non_recoverable">Non-recoverable</option></select></label><label><span className="mb-1 block text-xs text-muted-foreground">Ownership structure</span><select value={value.ownership_structure} onChange={event => onChange({ ...value, ownership_structure: event.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"><option value="individual">Individual</option><option value="company">Company</option><option value="partnership">Partnership</option></select></label></div></fieldset>;
}