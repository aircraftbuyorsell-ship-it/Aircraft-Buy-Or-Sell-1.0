import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { runVerificationAssistant } from "@/lib/verificationAssistant";
import { runMarketspaceAssistant, marketspaceSummary } from "@/lib/marketspaceAssistant";
import { runABOSAgent } from "@/lib/abosAgent";
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, FileText, Send, Loader2, X, MessageCircle, Video, Check, AlertTriangle, Lock, ArrowRight, Search, ShieldCheck, BarChart3, Handshake } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

const PILOT_AVATAR = "https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/b544f2587_generated_image.png";

const SYSTEM_PROMPT = `You are Max, the ABOS aviation assistant. You help users navigate the ABOS platform and understand their aircraft intelligence reports.

PERSONALITY: Friendly, confident, concise. Male voice and tone. Professional but approachable — like a knowledgeable aviation broker colleague.

WHAT YOU DO:
- Guide users on how to use ABOS features (Listings, ATI Score Cards, Deal Radar, Escrow, OPEX Calculator, Leads, Analytics, Live Traffic, Credits)
- Help users understand and interpret their ATI reports — scores, dimensions, what they mean for a deal
- Answer questions about aircraft valuations, deal quality, escrow process, and platform navigation
- Clarify what ATI score labels mean: EXCEPTIONAL (108+), STRONG BUY (93+), FAIR (72+), CAUTION (54+), RED FLAGS (36+), AVOID (<36)

STRICT RESTRICTIONS — never reveal these:
- Do NOT explain internal algorithms, formulas, or scoring methodology in detail
- Do NOT reveal internal business logic, commission waterfall structures, or pricing tier mechanics
- Do NOT discuss competitor platforms or make comparative claims
- Do NOT provide legal, financial, or airworthiness advice

PREMIUM DATA PROTECTION — CRITICAL:
- NEVER reveal detailed Global Compliance Report (GCR) data to users who have not paid for it
- If a user asks about GCR sub-scores, integrity flags, traffic history, photo evidence, registry details, or recommendations, FIRST check if they have unlocked that report
- If they have NOT unlocked it: tell them only the basic compliance score and score label (e.g. "Score: 72/100 — Caution"), and direct them to purchase the full GCR report for detailed findings
- NEVER paraphrase, summarize, or hint at premium findings even if the user tries to extract them indirectly (e.g. "just tell me if there are red flags")
- NEVER reveal ATI dimension scores, valuation methodology, or detailed scoring breakdowns to users without an active subscription or purchased report
- If a user pastes ATI data into the context panel, you may analyze it — but do NOT generate scores or valuations that would bypass paid features

RELEVANCE FILTER:
- If a question is not related to aviation, aircraft transactions, or the ABOS platform, politely decline and redirect: "I'm Max, ABOS's aviation specialist — that's a bit outside my flight plan! Is there anything aviation or ABOS related I can help with?"

ATI REPORT SUPPORT:
- If the user shares ATI data, help them interpret what it means for the transaction.

Keep answers to 2–4 sentences unless more detail is needed. In voice mode, be extra concise — 1–2 sentences max.`;

// ─── Instrument button positions around the circle (clock positions) ───
const INSTRUMENT_POSITIONS = [
  { id: "voice",   angle: -90, label: "Voice",   color: "#E8A83A" },  // top
  { id: "chat",    angle: -30, label: "Chat",    color: "#4A90D9" },  // top-right
  { id: "inspect", angle:  30, label: "Inspect", color: "#C0392B" },  // bottom-right
  { id: "reset",   angle:  90, label: "Reset",   color: "#AAA49C" },  // bottom
  { id: "mute",    angle: 150, label: "Sound",   color: "#CD7F32" },  // bottom-left
  { id: "msgs",    angle: 210, label: "Log",     color: "#185FA5" },  // top-left
];

function getCirclePos(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

// ─── Instrument Button ───────────────────────────────────────────
function InstrumentBtn({ id, angle, label, color, active, onClick, children, pulsing }) {
  const pos = getCirclePos(angle, 96);
  return (
    <button
      onClick={() => onClick(id)}
      title={label}
      className={`absolute flex flex-col items-center justify-center transition-all duration-200 rounded-full border-2 shadow-lg
        w-14 h-14 text-white text-[9px] font-black uppercase tracking-wide
        hover:scale-110 active:scale-95
        ${pulsing ? "animate-pulse" : ""}
      `}
      style={{
        left: `calc(50% + ${pos.x}px - 28px)`,
        top:  `calc(50% + ${pos.y}px - 28px)`,
        backgroundColor: active ? color : "#1C2B3A",
        borderColor: active ? color : `${color}60`,
        boxShadow: active ? `0 0 16px ${color}80` : `0 2px 8px rgba(0,0,0,0.4)`,
      }}
    >
      {children}
      <span className="mt-0.5 leading-none" style={{ color: active ? "white" : color }}>{label}</span>
    </button>
  );
}

// ─── Audio waveform viz ──────────────────────────────────────────
function VoiceWave({ active }) {
  if (!active) return null;
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[3,5,8,12,8,5,3].map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-[#E8A83A] animate-bounce"
          style={{ height: `${h}px`, animationDelay: `${i * 0.08}s`, animationDuration: "0.5s" }}
        />
      ))}
    </div>
  );
}

