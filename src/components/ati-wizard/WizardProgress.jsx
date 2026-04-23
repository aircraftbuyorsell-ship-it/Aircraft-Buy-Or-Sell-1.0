import { Check } from "lucide-react";

export default function WizardProgress({ dimensions, currentIndex, onJump, completedKeys }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {dimensions.map((d, i) => {
        const done = completedKeys.has(d.key);
        const active = i === currentIndex;
        return (
          <button
            key={d.key}
            onClick={() => onJump(i)}
            className={`flex items-center gap-1.5 shrink-0 text-[10px] uppercase tracking-wider font-black px-2.5 py-1.5 rounded-full border transition-colors ${
              active
                ? "bg-[#0B2D5B] text-white border-[#0B2D5B]"
                : done
                ? "bg-[rgba(15,122,86,0.08)] text-[#0F7A56] border-[rgba(15,122,86,0.25)]"
                : "bg-white text-[#AAA49C] border-black/10 hover:border-[#0B2D5B]"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
              active ? "bg-[#E8A83A] text-[#0B2D5B]" : done ? "bg-[#0F7A56] text-white" : "bg-black/10 text-[#6B6560]"
            }`}>
              {done ? <Check className="w-2.5 h-2.5" /> : i + 1}
            </span>
            <span className="hidden md:inline">{d.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}