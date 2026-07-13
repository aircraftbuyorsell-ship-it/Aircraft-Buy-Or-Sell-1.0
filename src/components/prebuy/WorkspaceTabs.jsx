const tabs = ['Overview', 'Checklist', 'Findings', 'Live AI', 'Report', 'Participants'];
export default function WorkspaceTabs({ active, onChange }) {
  return <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Inspection workspace">{tabs.map(tab => <button key={tab} onClick={() => onChange(tab)} className={`whitespace-nowrap px-4 py-3 text-sm font-semibold ${active === tab ? 'border-b-2 border-gold text-gold' : 'text-muted-foreground'}`}>{tab}</button>)}</nav>;
}