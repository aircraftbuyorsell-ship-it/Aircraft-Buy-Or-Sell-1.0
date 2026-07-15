import { BarChart3, CheckCircle2, ChevronRight, CircleDollarSign, UserRound } from "lucide-react";

const detailLinks = [
  { label: "ATI Report", Icon: BarChart3 },
  { label: "Owner", Icon: UserRound },
  { label: "Costs", Icon: CircleDollarSign },
];

export default function EditorialHudCard() {
  return (
    <aside className="w-full max-w-[310px] rounded-xl border border-border bg-card p-4 shadow-xl">
      <p className="text-2xl font-extrabold tracking-[-0.04em] text-foreground">N721AB</p>
      <p className="mt-0.5 text-sm text-muted-foreground">Phenom 300E</p>
      <div className="my-4 border-y border-border py-3">
        <div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground">ATI 84</span><span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent" /></div>
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Serial verified</div>
        <div className="mt-3"><div className="flex justify-between text-xs text-muted-foreground"><span>Deal readiness</span><span className="font-semibold text-foreground">72%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[72%] rounded-full bg-emerald-600" /></div></div>
      </div>
      <div className="divide-y divide-border border-t border-border">
        {detailLinks.map(({ label, Icon }) => <div key={label} className="flex items-center justify-between py-2.5 text-sm font-medium text-foreground"><span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>)}
      </div>
    </aside>
  );
}