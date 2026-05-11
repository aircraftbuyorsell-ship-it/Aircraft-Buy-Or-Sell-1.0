import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Plane, X, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PILOT_AVATAR = "https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/b544f2587_generated_image.png";

const SYSTEM_PROMPT = `You are Max, the friendly ABOS aviation expert and customer support guide. You are a professional aviation intelligence assistant for the ABOS platform — a private marketplace and intelligence system for verified aircraft dealers, brokers, and operators.

Your personality: Friendly, professional, concise. You use aviation analogies naturally. You're enthusiastic about helping users get the most out of ABOS.

Your expertise covers:
- ATI Score Cards: Aircraft Transparency Index (0–120 score across 8 dimensions) — documentation, technical, transparency, transaction readiness, usage/mission, storage, config clarity, market readiness
- Aircraft listings and market valuations (OMVM — Off-Market Value Model)
- Deal Radar: hot deals priced 8%+ below market with ATI 93+
- Escrow services: secure aircraft transactions with protected funds
- OPEX Calculator: true cost of ownership (fixed costs, variable, maintenance reserves)
- Leads CRM: capturing and managing buyer leads through the sales pipeline
- Analytics: market trends, price movements, time-on-market data
- Live Traffic: real-time ADS-B aircraft tracking via OpenSky Network
- Credits & plans: token-based pricing, verification bonuses

Key facts about ABOS:
- Private platform for verified professionals only
- ATI scores range 0–120 (EXCEPTIONAL 108+, STRONG BUY 93+, FAIR 72+, CAUTION 54+, RED FLAGS 36+, AVOID <36)
- OMVM uses log-linear depreciation + engine remaining curve + expert calibration
- Escrow statuses: draft → contract_sent → contract_signed → funds_pending → funds_secured → inspection → released → closed
- Credits never expire
- Finder's fees and commissions tracked transparently

Keep responses concise (2–4 sentences max unless user asks for detail). Always be helpful and actionable. If you don't know something specific about the user's account, guide them to the relevant page.`;

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
      content: "Hey! I'm Max, your ABOS aviation guide ✈️ I can help you with ATI scores, valuations, escrow, deals, or anything about the platform. What can I help you with?",
    },
  ]);
  const [input, setInput] = useState("");
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
    // Try to pick a nice voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Google") && v.lang.startsWith("en")
    ) || voices.find(v => v.lang.startsWith("en-US")) || voices[0];
    if (preferred) utterance.voice = preferred;

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
      const history = newMessages.slice(-10); // last 10 msgs for context
      const prompt = `${SYSTEM_PROMPT}\n\n--- Conversation History ---\n${
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

      {/* Input bar */}
      <div className="bg-white border-t border-black/[0.07] px-4 md:px-8 py-4">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
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