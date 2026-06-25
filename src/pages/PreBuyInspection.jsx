import { useState, useRef, useEffect, useCallback } from "react";
import { appParams } from "@/lib/app-params";
import {
  Video, VideoOff, Mic, MicOff, AlertTriangle,
  CheckCircle, Loader2, ArrowLeft, Camera, RotateCcw,
  Volume2, Zap, ShieldCheck, Eye, FileText, Plane,
  ChevronRight, Star
} from "lucide-react";
import { Link } from "react-router-dom";

const PILOT_AVATAR = "https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/b544f2587_generated_image.png";

// ─── Build WebSocket URL with auth token ──────────────────────────
function buildWsUrl() {
  const { appId, appBaseUrl } = appParams;
  // Use appBaseUrl (the real API server) — app.base44.com may not proxy WS upgrades
  // Fall back to same-origin if appBaseUrl not available
  const httpBase = (appBaseUrl || `${window.location.protocol}//${window.location.host}`).replace(/\/$/, "");
  const wsBase = httpBase.replace(/^https/, "wss").replace(/^http(?!s)/, "ws");
  // Browser WS cannot send custom headers; use the platform-provided runtime token only.
  const token = appParams.token || "";
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${wsBase}/api/apps/${appId}/functions/geminiLiveProxy${tokenParam}`;
}

// ─── Safe base64 encode for large typed arrays ────────────────────
function uint8ToBase64(bytes) {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// ─── Finding pill ─────────────────────────────────────────────────
function FindingBadge({ text, type }) {
  const styles = {
    warning: "bg-red-900/40 border-red-500/50 text-red-300",
    ok:      "bg-green-900/30 border-green-500/40 text-green-300",
    info:    "bg-blue-900/30 border-blue-500/40 text-blue-300",
  };
  const icons = {
    warning: <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />,
    ok:      <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" />,
    info:    <Volume2 className="w-3 h-3 shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex items-start gap-2 text-[11px] px-3 py-2 rounded-xl border leading-snug ${styles[type] || styles.info}`}>
      {icons[type] || icons.info}
      <span>{text}</span>
    </div>
  );
}

function classifyFinding(text) {
  if (/red flag|corrosion|crack|leak|damage|rust|wear|issue|problem|concern|missing|fail/i.test(text)) return "warning";
  if (/good|clean|normal|acceptable|no issue|looks fine|ok|well maintained/i.test(text)) return "ok";
  return "info";
}

