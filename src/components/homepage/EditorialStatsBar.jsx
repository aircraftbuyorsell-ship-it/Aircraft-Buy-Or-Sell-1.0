import { BarChart3, ShieldCheck, Share2 } from "lucide-react";

const stats = [
  { Icon: BarChart3, label: "170K+ Aircraft records" },
  { Icon: ShieldCheck, label: "Verified ownership signals" },
  { Icon: Share2, label: "One connected deal workflow" },
];

export default function EditorialStatsBar() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {stats.map(({ Icon, label }) => <div key={label} className="flex items-center gap-4 px-6 py-6 md:px-10"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border"><Icon className="h-5 w-5 stroke-[1.5] text-foreground" /></span><p className="text-sm font-semibold text-foreground">{label}</p></div>)}
      </div>
    </section>
  );
}