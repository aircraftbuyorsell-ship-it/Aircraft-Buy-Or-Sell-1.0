import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, RotateCcw, FileText, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PILOT_AVATAR = "https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/b544f2587_generated_image.png";

const SYSTEM_PROMPT = `You are Max, the ABOS aviation assistant. You help users navigate the ABOS platform and understand their aircraft intelligence reports.

PERSONALITY: Friendly, confident, concise. Male voice and tone. Professional but approachable — like a knowledgeable aviation broker colleague.

WHAT YOU DO:
- Guide users on how to use ABOS features (Listings, ATI Score Cards, Deal Radar, Escrow, OPEX Calculator, Leads, Analytics, Live Traffic, Credits)
- Help users understand and interpret their ATI reports — scores, dimensions, what they mean for a deal
- Answer questions about aircraft valuations, deal quality, escrow process, and platform navigation
- Clarify what ATI score labels mean: EXCEPTIONAL (108+), STRONG BUY (93+), FAIR (72+), CAUTION (54+), RED FLAGS (36+), AVOID (<36)

STRICT RESTRICTIONS — never reveal these:
- Do NOT explain internal algorithms, formulas, or scoring methodology in detail (how OMVM is calculated, exact weighting, depreciation curves, etc.)
- Do NOT reveal internal business logic, commission waterfall structures, or pricing tier mechanics
- Do NOT discuss competitor platforms or make comparative claims
- Do NOT provide legal, financial, or airworthiness advice — always recommend consulting a licensed professional

RELEVANCE FILTER:
- If a question is not related to aviation, aircraft transactions, or the ABOS platform, politely decline and redirect: "I'm Max, ABOS's aviation specialist — that's a bit outside my flight plan! Is there anything aviation or ABOS related I can help with?"

ATI REPORT SUPPORT:
- If the user shares ATI data (scores, labels, dimensions, aircraft info), acknowledge it and help them interpret what it means for the transaction — is it a strong buy? What risks are flagged? What should they verify before closing?
- Be practical: translate scores into real-world buying/selling guidance

Keep answers to 2–4 sentences unless more detail is needed. Always end with a helpful next step or question.`;

const SUGGESTED_QUESTIONS = [
  "How does the ATI score work?",
  "What is Deal Radar?",
  "How does escrow work?",
  "How do I add an aircraft?",
  "What are credits used for?",
  "How is the aircraft value calculated?",
];