// ─── Landing Page ─────────────────────────────────────────────────
function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <div className="bg-[#04060a]/80 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <Link to="/listings" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <img src={PILOT_AVATAR} alt="Max" className="w-7 h-7 rounded-full border border-[#f5c242]/50"
            style={{ mixBlendMode: "multiply", background: "#4A90D9" }} />
          <span className="text-white font-black text-sm">Max · Pre-Buy Inspection</span>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-[#f5c242] font-black border border-[#f5c242]/30 px-2 py-0.5 rounded-full">
          BETA
        </span>
      </div>

      <div className="relative overflow-hidden flex-1 flex flex-col">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#04060a]/60 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/3 w-[300px] h-[300px] bg-[#f5c242]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-12 pb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#f5c242]/10 border border-[#f5c242]/30 rounded-full px-4 py-1.5 mb-6">
            <Star className="w-3 h-3 text-[#f5c242]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f5c242]">Exclusive ABOS Feature</span>
          </div>

          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-28 h-28 rounded-full bg-[#f5c242]/10 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute w-24 h-24 rounded-full bg-[#f5c242]/15 animate-pulse" />
            <img src={PILOT_AVATAR} alt="Max"
              className="relative w-20 h-20 rounded-full border-2 border-[#f5c242]/60 object-cover shadow-2xl"
              style={{ mixBlendMode: "multiply", background: "#4A90D9" }} />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
            Live Pre-Buy Inspection<br />
            <span className="text-[#f5c242]">with Max</span>
          </h1>
          <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-2">
            Point your phone camera at any aircraft during a pre-buy inspection. Max watches the live feed and instantly flags issues, concerns, and highlights — spoken aloud in real time.
          </p>
          <p className="text-[11px] text-white/30 mb-8">
            Powered by Gemini Live Vision · Not a substitute for a certified IA or A&P inspection
          </p>

          <button
            onClick={onStart}
            className="group inline-flex items-center gap-3 bg-[#f5c242] hover:bg-[#f5bb4e] text-[#04060a] font-black text-base px-8 py-4 rounded-2xl transition-all shadow-xl shadow-[#f5c242]/20 hover:shadow-[#f5c242]/40 hover:scale-105 active:scale-95"
          >
            <Video className="w-5 h-5" />
            Start Live Inspection
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-[10px] text-white/20 mt-3">Requires camera & microphone access</p>
        </div>

        <div className="relative z-10 px-4 pb-8">
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Eye, color: "#4A90D9", title: "Real-Time Vision", desc: "Gemini analyzes your live camera feed frame by frame — engine bay, airframe, logbooks, instruments." },
              { icon: Volume2, color: "#f5c242", title: "Voice Commentary", desc: "Max speaks findings aloud so you can keep your eyes on the aircraft, hands-free." },
              { icon: FileText, color: "#0F7A56", title: "Auto-Logged Findings", desc: "Every warning, observation, and green flag is captured and classified automatically." },
            ].map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${f.color}20`, border: `1px solid ${f.color}40` }}>
                  <f.icon className="w-4 h-4" style={{ color: f.color }} />
                </div>
                <p className="text-white font-black text-[13px] mb-1">{f.title}</p>
                <p className="text-white/40 text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 pb-10">
          <div className="bg-[#04060a]/60 border border-[#f5c242]/20 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#f5c242] mb-3 flex items-center gap-2">
              <Plane className="w-3 h-3" /> What Max checks
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Engine bay condition", "Corrosion & rust spots",
                "Logbook entries", "Airframe integrity",
                "Landing gear & tires", "Control surface wear",
                "Avionics & instruments", "Interior condition",
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-[11px] text-white/60">
                  <ShieldCheck className="w-3 h-3 text-[#f5c242] shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Session ─────────────────────────────────────────────────
function LiveSession({ onBack }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | live | ws_error | error
  const [findings, setFindings] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState("environment");
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const micSourceRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const audioQueueRef = useRef([]);
  const playingRef = useRef(false);

  // ── Audio playback ──────────────────────────────────────────────
  const playAudioChunk = useCallback(async (base64Audio) => {
    audioQueueRef.current.push(base64Audio);
    if (playingRef.current) return;
    playingRef.current = true;
    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift();
      try {
        const raw = atob(chunk);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        const pcm = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 32768;
        const ctx = new AudioContext({ sampleRate: 24000 });
        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        await new Promise(resolve => { source.onended = () => { ctx.close(); resolve(); }; source.start(); });
      } catch { /* skip corrupt chunk */ }
    }
    playingRef.current = false;
  }, []);

  // ── Gemini message handler ──────────────────────────────────────
  const handleGeminiMessage = useCallback((data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.setupComplete) {
        clearTimeout(connectTimeoutRef.current);
        setStatus("live");
        return;
      }
      if (msg.error) return;
      const parts = msg?.serverContent?.modelTurn?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("audio/")) playAudioChunk(part.inlineData.data);
        if (part.text) {
          setCurrentSpeech(part.text);
          setFindings(prev => [{ text: part.text, type: classifyFinding(part.text), ts: Date.now() }, ...prev].slice(0, 30));
        }
      }
      if (msg?.serverContent?.turnComplete) setCurrentSpeech("");
    } catch { /* ignore parse errors */ }
  }, [playAudioChunk]);

  // ── Send video frame ────────────────────────────────────────────
  const sendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 640, 480);
    const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    wsRef.current.send(JSON.stringify({
      realtime_input: { media_chunks: [{ mime_type: "image/jpeg", data: base64 }] }
    }));
  }, []);

  // ── Mic audio sender (using AudioWorklet-compatible approach) ───
  const startMicCapture = useCallback((stream) => {
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    const source = audioCtx.createMediaStreamSource(stream);
    // Use ScriptProcessor but do NOT connect to destination (avoids echo)
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      if (!micEnabled || wsRef.current?.readyState !== WebSocket.OPEN) return;
      const float32 = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
      }
      const b64 = uint8ToBase64(new Uint8Array(pcm16.buffer));
      wsRef.current.send(JSON.stringify({
        realtime_input: { media_chunks: [{ mime_type: "audio/pcm;rate=16000", data: b64 }] }
      }));
    };
    source.connect(processor);
    // Connect processor to a silent gain node (required for onaudioprocess to fire, but no output)
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0;
    processor.connect(silentGain);
    silentGain.connect(audioCtx.destination);
    micSourceRef.current = { audioCtx, processor, source };
  }, [micEnabled]);

  // ── Cleanup helpers ─────────────────────────────────────────────
  const cleanupWS = useCallback(() => {
    clearInterval(frameIntervalRef.current);
    clearTimeout(connectTimeoutRef.current);
    if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
    if (micSourceRef.current) {
      try {
        micSourceRef.current.processor.disconnect();
        micSourceRef.current.source.disconnect();
        micSourceRef.current.audioCtx.close();
      } catch {}
      micSourceRef.current = null;
    }
    setCurrentSpeech("");
  }, []);

  const cleanup = useCallback(() => {
    cleanupWS();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setStatus("idle");
  }, [cleanupWS]);

  useEffect(() => () => cleanup(), [cleanup]);

  // ── Connect WebSocket ───────────────────────────────────────────
  const connectWS = useCallback(() => {
    cleanupWS();
    setStatus("connecting");
    setErrorMsg("");

    const wsUrl = buildWsUrl();

    let ws;
    try {
      ws = new WebSocket(wsUrl);
    } catch (e) {
      setStatus("ws_error");
      setErrorMsg("Could not connect: " + e.message);
      return;
    }
    wsRef.current = ws;

    // Timeout if setupComplete never arrives
    connectTimeoutRef.current = setTimeout(() => {
      if (status !== "live") {
        setStatus("ws_error");
        setErrorMsg("Gemini took too long to respond. Tap Retry.");
        cleanupWS();
      }
    }, 15000);

    ws.onopen = () => {
      frameIntervalRef.current = setInterval(sendFrame, 2000);
      // Start mic capture on the existing stream
      if (streamRef.current) startMicCapture(streamRef.current);
    };

    ws.onmessage = (e) => handleGeminiMessage(e.data);

    ws.onerror = () => {
      setStatus("ws_error");
      setErrorMsg("Gemini connection failed. Camera still active — tap Retry.");
      cleanupWS();
    };

    ws.onclose = (e) => {
      // Only surface as error if we didn't close it ourselves and were live/connecting
      if (e.code !== 1000 && wsRef.current !== null) {
        setStatus("ws_error");
        setErrorMsg(`Connection closed (${e.code}). Tap Retry to reconnect.`);
        cleanupWS();
      }
    };
  }, [cleanupWS, sendFrame, handleGeminiMessage, startMicCapture]);

  // ── Start session (camera + mic + WS) ──────────────────────────
  const startSession = async () => {
    setStatus("connecting");
    setErrorMsg("");
    setFindings([]);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
    } catch {
      setStatus("error");
      setErrorMsg("Camera/mic access denied. Please allow permissions and retry.");
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }

    connectWS();
  };

  const flipCamera = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach(t => t.stop());
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: newMode, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    const audioTrack = streamRef.current.getAudioTracks()[0];
    const combined = new MediaStream([...newStream.getVideoTracks(), ...(audioTrack ? [audioTrack] : [])]);
    streamRef.current = combined;
    if (videoRef.current) { videoRef.current.srcObject = combined; videoRef.current.play().catch(() => {}); }
  };

  const isLive = status === "live";

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Header */}
      <div className="bg-[#04060a] px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => { cleanup(); onBack(); }} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={PILOT_AVATAR} alt="Max" className="w-8 h-8 rounded-full border border-[#f5c242]/50"
          style={{ mixBlendMode: "multiply", background: "#4A90D9" }} />
        <div className="flex-1">
          <h1 className="text-white font-black text-sm">Max · Live Inspection</h1>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400 animate-pulse" : status === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-white/20"}`} />
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
              {status === "idle" ? "Ready" : status === "connecting" ? "Connecting…" : isLive ? "Live · Gemini Vision Active" : status === "ws_error" ? "Disconnected" : "Error"}
            </p>
          </div>
        </div>
        {isLive && (
          <div className="flex gap-2">
            <button onClick={() => setMicEnabled(v => !v)}
              className={`p-2 rounded-lg border transition-colors ${micEnabled ? "bg-[#f5c242]/20 border-[#f5c242]/40 text-[#f5c242]" : "bg-white/5 border-white/10 text-white/30"}`}>
              {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button onClick={() => setVideoEnabled(v => !v)}
              className={`p-2 rounded-lg border transition-colors ${videoEnabled ? "bg-[#4A90D9]/20 border-[#4A90D9]/40 text-[#4A90D9]" : "bg-white/5 border-white/10 text-white/30"}`}>
              {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            <button onClick={flipCamera} className="p-2 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Video feed */}
      <div className="relative bg-black flex-shrink-0" style={{ aspectRatio: "16/9", maxHeight: "55vh" }}>
        <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!videoEnabled ? "opacity-0" : ""}`} />
        <canvas ref={canvasRef} className="hidden" />

        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <Camera className="w-16 h-16 text-white/20" />
            <p className="text-white/50 text-sm text-center px-8">Point camera at the aircraft — Max will provide real-time analysis</p>
            <button onClick={startSession} className="flex items-center gap-2 bg-[#f5c242] hover:bg-[#f5bb4e] text-[#04060a] font-black px-8 py-3 rounded-xl text-sm transition-colors">
              <Video className="w-4 h-4" /> Start Live Inspection
            </button>
          </div>
        )}
        {status === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
            <Loader2 className="w-10 h-10 text-[#f5c242] animate-spin" />
            <p className="text-white/60 text-sm">Connecting to Gemini Live…</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 px-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
            <p className="text-red-300 text-sm text-center">{errorMsg}</p>
            <button onClick={() => setStatus("idle")} className="mt-2 text-[11px] text-white/40 hover:text-white underline">Try again</button>
          </div>
        )}
        {status === "ws_error" && (
          <div className="absolute bottom-3 left-3 right-3 bg-red-900/80 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" />
            <p className="text-red-200 text-[11px] flex-1 leading-snug">{errorMsg}</p>
            <button onClick={connectWS} className="shrink-0 bg-[#f5c242] text-[#04060a] text-[11px] font-black px-3 py-1.5 rounded-lg">
              Retry
            </button>
          </div>
        )}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
          </div>
        )}
        {currentSpeech && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur rounded-xl px-4 py-2.5">
            <p className="text-white text-[12px] leading-relaxed">{currentSpeech}</p>
          </div>
        )}
      </div>

      {/* Findings */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#f5c242]">
            Findings {findings.length > 0 && `· ${findings.length}`}
          </p>
          {isLive && (
            <button onClick={cleanup} className="text-[11px] text-red-400 hover:text-red-300 font-bold border border-red-500/30 px-3 py-1 rounded-lg transition-colors">
              End Session
            </button>
          )}
        </div>
        {findings.length === 0 && status !== "idle" && (
          <div className="text-center py-8 text-white/20"><p className="text-sm">Max is watching… findings will appear here</p></div>
        )}
        <div className="space-y-2">
          {findings.map((f, i) => <FindingBadge key={`${f.ts}-${i}`} text={f.text} type={f.type} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────
export default function PreBuyInspection() {
  const [mode, setMode] = useState("landing");
  if (mode === "session") return <LiveSession onBack={() => setMode("landing")} />;
  return <LandingPage onStart={() => setMode("session")} />;
}