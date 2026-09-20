/**
 * KnowledgeColumns — "What we know / What we don't know / What to verify next".
 *
 * The three columns carry equal visual weight on purpose. A platform that
 * renders its certainties large and its gaps small is not being honest about
 * what it knows, and the gap column is where most of a buyer's money is at
 * risk.
 */

import React from "react";
import { CircleCheck, CircleHelp, ArrowRight, Info } from "lucide-react";
import { KNOWLEDGE_CAVEAT } from "@/intelligence";
import { StatusPill } from "../TrustPrimitives";

const PRIORITY_CHIP = {
  high: "border-[#C0392B]/25 bg-[#C0392B]/10 text-[#C0392B]",
  medium: "border-[#D4A017]/30 bg-[#D4A017]/10 text-[#8b6a20] dark:text-[#E8C46A]",
  low: "border-black/10 bg-white text-[#AAA49C] dark:border-white/10 dark:bg-white/5 dark:text-white/40",
};

function Column({ icon: Icon, tone, title, children, className = "" }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${tone}`} strokeWidth={2.5} />
        <h3 className="text-sm font-black text-[#1A1814] dark:text-white">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function KnowledgeColumns({ knowledge, onToggleTask = null, completed = [], className = "" }) {
  if (!knowledge) return null;
  const { know = [], dontKnow = [], verifyNext = [] } = knowledge;

  return (
    <div className={`rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/5 md:p-6 ${className}`}>
      <div className="grid gap-8 md:grid-cols-3">

        <Column icon={CircleCheck} tone="text-emerald-600" title="What we know">
          {know.length ? (
            <ul className="space-y-2.5">
              {know.map((item) => (
                <li key={item.key} className="text-sm text-[#6B6560] dark:text-white/65">
                  <span className="mr-1.5 inline-block h-1 w-1 translate-y-[-2px] rounded-full bg-emerald-600" />
                  {item.text}
                  {item.sources?.length ? (
                    <span className="ml-1.5 text-[11px] text-[#AAA49C]">({item.sources.join(", ")})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#AAA49C]">Nothing has been established yet for this aircraft.</p>
          )}
        </Column>

        <Column icon={CircleHelp} tone="text-[#AAA49C]" title="What we don't know">
          {dontKnow.length ? (
            <ul className="space-y-2.5">
              {dontKnow.map((item) => (
                <li key={item.key} className="text-sm text-[#6B6560] dark:text-white/65">
                  <span className="mr-1.5 inline-block h-1 w-1 translate-y-[-2px] rounded-full bg-[#D9D4CC]" />
                  {item.text}
                  {item.status === "conflicting" ? (
                    <StatusPill status="conflicting" withIcon={false} className="ml-1.5 align-middle" />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#AAA49C]">Every item ABOS looks for was established.</p>
          )}
        </Column>

        <Column icon={ArrowRight} tone="text-[#8b6a20] dark:text-[#E8C46A]" title="What to verify next">
          {verifyNext.length ? (
            <ul className="space-y-2.5">
              {verifyNext.map((task, i) => {
                const done = completed.includes(task.action);
                return (
                  <li key={i} className="flex items-start gap-2">
                    {onToggleTask ? (
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => onToggleTask(task.action)}
                        className="mt-1 h-3.5 w-3.5 shrink-0 accent-[#D4A017]"
                        aria-label={task.action}
                      />
                    ) : (
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#D4A017]" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm ${done ? "text-[#AAA49C] line-through" : "text-[#1A1814] dark:text-white/85"}`}>
                        {task.action}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_CHIP[task.priority] || PRIORITY_CHIP.low}`}>
                          {task.priority}
                        </span>
                        <span className="text-[11px] text-[#AAA49C]">{task.reason}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[#AAA49C]">Nothing further is queued. A pre-purchase inspection is the next step.</p>
          )}
        </Column>
      </div>

      <p className="mt-6 flex items-start gap-1.5 border-t border-black/5 pt-4 text-[11px] leading-relaxed text-[#6B6560] dark:border-white/10 dark:text-white/50">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        {KNOWLEDGE_CAVEAT}
      </p>
    </div>
  );
}
