import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  Instagram, Loader2, Link2, Unlink, Send, CheckCircle2, Shield, AlertTriangle,
} from "lucide-react";
import PassportPicker from "@/components/instagram/PassportPicker";
import ScoreCardPreview from "@/components/instagram/ScoreCardPreview";
import CaptionEditor from "@/components/instagram/CaptionEditor";

const CONNECTOR_ID = "6a5c2767fffbeca489c4de53";

export default function InstagramPublish() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [igUser, setIgUser] = useState(null);
  const [passports, setPassports] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingPassports, setLoadingPassports] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchConnection = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("instagramPublishScore", { action: "me" });
      if (res.data.igUserId) {
        setConnected(true);
        setIgUser(res.data);
      }
    } catch {
      setConnected(false);
      setIgUser(null);
    }
  }, []);

  const fetchPassports = useCallback(async () => {
    setLoadingPassports(true);
    try {
      const res = await base44.functions.invoke("instagramPublishScore", { action: "list_passports" });
      const list = res.data.passports || [];
      setPassports(list);
      if (list.length > 0) setSelectedId(list[0].id);
    } catch {
      setPassports([]);
    }
    setLoadingPassports(false);
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await fetchConnection();
      }
      setLoading(false);
    });
  }, [fetchConnection]);

  useEffect(() => {
    if (connected) fetchPassports();
  }, [connected, fetchPassports]);

  // Auto-generate caption when passport changes
  useEffect(() => {
    if (selectedId) {
      const p = passports.find((x) => x.id === selectedId);
      if (p) {
        setCaption(buildDefaultCaption(p));
        setResult(null);
        setError("");
      }
    }
  }, [selectedId, passports]);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchConnection();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setIgUser(null);
    setPassports([]);
  };

  const handlePublish = async () => {
    if (!selectedId) return;
    setPublishing(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("instagramPublishScore", {
        action: "publish",
        passportId: selectedId,
        caption,
      });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to publish");
    }
    setPublishing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-[#E1306C]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <Instagram className="w-10 h-10 text-[#E1306C] mb-3" />
        <h2 className="text-lg font-bold text-white/90 mb-2">Sign in required</h2>
        <p className="text-sm text-white/50 mb-4 max-w-sm">
          Sign in to share aircraft transparency scores on your Instagram feed.
        </p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: "#E1306C", color: "#fff" }}
        >
          Sign in
        </button>
      </div>
    );
  }

  const selectedPassport = passports.find((p) => p.id === selectedId);

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: "rgba(255,255,255,0.90)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(225,48,108,0.10)", border: "0.5px solid rgba(225,48,108,0.22)" }}
          >
            <Instagram size={20} style={{ color: "#E1306C" }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#E1306C]">Instagram Business</p>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white/90">Transparency Score Sharing</h1>
          </div>
        </div>
        <p className="text-[13px] text-white/50 max-w-2xl">
          Share your Aircraft Transparency Index (ATI) score cards directly to your Instagram feed.
          Each post generates a branded score card image with the aircraft's rating, deal assessment, and market value.
        </p>
      </div>

      {error && (
        <div className="px-4 md:px-8 pb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-red-300"
            style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.20)" }}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        </div>
      )}

      {result && (
        <div className="px-4 md:px-8 pb-3">
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-lg"
            style={{ background: "rgba(93,202,165,0.08)", border: "0.5px solid rgba(93,202,165,0.20)" }}
          >
            <CheckCircle2 className="w-5 h-5 text-[#5dcaa5] shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-[#5dcaa5]">Published to Instagram!</p>
              <p className="text-[11px] text-white/50 mt-0.5">Media ID: {result.mediaId}</p>
              {result.imageUrl && (
                <img src={result.imageUrl} alt="Score card" className="mt-2 rounded-lg max-h-32 object-cover" />
              )}
            </div>
          </div>
        </div>
      )}

      {!connected ? (
        <div className="px-4 md:px-8 pb-10">
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(225,48,108,0.08)" }}
            >
              <Link2 className="w-7 h-7 text-[#E1306C]" />
            </div>
            <h2 className="text-base font-bold text-white/90 mb-1.5">Connect your Instagram Business account</h2>
            <p className="text-[12px] text-white/50 max-w-md mx-auto mb-5">
              Connect your Instagram Business account to generate and share aircraft transparency score cards on your feed.
            </p>
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "#E1306C", color: "#fff" }}
            >
              <Link2 className="w-4 h-4" /> Connect Instagram
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-10 grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: picker + caption */}
          <div className="space-y-4">
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-2">Select ATI Passport</p>
              <PassportPicker
                passports={passports}
                selectedId={selectedId}
                onSelect={setSelectedId}
                loading={loadingPassports}
              />
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <CaptionEditor value={caption} onChange={setCaption} disabled={publishing} />
              <button
                onClick={handlePublish}
                disabled={publishing || !selectedId}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-30"
                style={{ background: "#E1306C", color: "#fff" }}
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {publishing ? "Generating & Publishing..." : "Share to Instagram"}
              </button>
            </div>
          </div>

          {/* Right: preview + status */}
          <div className="space-y-4">
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" }}
            >
              <span className="text-[11px] font-semibold text-[#5dcaa5] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5dcaa5] animate-pulse" />
                @{igUser?.username || "connected"}
              </span>
              <button
                onClick={handleDisconnect}
                className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1"
              >
                <Unlink className="w-3 h-3" /> Disconnect
              </button>
            </div>

            {selectedPassport && <ScoreCardPreview passport={selectedPassport} />}
          </div>
        </div>
      )}
    </div>
  );
}

function buildDefaultCaption(p) {
  const atiTotal = p.ati_total || 0;
  const scoreLabel = p.score_label || "—";
  const dealLabel = p.deal_label || "";
  const omvm = p.omvm_value ? `$${Number(p.omvm_value).toLocaleString()}` : "";

  return `✈️ ${p.registration} — Aircraft Transparency Index

📊 ATI Score: ${atiTotal}/120
🏷️ Rating: ${scoreLabel}${dealLabel ? `\n🎯 Deal Assessment: ${dealLabel}` : ""}${omvm ? `\n💰 Market Value: ${omvm}` : ""}${p.ai_summary ? `\n\n${p.ai_summary}` : ""}

Powered by ABOS Marketspace — aviation market intelligence & transparency.
#abos #aviation #aircraftforsale #transparency #ATI #aircraft`;
}