function MessageBubble({ msg, speaking }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <img
          src={PILOT_AVATAR}
          alt="Max"
          className="w-9 h-9 rounded-full object-cover shrink-0 self-end"
          style={{ mixBlendMode: "multiply" }}
        />
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[#0B2D5B] text-white rounded-br-sm"
            : "bg-white border border-black/[0.08] text-[#1A1814] rounded-bl-sm shadow-sm"
        }`}
      >
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1">{children}</p>,
              ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-[#0B2D5B]">{children}</strong>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
        {!isUser && speaking && (
          <div className="flex gap-0.5 mt-1.5 items-end h-3">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-1 bg-[#4A90D9] rounded-full animate-bounce"
                style={{ height: `${8 + (i % 2) * 4}px`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaxChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! I'm Max, your ABOS aviation guide ✈️ I can help you understand ATI reports, find great deals, navigate escrow, or anything else on the platform. What can I help you with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [atiContext, setAtiContext] = useState("");
  const [showAtiPanel, setShowAtiPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState(null);

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const speak = (text, msgIdx) => {
    if (!ttsEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_`#]/g, ""));
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    // Prefer a male English voice
    const voices = synthRef.current.getVoices();
    const preferred =
      voices.find(v => v.name === "Google UK English Male") ||
      voices.find(v => v.name === "Google US English") ||
      voices.find(v => v.name.toLowerCase().includes("male") && v.lang.startsWith("en")) ||
      voices.find(v => v.name.includes("David") && v.lang.startsWith("en")) ||
      voices.find(v => v.name.includes("James") && v.lang.startsWith("en")) ||
      voices.find(v => v.name.includes("Daniel") && v.lang.startsWith("en")) ||
      voices.find(v => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")) ||
      voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.pitch = 0.85; // slightly lower = more masculine

    utterance.onstart = () => { setSpeaking(true); setSpeakingMsgIdx(msgIdx); };
    utterance.onend = () => { setSpeaking(false); setSpeakingMsgIdx(null); };
    utterance.onerror = () => { setSpeaking(false); setSpeakingMsgIdx(null); };
    synthRef.current.speak(utterance);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.slice(-10);
      const atiSection = atiContext.trim()
        ? `\n\n--- ATI REPORT DATA PROVIDED BY USER ---\n${atiContext.trim()}\n--- END ATI DATA ---`
        : "";
      const prompt = `${SYSTEM_PROMPT}${atiSection}\n\n--- Conversation ---\n${
        history.map(m => `${m.role === "user" ? "User" : "Max"}: ${m.content}`).join("\n")
      }\n\nMax:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: "gpt_5_mini",
      });

      const assistantMsg = { role: "assistant", content: result };
      setMessages(prev => {
        const updated = [...prev, assistantMsg];
        const idx = updated.length - 1;
        setTimeout(() => speak(result, idx), 100);
        return updated;
      });
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I hit a turbulence pocket! Try again in a moment. ✈️",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser. Try Chrome.");
      return;
    }
    synthRef.current?.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const reset = () => {
    synthRef.current?.cancel();
    setSpeaking(false);
    setMessages([{
      role: "assistant",
      content: "Hey! I'm Max, your ABOS aviation guide ✈️ I can help you with ATI scores, valuations, escrow, deals, or anything about the platform. What can I help you with?",
    }]);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col">
      {/* Header */}
      <div className="bg-[#0B2D5B] px-4 md:px-8 py-4 flex items-center gap-4">
        <div className="relative">
          <img
            src={PILOT_AVATAR}
            alt="Max"
            className="w-12 h-12 rounded-full object-cover border-2 border-[#E8A83A]"
            style={{ mixBlendMode: "multiply", background: "#4A90D9" }}
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0B2D5B]" />
        </div>
        <div className="flex-1">
          <h1 className="text-white font-black text-lg leading-tight">Max — ABOS Guide</h1>
          <p className="text-[#E8A83A] text-[11px] uppercase tracking-wider font-semibold">
            {speaking ? "Speaking…" : listening ? "Listening…" : "Online · Aviation AI Assistant"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTtsEnabled(v => !v); if (!ttsEnabled === false) synthRef.current?.cancel(); }}
            className={`p-2 rounded-lg border transition-colors ${ttsEnabled ? "bg-[#E8A83A]/20 border-[#E8A83A]/40 text-[#E8A83A]" : "bg-white/5 border-white/10 text-white/40"}`}
            title={ttsEnabled ? "Mute Max" : "Unmute Max"}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={reset}
            className="p-2 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {/* Suggested questions (shown only at start) */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-[11px] bg-white border border-[#0B2D5B]/15 text-[#0B2D5B] font-semibold px-3 py-1.5 rounded-full hover:bg-[#EBF4FF] hover:border-[#4A90D9] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} speaking={speaking && speakingMsgIdx === i} />
        ))}

        {loading && (
          <div className="flex gap-3 items-end">
            <img
              src={PILOT_AVATAR}
              alt="Max"
              className="w-9 h-9 rounded-full object-cover shrink-0"
              style={{ mixBlendMode: "multiply" }}
            />
            <div className="bg-white border border-black/[0.08] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-[#4A90D9] rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                <div className="w-1.5 h-1.5 bg-[#4A90D9] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <div className="w-1.5 h-1.5 bg-[#4A90D9] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ATI Context Panel */}
      {showAtiPanel && (
        <div className="bg-[#EBF4FF] border-t border-[#4A90D9]/20 px-4 md:px-8 py-3">
          <p className="text-[10px] uppercase tracking-wider font-black text-[#4A90D9] mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Paste ATI report data for Max to analyse
          </p>
          <textarea
            value={atiContext}
            onChange={e => setAtiContext(e.target.value)}
            placeholder="Paste ATI scores, dimensions, aircraft details, or any report data here… e.g. 'ATI Total: 87, Documentation: 12/15, Engine: 10/15, asking $185k, OMVM $195k'"
            rows={3}
            className="w-full resize-none px-3 py-2 bg-white border border-[#4A90D9]/30 rounded-xl text-xs text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#4A90D9]"
          />
          {atiContext && (
            <p className="text-[9px] text-[#4A90D9] mt-1 font-semibold">✓ Max will use this ATI context in his next response</p>
          )}
        </div>
      )}

      {/* Input bar */}
      <div className="bg-white border-t border-black/[0.07] px-4 md:px-8 py-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          {/* ATI context toggle */}
          <button
            onClick={() => setShowAtiPanel(v => !v)}
            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
              showAtiPanel || atiContext
                ? "bg-[#EBF4FF] border-[#4A90D9] text-[#4A90D9]"
                : "bg-[#F7F4EF] border-black/10 text-[#6B6560] hover:border-[#4A90D9] hover:text-[#4A90D9]"
            }`}
            title="Share ATI report data with Max"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Voice button */}
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onTouchStart={startListening}
            onTouchEnd={stopListening}
            disabled={loading}
            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border transition-all ${
              listening
                ? "bg-red-500 border-red-400 text-white animate-pulse"
                : "bg-[#F7F4EF] border-black/10 text-[#6B6560] hover:border-[#4A90D9] hover:text-[#4A90D9]"
            }`}
            title="Hold to speak"
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask Max anything about ABOS…"
              rows={1}
              className="w-full resize-none px-4 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#4A90D9] transition-colors"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
          </div>

          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-center text-[9px] text-[#AAA49C] mt-2 uppercase tracking-wider">
          Hold mic to speak · Enter to send · Max uses AI — verify critical info
        </p>
      </div>
    </div>
  );
}