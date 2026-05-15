import { MessageCircle, ShieldCheck } from "lucide-react";

export default function CommunityPostCard({ tag, title, body, meta }) {
  return (
    <article className="rounded-[1.5rem] border border-white/70 bg-white/64 p-5 shadow-[0_18px_55px_rgba(11,45,91,0.08)] backdrop-blur-xl transition-transform hover:-translate-y-0.5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#0B2D5B]/90 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white">{tag}</span>
        <ShieldCheck className="h-4 w-4 text-[#D4A017]" />
      </div>
      <h3 className="text-lg font-black tracking-[-0.04em] text-[#1A1814]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#6B6560]">{body}</p>
      <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 text-[11px] font-bold text-[#AAA49C]">
        <span>{meta}</span>
        <span className="inline-flex items-center gap-1 text-[#0B2D5B]"><MessageCircle className="h-3.5 w-3.5" /> Discuss</span>
      </div>
    </article>
  );
}