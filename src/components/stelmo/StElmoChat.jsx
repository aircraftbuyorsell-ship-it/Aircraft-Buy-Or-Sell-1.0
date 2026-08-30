import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createStElmoTask, updateStElmoTask, listActiveStElmoTasks, subscribeToStElmoTask } from "@/lib/stElmoTaskEngine";
import { runStElmoWorker } from "@/lib/stElmo/worker";
import { buildStElmoEngines } from "@/lib/stElmo/engines";
import { renderStElmoAnswer, describePhase } from "@/lib/stElmo/report";
import { extractRegistration } from "@/lib/abosAgent";
import { BrainCircuit, ChevronDown, Loader2, Maximize2, Minimize2, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const STORAGE_KEY = "abos_st_elmo_chat_v1";
const OPEN_KEY = "abos_st_elmo_chat_open_v1";
const MAX_MESSAGES = 60;

const WELCOME = "St. Elmo M_1.0 online. I can reason across ABOS Verification, Marketspace, ATI, OMVM, Service Intelligence and Deal workflows. What are we working on?";

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : [{ role: "assistant", content: WELCOME }];
  } catch {
    return [{ role: "assistant", content: WELCOME }];
  }
}

export default function StElmoChat() {
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) === "1");
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [backgroundTask, setBackgroundTask] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const endRef = useRef(null);
  // "n5511r check nreg" then "go" then "show results": the aircraft is named once
  // and every follow-up depends on it. Without carrying it, each later turn loses
  // the registration and every capability blocks on a missing precondition.
  const lastRegistrationRef = useRef(null);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES))), [messages]);
  useEffect(() => localStorage.setItem(OPEN_KEY, open ? "1" : "0"), [open]);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  // Resume active server-side tasks after returning to the browser.
  useEffect(() => {
    let cancelled = false;
    listActiveStElmoTasks().then(tasks => {
      if (cancelled || !tasks.length) return;
      const latest = tasks[0];
      setTaskId(latest.id);
      setBackgroundTask({ startedAt: Date.now(), status: latest.phase || latest.status, taskId: latest.id });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!taskId) return;
    return subscribeToStElmoTask(taskId, task => {
      if (!task) return;
      setBackgroundTask({ startedAt: Date.now(), status: task.phase || task.status, taskId });
      if (task.status === "completed" && task.result) {
        const answer = String(task.result.answer || task.result.response || task.result.synthesis || "St. Elmo completed the background run.");
        setMessages(prev => [...prev, { role: "assistant", content: answer, meta: { model: task.result.model || "St. Elmo M_1.0", provider: task.result.provider || "NVIDIA Nemotron" } }].slice(-MAX_MESSAGES));
        setBusy(false);
        setTaskId(null);
        setBackgroundTask(null);
      }
      if (task.status === "failed") {
        setMessages(prev => [...prev, { role: "assistant", content: `Background reasoning failed. ${task.error || "Please retry."}` }].slice(-MAX_MESSAGES));
        setBusy(false);
        setTaskId(null);
        setBackgroundTask(null);
      }
    });
  }, [taskId]);

  // Keep the UI state alive when the browser backgrounds the tab. The actual reasoning call
  // is server-side, so it is not dependent on a foreground React timer.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && busy) {
        setBackgroundTask({ startedAt: Date.now(), status: "running in background" });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [busy]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }].slice(-MAX_MESSAGES);
    setMessages(next);
    setInput("");
    setBusy(true);
    setBackgroundTask(null);

    let task = null;
    try {
      // Task persistence is best-effort. A database/local-storage problem must
      // never be allowed to crash the entire React application.
      task = await createStElmoTask({
        prompt: text,
        conversationId: "global_st_elmo_chat",
        metadata: { page: window.location.pathname }
      });
      if (task?.id) {
        setTaskId(task.id);
        await updateStElmoTask(task.id, { status: "reasoning", phase: "reasoning" });
      }

      if (!task?.id) throw new Error("St. Elmo task could not be initialized");
      const context = {
        source: "global_st_elmo_chat",
        page: window.location.pathname,
        recent_messages: next.slice(-12),
        timestamp: new Date().toISOString(),
      };
      const response = await fetch("https://abos-st-elmo.aircraftbuyorsell.workers.dev/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "abos-st-elmo",
          messages: [
            ...next.slice(-12).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
            { role: "user", content: `ABOS context: ${JSON.stringify(context)}\nRequest: ${text}` },
          ],
          temperature: 0.2,
          max_tokens: 4096,
        }),
      });
      if (!response.ok) throw new Error(`St. Elmo Worker returned ${response.status}`);
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      const data = { ...payload, answer: content || null };

      // Execute the plan. Rendering it as text was the old behaviour: St. Elmo
      // planned and nothing ran. The worker gathers the evidence through the
      // ABOS engines and the answer is built from what actually came back.
      const registration = extractRegistration(text) || lastRegistrationRef.current;
      if (registration) lastRegistrationRef.current = registration;

      const run = await runStElmoWorker({
        plan: data.plan,
        engines: buildStElmoEngines({ entry: "global_st_elmo_chat" }),
        context: { registration, request: text },
        onPhase: (phase) => {
          updateStElmoTask(task.id, { status: phase, phase }).catch(() => {});
          setBackgroundTask({ startedAt: Date.now(), status: describePhase(phase), taskId: task.id });
        },
        onStep: (step) => setBackgroundTask({ startedAt: Date.now(), status: describePhase("tools", step.capability), taskId: task.id }),
      });

      const answer = data.answer || data.response || data.synthesis || renderStElmoAnswer({ reasoning: data, run });
      await updateStElmoTask(task.id, { status: "completed", phase: "synthesis", result: { ...data, worker: run } });
      setMessages(prev => [...prev, { role: "assistant", content: String(answer || "St. Elmo completed the run but returned no text response."), meta: { model: data.model || "St. Elmo M_1.0", provider: data.provider || "NVIDIA Nemotron" } }].slice(-MAX_MESSAGES));
    } catch (error) {
      if (task?.id) {
        try { await updateStElmoTask(task.id, { status: "failed", phase: "failed", error: error?.message || "The reasoning backend is temporarily unavailable." }); } catch {}
      }
      setMessages(prev => [...prev, { role: "assistant", content: `I couldn't complete that reasoning run. ${error?.message || "The reasoning backend is temporarily unavailable."}` }].slice(-MAX_MESSAGES));
    } finally {
      setBusy(false);
      setTaskId(null);
      setBackgroundTask(null);
    }
  }, [busy, input, messages]);

  const clear = () => {
    setMessages([{ role: "assistant", content: WELCOME }]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80] font-sans">
      {open && (
        <div className={`mb-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/95 shadow-2xl shadow-black/40 backdrop-blur-xl ${expanded ? "h-[min(78vh,720px)] w-[min(92vw,760px)]" : "h-[min(68vh,620px)] w-[min(92vw,430px)]"}`}>
          <header className="flex items-center gap-3 border-b border-white/10 bg-white/[0.035] px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8A83A]/30 bg-[#E8A83A]/10 text-[#E8A83A]"><BrainCircuit className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><p className="text-sm font-black text-white">St. Elmo</p><span className="rounded-full border border-[#E8A83A]/30 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-[#E8A83A]">M_1.0</span></div>
              <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">ABOS reasoning agent · Nemotron backend</p>
            </div>
            {busy && <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#E8A83A]"><Loader2 className="h-3 w-3 animate-spin" /> {backgroundTask ? "Background" : "Reasoning"}</span>}
            <button onClick={() => setExpanded(v => !v)} className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Resize St. Elmo">{expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Minimize St. Elmo"><ChevronDown className="h-4 w-4" /></button>
          </header>

          <div className="flex h-[calc(100%-116px)] flex-col overflow-y-auto px-4 py-4">
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#E8A83A]/15 bg-[#E8A83A]/[0.05] px-3 py-2 text-[9px] text-white/45"><Sparkles className="h-3 w-3 text-[#E8A83A]" /> One agent · shared ABOS context · tools remain authoritative</div>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${message.role === "user" ? "rounded-br-sm bg-[#0B2D5B] text-white" : "rounded-bl-sm border border-white/10 bg-white/[0.055] text-white/85"}`}>
                    {message.role === "assistant" ? <ReactMarkdown components={{ p: ({ children }) => <p className="my-0.5">{children}</p>, strong: ({ children }) => <strong className="font-bold text-[#E8A83A]">{children}</strong> }}>{message.content}</ReactMarkdown> : <p>{message.content}</p>}
                    {message.meta && <p className="mt-1 border-t border-white/10 pt-1 text-[8px] uppercase tracking-wider text-white/25">{message.meta.model} · {message.meta.provider}</p>}
                  </div>
                </div>
              ))}
              {busy && <div className="flex items-center gap-2 px-2 text-[10px] text-[#E8A83A]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> St. Elmo is reasoning…</div>}
              <div ref={endRef} />
            </div>
          </div>

          <footer className="border-t border-white/10 bg-black/10 p-3">
            <div className="flex items-end gap-2">
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={1} placeholder="Ask St. Elmo…" className="min-h-10 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#E8A83A]/50" />
              <button onClick={send} disabled={busy || !input.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8A83A] text-[#0B1220] transition hover:brightness-110 disabled:opacity-30"><Send className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 flex items-center justify-between"><span className="text-[8px] uppercase tracking-wider text-white/20">Background-safe server reasoning</span><button onClick={clear} className="text-[8px] uppercase tracking-wider text-white/25 hover:text-white/60">Clear</button></div>
          </footer>
        </div>
      )}

      {!open && <button onClick={() => setOpen(true)} className="group flex items-center gap-2 rounded-full border border-[#E8A83A]/35 bg-[#0b1220]/95 px-3 py-2.5 shadow-xl shadow-black/30 backdrop-blur-xl transition hover:border-[#E8A83A]/70 hover:scale-[1.02]" aria-label="Open St. Elmo M_1.0">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full border border-[#E8A83A]/30 bg-[#E8A83A]/10 text-[#E8A83A] ${busy ? "animate-pulse" : ""}`}><BrainCircuit className="h-4 w-4" /></span>
        <span className="pr-1 text-left"><span className="block text-[11px] font-black text-white">St. Elmo</span><span className="block text-[8px] uppercase tracking-wider text-white/35">M_1.0 · AI Agent</span></span>
      </button>}
    </div>
  );
}
