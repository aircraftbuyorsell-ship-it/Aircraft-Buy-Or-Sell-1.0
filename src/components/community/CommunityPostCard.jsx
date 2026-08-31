import { MessageCircle, ShieldCheck } from "lucide-react";
import { C } from "@/theme/community";

export default function CommunityPostCard({ tag, title, body, meta }) {
  return (
    <article className="rounded-[1.5rem] p-5 transition-transform hover:-translate-y-0.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em]" style={{ background: C.blue, color: "#fff" }}>{tag}</span>
        <ShieldCheck className="h-4 w-4" style={{ color: C.gold }} />
      </div>
      <h3 className="text-lg font-black tracking-[-0.04em]" style={{ color: C.text }}>{title}</h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textMuted }}>{body}</p>
      <div className="mt-5 flex items-center justify-between border-t pt-4 text-[11px] font-bold" style={{ borderColor: C.border, color: C.textDim }}>
        <span>{meta}</span>
        <span className="inline-flex items-center gap-1" style={{ color: C.goldLight }}><MessageCircle className="h-3.5 w-3.5" /> Discuss</span>
      </div>
    </article>
  );
}