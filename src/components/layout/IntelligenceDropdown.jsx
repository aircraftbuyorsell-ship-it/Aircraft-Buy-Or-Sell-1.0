import GuidedToolCard from "@/components/layout/GuidedToolCard";

const FEATURED = ["/valuation", "/ati-quick-score", "/opex-calculator"];
const DESCRIPTIONS = {
  "/valuation": "Estimate a market-supported aircraft value using OMVM intelligence.",
  "/ati-quick-score": "Screen aircraft transparency across eight ATI dimensions.",
  "/opex-calculator": "Calculate annual ownership, operating costs and reserves.",
  "/insurance-calculator": "Estimate insurance exposure from aircraft and usage.",
  "/leasing-calculator": "Compare lease structure, payments and total commitment.",
  "/avionics-upgrade-calculator": "Model avionics investment and upgrade economics.",
  "/exterior-refurbishment-calculator": "Budget paint and exterior refurbishment work.",
  "/interior-refurbishment-calculator": "Estimate cabin interior renewal costs.",
  "/aircraft-detailing-calculator": "Plan detailing scope and expected expense.",
  "/upgrade-comparison": "Compare upgrade scenarios side by side.",
};

export default function IntelligenceDropdown({ section, onNavigate }) {
  const allItems = section.categories.flatMap((category) => category.items);
  const featured = FEATURED.map((path) => allItems.find((item) => item.path === path)).filter(Boolean);
  const calculators = section.categories.find((category) => category.label === "Cost Calculators")?.items.filter((item) => !FEATURED.includes(item.path)) || [];
  const remaining = allItems.filter((item) => !FEATURED.includes(item.path) && !calculators.some((calculator) => calculator.path === item.path));

  return (
    <div className="w-[720px] space-y-4">
      <div><p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-gold/80">Recommended first steps</p><div className="grid grid-cols-3 gap-2">{featured.map((item) => <GuidedToolCard key={item.path} item={item} description={DESCRIPTIONS[item.path]} featured onClick={() => onNavigate(item.path)} />)}</div></div>
      <div><p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-gold/65">More calculators</p><div className="grid grid-cols-4 gap-2">{calculators.map((item) => <GuidedToolCard key={item.path} item={item} description={DESCRIPTIONS[item.path]} onClick={() => onNavigate(item.path)} />)}</div></div>
      <div><p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">Explore intelligence</p><div className="flex flex-wrap gap-1.5">{remaining.map((item) => { const Icon = item.icon; return <button key={item.path} onClick={() => onNavigate(item.path)} className="flex min-h-9 items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 text-[10px] font-semibold text-white/60 transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-white">{Icon && <Icon size={13} className="text-gold/70" />}{item.label}</button>; })}</div></div>
    </div>
  );
}