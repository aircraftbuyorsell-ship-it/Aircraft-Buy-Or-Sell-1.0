import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Brain, Send, Loader2, Sparkles, Plane, TrendingUp, ShieldCheck,
  AlertTriangle, CheckCircle2, Cpu, ChevronRight, User
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTED_PROMPTS = [
  { icon: Plane, text: "Analyze N123AB investment potential — 200 hrs/yr, rental use in CZ" },
  { icon: TrendingUp, text: "What's the OPEX vs lease revenue breakeven for a Cirrus SR22?" },
  { icon: ShieldCheck, text: "Which skills should I run for a pre-buy assessment of N8541G?" },
  { icon: Brain, text: "Compare investment health scores for my watched aircraft" },
];

function ModelBadge({ model }) {
  if (!model || model === "none") return null;
  const label = model.includes("llama") ? "Llama 4" : model.includes("gpt") ? "GPT-4o" : model.includes("claude") ? "Claude" : model;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
      style={{ background: "rgba(78,142,247,0.10)", color: "#4e8ef7", border: "0.5px solid rgba(78,142,247,0.25)" }}>
      <Cpu className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const isFailed = toolCall.status === "failed" || toolCall.status === "error";
  const label = toolCall.display_projection?.label || toolCall.name || "tool";
  const activeLabel = toolCall.display_projection?.active_label || "Running...";
  const errorLabel = toolCall.display_projection?.error_label || "Failed";
  const hideDetails = toolCall.display_projection?.hide_details && toolCall.display_projection?.details_redacted;

  let parsedArgs = toolCall.arguments_string;
  try { parsedArgs = JSON.parse(toolCall.arguments_string); } catch { /* keep raw */ }

  let parsedResults = toolCall.results;
  try {
    if (typeof toolCall.results === "string") parsedResults = JSON.parse(toolCall.results);
  } catch { /* keep raw */ }

  const isRunning = ["pending", "running", "in_progress"].includes(toolCall.status);

  return (
    <div className="mt-2 ml-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
        style={{ color: isFailed ? "#e24b4a" : isRunning ? "#f5c242" : "#5dcaa5" }}
      >
        {isFailed ? <AlertTriangle className="w-3 h-3" /> : isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
        <span>{isRunning ? activeLabel : isFailed ? errorLabel : label}</span>
        {!hideDetails && <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />}
      </button>
      {expanded && !hideDetails && (
        <div className="mt-1.5 ml-4 space-y-1.5">
          {parsedArgs && typeof parsedArgs === "object" && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Parameters</p>
              <pre className="text-[10px] text-white/50 bg-white/3 rounded p-2 overflow-x-auto max-h-32">{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Result</p>
              <pre className="text-[10px] text-white/50 bg-white/3 rounded p-2 overflow-x-auto max-h-48">{typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: isUser ? "rgba(78,142,247,0.15)" : "rgba(245,194,66,0.12)" }}>
        {isUser ? <User className="w-3.5 h-3.5 text-[#4e8ef7]" /> : <Brain className="w-3.5 h-3.5 text-[#f5c242]" />}
      </div>
      <div className={`flex-1 min-w-0 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-2.5 ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
          style={{
            background: isUser ? "rgba(78,142,247,0.10)" : "rgba(255,255,255,0.04)",
            border: `0.5px solid ${isUser ? "rgba(78,142,247,0.20)" : "rgba(255,255,255,0.08)"}`,
          }}>
          {message.content && (
            isUser ? (
              <p className="text-sm text-white/90 whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown className="text-sm text-white/85 prose prose-sm prose-invert max-w-none [&_p]:mb-1.5 [&_ul]:mb-1.5 [&_li]:mb-0.5 [&_code]:text-[#f5c242] [&_code]:bg-white/5 [&_code]:px-1 [&_code]:rounded">
                {message.content}
              </ReactMarkdown>
            )
          )}
        </div>
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="w-full">
            {message.tool_calls.map((tc, i) => <ToolCallDisplay key={i} toolCall={tc} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FinanceAdvisorChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef(null);

  // Load existing conversations
  useEffect(() => {
    (async () => {
      try {
        const convs = await base44.agents.listConversations({ agent_name: "finance_advisor" });
        setConversations(convs || []);
      } catch { /* skip */ }
      setLoadingConversations(false);
    })();
  }, []);

  // Subscribe to active conversation
  useEffect(() => {
    if (!activeConversationId) return;
    const unsubscribe = base44.agents.subscribeToConversation(activeConversationId, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [activeConversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startNewConversation = useCallback(async (initialMessage) => {
    setLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "finance_advisor",
        metadata: { name: initialMessage.slice(0, 40) + "…" },
      });
      setActiveConversationId(conv.id);
      setConversations(prev => [conv, ...prev]);
      await base44.agents.addMessage(conv, { role: "user", content: initialMessage });
      setMessages(conv.messages || []);
    } catch (e) {
      console.error("Failed to start conversation:", e);
    }
    setLoading(false);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");

    if (!activeConversationId) {
      await startNewConversation(text);
      return;
    }

    setLoading(true);
    try {
      const conv = conversations.find(c => c.id === activeConversationId);
      if (conv) {
        await base44.agents.addMessage(conv, { role: "user", content: text });
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    }
    setLoading(false);
  }, [input, loading, activeConversationId, conversations, startNewConversation]);

  const handleSuggested = useCallback((prompt) => {
    setInput(prompt);
  }, []);

  return (
    <div className="min-h-screen flex" style={{ background: "transparent" }}>
      {/* Sidebar — conversation list */}
      <div className="hidden md:flex flex-col w-64 border-r border-white/8 shrink-0" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="p-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,194,66,0.12)" }}>
              <Brain className="w-4 h-4 text-[#f5c242]" />
            </div>
            <div>
              <p className="text-xs font-black text-white/90">Finance Advisor</p>
              <p className="text-[9px] text-white/40">Llama 4 + GPT-4o hybrid</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setActiveConversationId(null); setMessages([]); }}
          className="mx-3 mt-3 mb-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-white/5"
          style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.20)", color: "#f5c242" }}>
            + New Conversation
          </button>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loadingConversations ? (
            <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-white/30" /></div>
          ) : conversations.length === 0 ? (
            <p className="text-[11px] text-white/30 text-center px-4 py-8">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <button key={conv.id} onClick={() => {
                setActiveConversationId(conv.id);
                setMessages(conv.messages || []);
              }}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-colors ${activeConversationId === conv.id ? "bg-white/8" : "hover:bg-white/4"}`}>
                <p className="text-xs font-semibold text-white/70 truncate">{conv.metadata?.name || "Untitled"}</p>
                <p className="text-[9px] text-white/30 mt-0.5">{conv.messages?.length || 0} messages</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2 p-4 border-b border-white/8">
          <Brain className="w-5 h-5 text-[#f5c242]" />
          <p className="text-sm font-black text-white/90">Finance Advisor</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(245,194,66,0.12), rgba(168,85,247,0.08))" }}>
                  <Sparkles className="w-7 h-7 text-[#f5c242]" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#f5c242] mb-1">Aviation Investment OS</p>
                <h2 className="text-xl font-black text-white/90 mb-2">Ask the Finance Advisor</h2>
                <p className="text-sm text-white/50 max-w-md mx-auto mb-6">
                  The advisor orchestrates Skills (OPEX, Insurance, Leasing, Tax, Lease Rate) over Digital Twin data
                  to generate evidence-based investment briefs.
                </p>
                <div className="grid sm:grid-cols-2 gap-2 max-w-lg mx-auto">
                  {SUGGESTED_PROMPTS.map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <button key={i} onClick={() => handleSuggested(p.text)}
                        className="text-left p-3 rounded-xl transition-all hover:scale-[1.02]"
                        style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                        <Icon className="w-4 h-4 text-[#f5c242] mb-1.5" />
                        <p className="text-[11px] text-white/60 leading-snug">{p.text}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}

            {loading && messages.length > 0 && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(245,194,66,0.12)" }}>
                  <Brain className="w-3.5 h-3.5 text-[#f5c242]" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f5c242] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f5c242] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f5c242] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-white/8 p-3 md:p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about aircraft investment, OPEX, tax benefits, lease rates..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 rounded-xl text-sm outline-none max-h-32"
              style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
            />
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !loading) || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-opacity hover:opacity-90 disabled:opacity-30 cursor-pointer"
              style={{ background: "#f5c242" }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#04060a]" /> : <Send className="w-4 h-4 text-[#04060a]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}