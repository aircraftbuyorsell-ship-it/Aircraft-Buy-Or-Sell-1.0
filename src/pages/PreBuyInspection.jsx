import { useState, useRef, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import {
  Video, VideoOff, Mic, MicOff, AlertTriangle,
  CheckCircle, Loader2, ArrowLeft, Camera, RotateCcw, Volume2
} from "lucide-react";
import { Link } from "react-router-dom";

const PILOT_AVATAR = "https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/b544f2587_generated_image.png";

// ─── Finding pill ────────────────────────────────────────────────
function FindingBadge({ text, type }) {
  const styles = {
    warning: "bg-red-900/40 border-red-500/50 text-red-300",
    ok:      "bg-green-900/30 border-green-500/40 text-green-300",
    info:    "bg-blue-900/30 border-blue-500/40 text-blue-300",
  };
  const icons = {
    warning: <AlertTriangle className="w-3 h-3 shrink-0" />,
    ok:      <CheckCircle className="w-3 h-3 shrink-0" />,
    info:    <Volume2 className="w-3 h-3 shrink-0" />,
  };
  return (
    <div className={`flex items-start gap-2 text-[11px] px-3 py-2 rounded-xl border leading-snug ${styles[type] || styles.info}`}>
      {icons[type] || icons.info}
      <span>{text}</span>
    </div>
  );
}

// Classify a text finding
function classifyFinding(text) {
  const lower = text.toLowerCase();
  if (/red flag|corrosion|crack|leak|damage|rust|wear|issue|problem|concern|missing|fail/i.test(lower)) return "warning";
  if (/good|clean|normal|acceptable|no issue|looks fine|ok|well maintained/i.test(lower)) return "ok";
  return "info";
}

export default function PreBuyInspection() {
  const [status, setStatus] = useState("idle"); // idle | connecting | live | error
  const [findings, setFindings] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState("environment"); // rear camera default
  const [errorMsg, setErrorMsg] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const audioQueueRef = useRef([]);
  const playingRef = useRef(false);

  // ── Cleanup ──────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    clearInterval(frameIntervalRef.current);
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    setStatus("idle");
    setCurrentSpeech("");
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // ── Play audio chunks from Gemini ────────────────────────────
  const playAudioChunk = useCallback(async (base64Audio) => {
    audioQueueRef.current.push(base64Audio);
    if (playingRef.current) return;
    playingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift();
      try {
        const ctx = new AudioContext({ sampleRate: 24000 });
        const raw = atob(chunk);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        // PCM16 → float32
        const pcm = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 32768;
        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        await new Promise(resolve => {
          source.onended = () => { ctx.close(); resolve(); };
          source.start();
        });
      } catch { /* skip bad chunk */ }
    }
    playingRef.current = false;
  }, []);

  // ── Handle Gemini messages ───────────────────────────────────
  const handleGeminiMessage = useCallback((data) => {
    try {
      const msg = JSON.parse(data);

      // Setup confirmed
      if (msg.setupComplete) {
        setStatus("live");
        return;
      }

      // Server content
      const parts = msg?.serverContent?.modelTurn?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("audio/")) {
          playAudioChunk(part.inlineData.data);
        }
        if (part.text) {
          setCurrentSpeech(part.text);
          setFindings(prev => {
            const type = classifyFinding(part.text);
            const entry = { text: part.text, type, ts: Date.now() };
            return [entry, ...prev].slice(0, 20);
          });
        }
      }

      // Turn complete
      if (msg?.serverContent?.turnComplete) {
        setCurrentSpeech("");
      }
    } catch { /* ignore parse errors */ }
  }, [playAudioChunk]);

  // ── Capture + send video frame ───────────────────────────────
  const sendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = 640;
    canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
    const jpeg = canvas.toDataURL("image/jpeg", 0.7);
    const base64 = jpeg.split(",")[1];
    const msg = {
      realtime_input: {
        media_chunks: [{
          mime_type: "image/jpeg",
          data: base64
        }]
      }
    };
    wsRef.current.send(JSON.stringify(msg));
  }, []);

  // ── Start session ────────────────────────────────────────────
  const startSession = async () => {
    setStatus("connecting");
    setErrorMsg("");
    setFindings([]);

    // Get camera + mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: 640, height: 480 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Set up audio capture
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!micEnabled || wsRef.current?.readyState !== WebSocket.OPEN) return;
        const float32 = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        wsRef.current.send(JSON.stringify({
          realtime_input: {
            media_chunks: [{ mime_type: "audio/pcm;rate=16000", data: base64 }]
          }
        }));
      };
      source.connect(processor);
      processor.connect(audioCtx.destination);

    } catch (e) {
      setStatus("error");
      setErrorMsg("Camera/mic access denied. Please allow permissions and retry.");
      return;
    }

    // Connect WebSocket via our backend proxy
    try {
      const { appId, appBaseUrl } = appParams;
      const httpBase = appBaseUrl
        ? `${appBaseUrl}/api/apps/${appId}/functions`
        : `https://appapi.base44.com/api/apps/${appId}/functions`;
      const wsBase = httpBase.replace(/^https/, "wss").replace(/^http/, "ws");
      const functionWsUrl = `${wsBase}/geminiLiveProxy`;

      const ws = new WebSocket(functionWsUrl);
      wsRef.current = ws;

      ws.onmessage = (e) => handleGeminiMessage(e.data);
      ws.onerror = () => {
        setStatus("error");
        setErrorMsg("Connection to Gemini failed. Check your API key.");
        cleanup();
      };
      ws.onclose = () => {
        if (status === "live") setStatus("idle");
      };
      ws.onopen = () => {
        // Start sending frames every 2 seconds
        frameIntervalRef.current = setInterval(sendFrame, 2000);
      };

    } catch (e) {
      setStatus("error");
      setErrorMsg("Could not connect to inspection service: " + e.message);
      cleanup();
    }
  };

  const flipCamera = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.stop());
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode, width: 640, height: 480 },
        audio: false,
      });
      const audioTrack = streamRef.current.getAudioTracks()[0];
      const combined = new MediaStream([...newStream.getVideoTracks(), ...(audioTrack ? [audioTrack] : [])]);
      streamRef.current = combined;
      if (videoRef.current) {
        videoRef.current.srcObject = combined;
        videoRef.current.play();
      }
    }
  };

  const isLive = status === "live";

  return (
    <div className="min-h-screen bg-[#060E1A] flex flex-col">
      {/* Header */}
      <div className="bg-[#0B2D5B] px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <Link to="/max-chat" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <img src={PILOT_AVATAR} alt="Max" className="w-8 h-8 rounded-full border border-[#E8A83A]/50"
          style={{ mixBlendMode: "multiply", background: "#4A90D9" }} />
        <div className="flex-1">
          <h1 className="text-white font-black text-sm">Max · Live Pre-Buy Inspection</h1>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400 animate-pulse" : status === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-white/20"}`} />
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
              {status === "idle" ? "Ready" : status === "connecting" ? "Connecting…" : status === "live" ? "Live · Gemini Vision Active" : "Error"}
            </p>
          </div>
        </div>
        {isLive && (
          <div className="flex gap-2">
            <button onClick={() => setMicEnabled(v => !v)}
              className={`p-2 rounded-lg border transition-colors ${micEnabled ? "bg-[#E8A83A]/20 border-[#E8A83A]/40 text-[#E8A83A]" : "bg-white/5 border-white/10 text-white/30"}`}>
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
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${!videoEnabled ? "opacity-0" : ""}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay when not live */}
        {status === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <Camera className="w-16 h-16 text-white/20" />
            <p className="text-white/50 text-sm text-center px-8">
              Point your camera at the aircraft and Max will provide<br />real-time inspection commentary via Gemini Vision
            </p>
            <button
              onClick={startSession}
              className="flex items-center gap-2 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] font-black px-8 py-3 rounded-xl text-sm transition-colors"
            >
              <Video className="w-4 h-4" />
              Start Live Inspection
            </button>
          </div>
        )}

        {status === "connecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
            <Loader2 className="w-10 h-10 text-[#E8A83A] animate-spin" />
            <p className="text-white/60 text-sm">Connecting to Gemini Live…</p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 px-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
            <p className="text-red-300 text-sm text-center">{errorMsg}</p>
            <button onClick={() => setStatus("idle")}
              className="mt-2 text-[11px] text-white/40 hover:text-white underline">
              Try again
            </button>
          </div>
        )}

        {/* Live badge */}
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {/* Current speech overlay */}
        {currentSpeech && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur rounded-xl px-4 py-2.5">
            <p className="text-white text-[12px] leading-relaxed">{currentSpeech}</p>
          </div>
        )}
      </div>

      {/* Findings log */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">
            Inspection Findings {findings.length > 0 && `· ${findings.length}`}
          </p>
          {isLive && (
            <button
              onClick={cleanup}
              className="text-[11px] text-red-400 hover:text-red-300 font-bold border border-red-500/30 px-3 py-1 rounded-lg transition-colors"
            >
              End Session
            </button>
          )}
        </div>

        {findings.length === 0 && status !== "idle" && (
          <div className="text-center py-8 text-white/20">
            <p className="text-sm">Max is watching… findings will appear here</p>
          </div>
        )}

        <div className="space-y-2">
          {findings.map((f, i) => (
            <FindingBadge key={`${f.ts}-${i}`} text={f.text} type={f.type} />
          ))}
        </div>

        {/* Tip */}
        {status === "idle" && findings.length === 0 && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/40 leading-relaxed space-y-1">
            <p className="font-black text-white/60 text-[11px] uppercase tracking-wider mb-2">How to use</p>
            <p>1. Press <b className="text-white/60">Start Live Inspection</b> and allow camera + mic access</p>
            <p>2. Point camera at aircraft areas — engine, airframe, logbooks, instruments</p>
            <p>3. Max analyzes the feed in real-time and calls out findings by voice</p>
            <p>4. All findings are logged below for your records</p>
            <p className="mt-2 text-[#E8A83A]/60">Powered by Gemini 2.0 Flash Live Vision</p>
          </div>
        )}
      </div>
    </div>
  );
}