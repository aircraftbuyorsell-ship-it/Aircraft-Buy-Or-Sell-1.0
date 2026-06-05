import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, Send, X, ChevronDown, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ATIGuideChat({ listing }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (open && !conversation && !starting) {
      startConversation();
    }
  }, [open]);

  useEffect(() => {
    if (!conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  const startConversation = async () => {
    setStarting(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "ati_passport_guide",
        metadata: {
          name: `ATI Guide — ${listing?.registration || listing?.make + " " + listing?.model}`,
          listing_id: listing?.id,
        },
      });
      setConversation(conv);
      setMessages(conv.messages || []);

      // Send initial context message automatically
      const intro = `I need help completing the ATI Passport for this aircraft: ${listing?.year || ""} ${listing?.make || ""} ${listing?.model || ""}${listing?.registration ? " (" + listing.registration + ")" : ""}. The listing ID is ${listing?.id}. Please guide me step by step through what information is needed to get the best possible ATI score.`;

      await base44.agents.addMessage(conv, { role: "user", content: intro });
    } finally {
      setStarting(false);
    }
  };

  const send = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(conversation, { role: "user", content: text });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isStreaming = messages.length > 0 && messages[messages.length - 1]?.role === "assistant" &&
    messages[messages.length - 1]?.status === "streaming";

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-5 z-50 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full shadow-xl transition-all active:scale-95 hover:scale-105"
          style={{
            background: "linear-gradient(135deg,#185FA5,#0B2D5B)",
            boxShadow: "0 8px 28px rgba(24,95,165,0.45), 0 2px 8px rgba(0,0,0,0.20)",
            border: "1px solid rgba(232,168,58,0.35)"
          }}
        >
          <Bot className="w-5 h-5 text-[#E8A83A]" />
          <span className="text-[12px] font-black uppercase tracking-wide text-white">ATI Guide</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#E8A83A] rounded-full border-2 border-[#0B2D5B] animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: "min(380px, calc(100vw - 24px))",
            height: "520px",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(40px) saturate(200%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            border: "1px solid rgba(255,255,255,0.80)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)"
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg,#0B2D5B,#185FA5)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
            <div className="w-8 h-8 rounded-full bg-[#E8A83A]/20 border border-[#E8A83A]/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#E8A83A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-[13px] truncate">ATI Passport Guide</p>
              <p className="text-white/50 text-[10px]">Step-by-step scoring assistant</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors active:scale-90"
              style={{ background: "rgba(255,255,255,0.08)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {starting && (
              <div className="flex items-center gap-2 text-[12px] text-[#6B6560]">
                <Loader2 className="w-4 h-4 animate-spin text-[#185FA5]" />
                Starting ATI Guide session…
              </div>
            )}

            {messages.filter(m => m.role !== "system").map((msg, i) => {
              const isUser = msg.role === "user";
              // Skip the auto-intro user message (first one)
              if (isUser && i === 0) return null;
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed ${
                      isUser
                        ? "text-white rounded-br-sm"
                        : "text-[#1A1814] rounded-bl-sm border border-black/[0.07]"
                    }`}
                    style={isUser
                      ? { background: "linear-gradient(135deg,#185FA5,#0B2D5B)" }
                      : { background: "rgba(247,244,239,0.9)" }
                    }
                  >
                    {isUser ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown
                        className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-[#0B2D5B]"
                      >
                        {msg.content || "…"}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              );
            })}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm border border-black/[0.07] bg-[#F7F4EF]/90">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#185FA5] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-3 py-3 border-t border-black/[0.07]">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                disabled={sending || starting || !conversation}
                placeholder="Ask about your ATI score, what data is needed…"
                rows={1}
                className="flex-1 resize-none text-[12px] rounded-xl border border-black/[0.1] bg-[#F7F4EF] px-3 py-2.5 outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5]/20 placeholder-[#AAA49C] text-[#1A1814] max-h-24 overflow-y-auto transition-colors disabled:opacity-50"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending || starting || !conversation}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#185FA5,#0B2D5B)" }}
              >
                {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}