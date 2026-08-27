import { Brain, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import InvestmentBriefCard, { hasInvestmentBrief } from "@/components/finance/InvestmentBriefCard";

export default function MessageBubble({ message, toolDisplay }) {
  const isUser = message.role === "user";
  const brief = !isUser && hasInvestmentBrief(message.content);
  return <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}><div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isUser ? "bg-accent/15 text-accent" : "bg-gold-bg text-gold"}`}>{isUser ? <User className="h-3.5 w-3.5" /> : <Brain className="h-3.5 w-3.5" />}</div><div className={`flex min-w-0 max-w-[88%] flex-1 flex-col ${isUser ? "items-end" : "items-start"}`}>{!isUser && <span className="mb-1 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Pricing Assistant · AI synthesis</span>}{brief ? <InvestmentBriefCard content={message.content} /> : <div className={`rounded-2xl border border-border px-4 py-2.5 ${isUser ? "rounded-tr-sm bg-accent/10" : "rounded-tl-sm bg-card"}`}>{isUser ? <p className="whitespace-pre-wrap text-sm text-foreground">{message.content}</p> : <ReactMarkdown className="prose prose-sm max-w-none text-foreground dark:prose-invert [&_p]:mb-1.5 [&_ul]:mb-1.5">{message.content}</ReactMarkdown>}</div>}{message.tool_calls?.map((call, i) => toolDisplay(call, i))}</div></div>;
}