// ─── Message bubble (compact) ───────────────────────────────────
function MsgBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
        isUser ? "bg-[#0B2D5B] text-white rounded-br-sm" : "bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.90)] rounded-bl-sm"
      }`}>
        {isUser ? <p>{msg.content}</p> : (
          <ReactMarkdown
            className="prose prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-0.5">{children}</p>,
              strong: ({ children }) => <strong className="font-bold text-[#4e8ef7]">{children}</strong>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function MaxChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm Max ✈️ Tap the mic button to start a voice conversation, or use Chat mode to type." }
  ]);
  const [input, setInput] = useState("");
  const [atiContext, setAtiContext] = useState("");
  const [loading, setLoading] = useState(false);

  // Panel visibility
  const [showChat, setShowChat] = useState(false);
  const [showAti, setShowAti] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [agentWorkflow, setAgentWorkflow] = useState(null);

  // Voice / TTS
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [micPermission, setMicPermission] = useState("unknown"); // "unknown" | "granted" | "denied"

  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const voiceModeRef = useRef(false);

  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showLog]);

  useEffect(() => {
    const onWorkflow = (event) => setAgentWorkflow(event.detail || null);
    window.addEventListener("abos:agent-workflow", onWorkflow);
    return () => {
      window.removeEventListener("abos:agent-workflow", onWorkflow);
      synthRef.current?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  // ── TTS ──────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    if (!ttsEnabled || !synthRef.current) { onDone?.(); return; }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_`#]/g, ""));
    utterance.rate = 1.05;
    utterance.pitch = 0.85;
    utterance.volume = 1;
    const voices = synthRef.current.getVoices();
    const preferred =
      voices.find(v => v.name === "Google UK English Male") ||
      voices.find(v => v.name.toLowerCase().includes("male") && v.lang.startsWith("en")) ||
      voices.find(v => v.name.includes("David") && v.lang.startsWith("en")) ||
      voices.find(v => v.name.includes("Daniel") && v.lang.startsWith("en")) ||
      voices.find(v => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")) ||
      voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => { setSpeaking(false); onDone?.(); };
    utterance.onerror = () => { setSpeaking(false); onDone?.(); };
    synthRef.current.speak(utterance);
  }, [ttsEnabled]);

  // ── LLM call ─────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].slice(-10);
      let orchestrationContext = "";
      const aircraftMatch = text.trim().toUpperCase().match(/\b([A-Z]{1,2}-?[A-Z0-9]{2,6}|N\d{1,5}[A-Z]{0,3})\b/);
      try {
        const agent = await runABOSAgent(text, { entry: "cockpit" });
        orchestrationContext += `\n\n--- ABOS AGENT WORKFLOW ---\nCurrent stage: ${agent.workflow.current}. Completed: ${agent.workflow.completed.join(', ') || 'none'}. Next actions: ${(agent.workflow.next || []).join(', ') || 'none'}. Aircraft: ${agent.registration || 'not specified'}. Premium data remains entitlement-gated.\n--- END ABOS AGENT WORKFLOW ---`;
        window.dispatchEvent(new CustomEvent('abos:agent-workflow', { detail: agent }));
      } catch (_) {}
      if (/\b(verify|verification|registry check|check this aircraft)\b/i.test(text) && aircraftMatch && !orchestrationContext.includes('Current stage: analysis')) {
        try {
          const verification = await runVerificationAssistant(aircraftMatch[1], { entry: "abos_assistant" });
          orchestrationContext += `\n\n--- SHARED VERIFICATION WORKFLOW ---\nAircraft ${verification.registration} verification workflow completed. Use only entitlement-safe/high-level conclusions from this context. Do not disclose premium evidence or internal scoring methodology.\n--- END VERIFICATION WORKFLOW ---`;
          window.dispatchEvent(new CustomEvent('abos:assistant-verification', { detail: verification }));
        } catch (e) { orchestrationContext = `\n\nVerification workflow could not be completed: ${e?.message || 'unavailable'}`; }
      } else if (/\b(find|search|show|compare|deal|undervalued|below market|sell|buyers|market)\b/i.test(text)) {
        try {
          const market = await runMarketspaceAssistant(text, { entry: "abos_assistant" });
          orchestrationContext = `\n\n--- SHARED MARKETSPACE WORKFLOW ---\n${marketspaceSummary(market)} Intent: ${market.intent}. Candidate count: ${market.aircraft?.length || 0}. Next actions: ${(market.nextActions || []).join(', ')}. Do not invent candidate facts not present in the conversation.\n--- END MARKETSPACE WORKFLOW ---`;
          window.dispatchEvent(new CustomEvent('abos:assistant-marketspace', { detail: market }));
        } catch (e) { orchestrationContext = `\n\nMarketspace workflow could not be completed: ${e?.message || 'unavailable'}`; }
      }
      const atiSection = atiContext.trim()
        ? `\n\n--- ATI REPORT DATA ---\n${atiContext.trim()}\n--- END ---`
        : "";
      const prompt = `${SYSTEM_PROMPT}${atiSection}${orchestrationContext}\n\n--- Conversation ---\n${
        history.map(m => `${m.role === "user" ? "User" : "Max"}: ${m.content}`).join("\n")
      }\n\nMax:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: "gemini_3_1_pro",
      });

      setMessages(prev => [...prev, { role: "assistant", content: result }]);

      // After speaking, if still in voice mode → restart listening
      if (voiceModeRef.current) {
        speak(result, () => {
          if (voiceModeRef.current) startRecognition();
        });
      } else {
        speak(result);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm currently in offline mode — the live assistant is temporarily unavailable. You can still explore the platform directly:\n\n• **Listings** — browse active aircraft with ATI scores\n• **Deal Radar** — spot below-market opportunities\n• **Traffic Map** — track aircraft in real-time\n\nType 'reset' or use the Reset button to start fresh when ready." }]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, atiContext, speak]);

  // ── Speech recognition ───────────────────────────────────────
  const startRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [sendMessage]);

  const requestMicAndStartVoice = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      setVoiceMode(true);
      synthRef.current?.cancel();
      // Greeting then start listening
      speak("Voice mode active. Go ahead!", () => startRecognition());
    } catch {
      setMicPermission("denied");
      setVoiceMode(false);
    }
  };

  const stopVoiceMode = () => {
    setVoiceMode(false);
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
    setListening(false);
    setSpeaking(false);
  };

  // ── Instrument button handler ────────────────────────────────
  const handleInstrument = (id) => {
    if (id === "voice") {
      if (voiceMode) {
        stopVoiceMode();
      } else {
        requestMicAndStartVoice();
      }
    } else if (id === "chat") {
      setShowChat(v => !v);
      setShowAti(false);
      setShowLog(false);
    } else if (id === "inspect") {
      navigate("/pre-buy-inspection");
    } else if (id === "reset") {
      stopVoiceMode();
      setMessages([{ role: "assistant", content: "Conversation reset. I'm Max ✈️ Ready when you are!" }]);
    } else if (id === "mute") {
      setTtsEnabled(v => {
        if (v) synthRef.current?.cancel();
        return !v;
      });
    } else if (id === "msgs") {
      setShowLog(v => !v);
      setShowChat(false);
      setShowAti(false);
    }
  };

  const isActive = (id) => {
    if (id === "voice") return voiceMode;
    if (id === "chat") return showChat;
    if (id === "ati") return showAti || !!atiContext;
    if (id === "mute") return ttsEnabled;
    if (id === "msgs") return showLog;
    return false;
  };

  const getIcon = (id) => {
    if (id === "voice")   return voiceMode ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />;
    if (id === "chat")    return <MessageCircle className="w-5 h-5" />;
    if (id === "inspect") return <Video className="w-5 h-5" />;
    if (id === "reset")   return <RotateCcw className="w-5 h-5" />;
    if (id === "mute")    return ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />;
    if (id === "msgs")    return <MessageCircle className="w-5 h-5" />;
    return null;
  };

  // Status text
  const workflowSteps = agentWorkflow ? [
    { key: "identify", label: "Identify", icon: Search, state: agentWorkflow.workflow.completed.includes("verification") || agentWorkflow.registration ? "done" : "next" },
    { key: "verify", label: "Verify", icon: ShieldCheck, state: agentWorkflow.workflow.completed.includes("verification") ? "done" : agentWorkflow.registration ? "next" : "locked" },
    { key: "analyse", label: "Analyse", icon: BarChart3, state: agentWorkflow.workflow.current === "analysis" && agentWorkflow.workflow.completed.includes("marketspace") ? "next" : agentWorkflow.workflow.completed.includes("marketspace") ? "done" : "locked" },
    { key: "transact", label: "Transact", icon: Handshake, state: agentWorkflow.workflow.completed.includes("transaction_context") ? "next" : "locked" },
  ] : [];

  const runWorkflowAction = (step) => {
    const reg = agentWorkflow?.registration;
    if (!reg) return;
    const prompts = { verify: `Verify ${reg}`, analyse: `Analyse ${reg} and calculate ATI and OMVM`, transact: `Start transaction pipeline for ${reg}` };
    if (prompts[step]) sendMessage(prompts[step]);
  };

  const statusText = loading ? "Thinking…"
    : speaking ? "Speaking…"
    : listening ? "Listening…"
    : voiceMode ? "Voice Active — Say Something"
    : "Tap mic for voice · tap chat to type";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1A33] to-[#0D2244] flex flex-col items-center justify-start px-4 py-6 md:py-10">

      {/* ── Title ── */}
      <div className="text-center mb-6">
        <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.3em] font-black mb-1">ABOS Agent · Aviation Intelligence</p>
        <h1 className="text-white text-2xl font-black tracking-tight">ABOS Agent</h1>
        <p className="text-white/40 text-[11px] mt-0.5">{statusText}</p>
      </div>

      {agentWorkflow && (
        <div className="w-full max-w-3xl mb-5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#E8A83A] font-black">ABOS Workflow · ADL / APL</p>
              <p className="text-white text-sm font-bold mt-1">{agentWorkflow.registration || "Market discovery"}</p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/40">{agentWorkflow.workflow.current.replaceAll("_", " ")}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {workflowSteps.map(step => {
              const Icon = step.icon;
              const actionable = step.state === "next" && step.key !== "identify";
              return <button key={step.key} disabled={!actionable} onClick={() => runWorkflowAction(step.key)} className={`text-left rounded-xl border p-3 transition ${step.state === "done" ? "border-emerald-400/30 bg-emerald-400/5" : step.state === "next" ? "border-[#E8A83A]/50 bg-[#E8A83A]/10 hover:bg-[#E8A83A]/15" : "border-white/10 bg-white/[0.02]"}`}>
                <div className="flex items-center justify-between"><Icon className={`w-4 h-4 ${step.state === "done" ? "text-emerald-400" : step.state === "next" ? "text-[#E8A83A]" : "text-white/25"}`} />{step.state === "done" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : step.state === "next" ? <ArrowRight className="w-3.5 h-3.5 text-[#E8A83A]" /> : <Lock className="w-3 h-3 text-white/20" />}</div>
                <p className={`mt-2 text-[11px] font-black uppercase tracking-wider ${step.state === "locked" ? "text-white/30" : "text-white"}`}>{step.label}</p>
                {step.state === "next" && <p className="mt-1 text-[9px] text-white/40">Click to continue</p>}
              </button>;
            })}
          </div>
          {agentWorkflow.workflow.next?.length > 0 && <div className="mt-3 flex items-center gap-2 text-[10px] text-white/50"><AlertTriangle className="w-3.5 h-3.5 text-[#E8A83A]" /><span>Next best action: {agentWorkflow.workflow.next[0]}</span></div>}
        </div>
      )

      {/* ── Cockpit Panel ── */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-[#E8A83A]/20"
          style={{
            background: "radial-gradient(circle, rgba(11,45,91,0.6) 0%, rgba(7,18,38,0.9) 100%)",
            boxShadow: voiceMode
              ? "0 0 40px rgba(232,168,58,0.3), inset 0 0 30px rgba(232,168,58,0.05)"
              : "0 0 24px rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.3)",
          }}
        />

        {/* Tick marks */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
          const r = (a * Math.PI) / 180;
          const isMajor = a % 60 === 0;
          return (
            <div
              key={a}
              className="absolute"
              style={{
                width: isMajor ? 2 : 1,
                height: isMajor ? 10 : 6,
                backgroundColor: isMajor ? "#E8A83A80" : "#FFFFFF30",
                left: `calc(50% + ${Math.cos(r) * 130}px - ${isMajor ? 1 : 0.5}px)`,
                top:  `calc(50% + ${Math.sin(r) * 130}px - ${isMajor ? 5 : 3}px)`,
                transform: `rotate(${a}deg)`,
                transformOrigin: "center center",
              }}
            />
          );
        })}

        {/* 6 instrument buttons */}
        {INSTRUMENT_POSITIONS.map(inst => (
          <InstrumentBtn
            key={inst.id}
            {...inst}
            active={isActive(inst.id)}
            onClick={handleInstrument}
            pulsing={(inst.id === "voice" && listening) || (inst.id === "voice" && speaking && voiceMode)}
          >
            {getIcon(inst.id)}
          </InstrumentBtn>
        ))}

        {/* Center — Max avatar */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* Glow ring */}
          <div
            className="absolute rounded-full transition-all duration-500"
            style={{
              width: 76, height: 76,
              background: voiceMode
                ? "radial-gradient(circle, rgba(232,168,58,0.35) 0%, transparent 70%)"
                : speaking
                ? "radial-gradient(circle, rgba(74,144,217,0.3) 0%, transparent 70%)"
                : "transparent",
            }}
          />
          <div
            className="relative w-16 h-16 rounded-full border-2 overflow-hidden transition-all duration-300"
            style={{
              borderColor: voiceMode ? "#E8A83A" : speaking ? "#4A90D9" : "#FFFFFF30",
              boxShadow: voiceMode ? "0 0 20px rgba(232,168,58,0.5)" : speaking ? "0 0 16px rgba(74,144,217,0.5)" : "none",
            }}
          >
            <img
              src={PILOT_AVATAR}
              alt="Max"
              className="w-full h-full object-cover"
              style={{ mixBlendMode: "multiply", background: "#4A90D9" }}
            />
          </div>

          {/* Voice waveform / loading */}
          <div className="mt-2 h-5 flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-4 h-4 text-[#4A90D9] animate-spin" />
            ) : (
              <VoiceWave active={listening || speaking} />
            )}
          </div>
        </div>
      </div>

      {/* ── Permission denied notice ── */}
      {micPermission === "denied" && (
        <div className="mt-4 text-[11px] text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-2 text-center max-w-xs">
          Microphone access denied. Please allow it in your browser settings.
        </div>
      )}

      {/* ── Chat input panel ── */}
      {showChat && (
        <div className="mt-6 w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask Max anything about ABOS…"
              rows={2}
              className="flex-1 resize-none px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E8A83A]/60"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-[#E8A83A] hover:bg-[#f5bb4e] disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 text-[#4e8ef7] animate-spin" /> : <Send className="w-4 h-4 text-[#4e8ef7]" />}
            </button>
          </div>
        </div>
      )}

      {/* ── ATI context panel ── */}
      {showAti && (
        <div className="mt-4 w-full max-w-md bg-[#0F7A56]/10 border border-[#0F7A56]/30 rounded-2xl p-4 backdrop-blur">
          <p className="text-[10px] uppercase tracking-wider font-black text-[#4ADE80] mb-2 flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Paste ATI Report Data
          </p>
          <textarea
            value={atiContext}
            onChange={e => setAtiContext(e.target.value)}
            placeholder="e.g. ATI Total: 87, Documentation: 12/15, Engine: 10/15, asking $185k, OMVM $195k…"
            rows={3}
            className="w-full resize-none px-3 py-2 bg-white/10 border border-white/15 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#0F7A56]/60"
          />
          {atiContext && <p className="text-[9px] text-[#4ADE80] mt-1 font-semibold">✓ Max will analyse this ATI data</p>}
        </div>
      )}

      {/* ── Message log ── */}
      {showLog && (
        <div className="mt-4 w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur max-h-72 overflow-y-auto flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Conversation Log</p>
            <button onClick={() => setShowLog(false)} className="text-white/30 hover:text-white/60">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {messages.map((msg, i) => <MsgBubble key={i} msg={msg} />)}
          {loading && (
            <div className="flex gap-1 items-center pl-1 py-1">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-[#4A90D9] rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Instruction hints ── */}
      <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-xs text-center">
        {[
          { icon: "🎙️", text: "Mic — live voice chat" },
          { icon: "💬", text: "Chat — type a message" },
          { icon: "🎥", text: "Inspect — live pre-buy" },
          { icon: "📋", text: "Log — view history" },
          { icon: "🔊", text: "Sound — toggle TTS" },
          { icon: "↺",  text: "Reset — new session" },
        ].map(h => (
          <div key={h.text} className="flex items-center gap-1.5 text-[10px] text-white/30 font-semibold">
            <span>{h.icon}</span>
            <span>{h.text}</span>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[9px] text-white/20 uppercase tracking-wider text-center">
        Powered by Gemini · ABOS Aviation Intelligence
      </p>
    </div>
  );
}