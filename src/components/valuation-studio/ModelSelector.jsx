import { Check, Globe, Sparkles, Zap, Brain, Wand2 } from "lucide-react";

export const VALUATION_MODELS = [
  { id: "gemini_3_flash", label: "Gemini 3 Flash", desc: "Live web search · fast", icon: Globe, tag: "default", web: true },
  { id: "gemini_3_1_pro", label: "Gemini 3.1 Pro", desc: "Live web search · higher quality", icon: Sparkles, tag: "slower", web: true },
  { id: "gpt_5_mini", label: "GPT-5 Mini", desc: "Knowledge estimate · fast fallback", icon: Zap, tag: "fallback", web: false },
  { id: "claude_sonnet_4_6", label: "Claude Sonnet 4.6", desc: "Reasoning estimate · fallback", icon: Brain, tag: "fallback", web: false },
  { id: "automatic", label: "Automatic", desc: "Platform picks the model", icon: Wand2, tag: "auto", web: false },
];

export const modelLabel = (id) => VALUATION_MODELS.find((m) => m.id === id)?.label || id;

const TAG_STYLES = {
  default: "bg-[#D4A017]/15 text-[#A67C00]",
  slower: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  fallback: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  auto: "bg-muted text-muted-foreground",
};

export default function ModelSelector({ value, onChange, disabled }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">AI model</p>
        <h3 className="mt-1 text-sm font-black tracking-tight text-foreground">Choose the valuation engine</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Toggle models if the main one fails or you want a second opinion. Only the Gemini models pull live web data;
          the others estimate from training knowledge.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {VALUATION_MODELS.map((m) => {
          const Icon = m.icon;
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(m.id)}
              className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition disabled:opacity-60 ${
                active
                  ? "border-[#D4A017] bg-[#D4A017]/[0.08] ring-1 ring-[#D4A017]/40"
                  : "border-border bg-muted/40 hover:bg-muted"
              }`}
            >
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  active ? "bg-[#D4A017] text-white" : "border border-border bg-background text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-black text-foreground">{m.label}</span>
                  {m.tag && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${TAG_STYLES[m.tag]}`}>
                      {m.tag}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{m.desc}</span>
              </span>
              {active && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-[#D4A017]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}