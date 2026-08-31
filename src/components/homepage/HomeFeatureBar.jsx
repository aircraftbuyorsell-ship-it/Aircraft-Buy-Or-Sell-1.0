import { BarChart3, ShieldCheck, Network } from "lucide-react";

const FEATURES = [
{ icon: BarChart3, value: "285K+ ", label: "Aircraft records" },
{ icon: ShieldCheck, value: null, label: "Verified ownership signals" },
{ icon: Network, value: null, label: "One connected deal workflow" }];


export default function HomeFeatureBar() {
  return (
    <div className="border-y border-border bg-card/50">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-around gap-6 px-4 py-6 sm:flex-row sm:gap-4 sm:px-8">
        {FEATURES.map((f) =>
        <div key={f.label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              {f.value && <span className="text-[18px] font-black text-foreground">{f.value} </span>}
              <span className="text-[13px] font-semibold text-muted-foreground">{f.label}</span>
            </div>
          </div>
        )}
      </div>
    </div>);

}