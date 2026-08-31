import { CheckCircle2, Clock3, Radio } from 'lucide-react';
export default function InspectionStatus({ status }) {
  const done = status === 'finalized'; const active = ['in_progress','analysis_ready'].includes(status);
  const Icon = done ? CheckCircle2 : active ? Radio : Clock3;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${done ? 'border-emerald-500/30 text-emerald-400' : active ? 'border-gold/30 text-gold' : 'border-border text-muted-foreground'}`}><Icon className="h-3.5 w-3.5" />{status.replaceAll('_',' ')}</span>;
}