import { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, TrendingDown, TrendingUp,
  CheckCircle2, ThumbsUp, ThumbsDown, Lock, RotateCw, ShieldCheck,
  Pencil, ChevronLeft, ChevronRight, ChevronUp, Zap, X } from
"lucide-react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import CardAdminEditor from "@/components/listings/CardAdminEditor";

const SWIPE_THRESHOLD = 100;

function scoreColor(s) {
  if (!s) return "#AAA49C";
  if (s >= 90) return "#0F7A56";
  if (s >= 72) return "#185FA5";
  if (s >= 54) return "#D4A017";
  return "#C0392B";
}
function scoreLabel(s) {
  if (!s) return "—";
  if (s >= 108) return "Exceptional";
  if (s >= 90) return "Strong Buy";
  if (s >= 72) return "Fair";
  if (s >= 54) return "Caution";
  return "Avoid";
}
function dealStyle(label) {
  const map = {
    "hot deal": { bg: "rgba(212,160,23,0.12)", color: "#A67C00", border: "rgba(212,160,23,0.3)", emoji: "⚡" },
    "good deal": { bg: "rgba(15,122,86,0.10)", color: "#0F7A56", border: "rgba(15,122,86,0.25)", emoji: "✅" },
    "fair": { bg: "rgba(24,95,165,0.08)", color: "#185FA5", border: "rgba(24,95,165,0.2)", emoji: "➡️" },
    "overpriced": { bg: "rgba(192,57,43,0.08)", color: "#C0392B", border: "rgba(192,57,43,0.2)", emoji: "⚠️" }
  };
  return map[(label || "").toLowerCase()] || null;
}

function Card({ listing: l }) {
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const color = scoreColor(l.ati_score);
  const deal = dealStyle(l.deal_label);
  const isBelow = l.discount_pct != null && l.discount_pct >= 0;
  const photo = l.photo_url || l.image_url || l.cover_image || l.images?.[0] || l.image_attachments?.[0];
  const aircraftTitle = `${l.year || ""} ${l.make || ""} ${l.model || ""}`.trim() || "Aircraft";
  const accessAllowed = l.confidential_access || l.is_owner || l.is_operator || l.has_loi;
  const fmtMoney = (v) => v ? `$${Number(v).toLocaleString()}` : "On request";
  const fmtHours = (v) => v ? `${Number(v).toLocaleString()} h` : "—";
  const hasPrice = l.asking_price != null && l.asking_price > 0;

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me-swipe"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 60000
  });
  const isOwner = currentUser && l.owner === currentUser.id;
  const isAdmin = currentUser?.role === "admin";

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete listing for ${aircraftTitle}?`)) return;
    try {
      await base44.entities.AircraftListing.delete(l.id);
      window.location.reload();
    } catch (err) {
      alert("Delete failed: " + (err?.message || "Unknown error"));
    }
  };
  const info = [
  { label: "TT", value: fmtHours(l.total_time) },
  { label: "TAF", value: fmtHours(l.taf || l.airframe_hours || l.total_airframe_time) },
  { label: "Engine SMOH/TBO", value: `${fmtHours(l.engine_hours)} / ${fmtHours(l.tbo)}` },
  { label: "Prop SMOH/TBO", value: `${fmtHours(l.propeller_smoh)} / ${fmtHours(l.propeller_tbo)}` },
  { label: "Seats", value: l.seats || l.number_of_seats || "—" },
  { label: "Useful load", value: l.useful_load ? `${l.useful_load} lb` : "—" },
  { label: "Range", value: l.operating_range || l.range_nm ? `${l.operating_range || l.range_nm} nm` : "—" },
  { label: "Max speed", value: l.max_speed ? `${l.max_speed} kt` : "—" },
  { label: "Avg fuel", value: l.average_consumption || l.fuel_burn ? `${l.average_consumption || l.fuel_burn} gph` : "—" },
  { label: "Fuel", value: l.fuel_type || "AVGAS" },
  { label: "Avionics", value: l.avionics || "Standard classic flight instruments" },
  { label: "Capability", value: l.ifr_capable ? "IFR" : l.vfr_capable ? "VFR" : "VFR / IFR to verify" },
  { label: "Interior", value: l.interior_condition ? `${l.interior_condition}/10` : "—" },
  { label: "Exterior", value: l.exterior_condition ? `${l.exterior_condition}/10` : "—" },
  { label: "Wearables", value: l.gadgets || l.modern_upgrades || "USB / modern upgrades if installed" }];


  return (
    <div className="w-full pointer-events-none select-none" style={{ aspectRatio: "2.5 / 3.5" }}>
      <div className="relative w-full h-full" style={{ perspective: "1200px" }}>
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          
          {/* Front side */}
          <div className="absolute inset-0 bg-white border border-black/[0.08] shadow-xl overflow-hidden flex flex-col" style={{ borderRadius: 15, backfaceVisibility: "hidden" }}>
            <div className="relative h-[38%] bg-[#F7F4EF] border-b border-black/[0.06] overflow-hidden">
              {photo ?
              <>
                <img src={photo} alt={aircraftTitle} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent 45%)" }} />
              </> :

              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0B2D5B] to-[#111113]">
                  <span className="text-[#E8A83A] text-2xl font-black tracking-[0.18em]">ABOS</span>
                  <span className="text-white/35 text-[9px] uppercase tracking-[0.24em] font-bold mt-1.5">Photo Pending</span>
                </div>
              }
              <div className="absolute top-3 left-3 bg-white/92 backdrop-blur rounded-full px-2.5 py-1 border border-black/[0.08]">
                <p className="text-[8px] uppercase tracking-[0.18em] font-black text-[#0B2D5B]">SEO Standard</p>
              </div>
              <div className="pointer-events-auto absolute top-3 right-3 flex items-center gap-1.5">
                {(isOwner || isAdmin) &&
                <button
                  onClick={(e) => {e.stopPropagation();setEditing(true);}}
                  className="w-8 h-8 rounded-full bg-white/92 border border-black/[0.08] flex items-center justify-center text-[#185FA5] hover:text-[#0B2D5B] transition-colors"
                  title="Edit listing">

                  <Pencil className="w-3.5 h-3.5" />
                </button>
                }
                {isAdmin &&
                <button
                  onClick={handleDelete}
                  className="w-8 h-8 rounded-full bg-white/92 border border-black/[0.08] flex items-center justify-center text-[#C0392B] hover:text-red-700 transition-colors"
                  title="Delete listing">

                  <X className="w-3.5 h-3.5" />
                </button>
                }
                <button
                  onClick={(e) => {e.stopPropagation();setFlipped(true);}}
                  className="w-8 h-8 rounded-full bg-white/92 border border-black/[0.08] flex items-center justify-center text-[#0B2D5B] hover:text-[#E8A83A]"
                  title="Show confidential back">
                  
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 border-b border-black/[0.06]">
              <div className="min-w-0">
                <p className="text-[#E8A83A] text-[8px] uppercase tracking-[0.2em] font-black">ATI Score Card</p>
                <h3 className="text-[#1A1814] font-black text-lg leading-tight truncate">{aircraftTitle}</h3>
                <p className="text-[#3a3530] font-mono text-[10px] mt-0.5">{l.registration || "N-reg pending"}</p>
                <p className="text-[#4a4550] text-[9px] mt-1">ID {l.public_card_code || l.ati_card_code || l.id?.slice(-8) || "—"}</p>
              </div>
              <div className="shrink-0 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: color }}>
                  {l.ati_score || "—"}
                </div>
                <p className="text-[8px] uppercase tracking-wide font-black mt-1" style={{ color }}>{scoreLabel(l.ati_score)}</p>
              </div>
            </div>

            {hasPrice &&
            <div className="px-4 py-2 grid grid-cols-2 gap-2 border-b border-black/[0.06]">
              <div>
                <p className="text-[8px] text-[#4a4550] uppercase tracking-wider font-bold">Price</p>
                <p className="text-sm font-black text-[#1A1814]">{fmtMoney(l.asking_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-[#4a4550] uppercase tracking-wider font-bold">Expert Est.</p>
                <p className="text-sm font-black text-[#0B2D5B]">{l.omvm_value ? fmtMoney(l.omvm_value) : "—"}</p>
                {l.discount_pct != null &&
                <p className={`text-[9px] font-black ${isBelow ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
                    {Math.abs(l.discount_pct)}% {isBelow ? "below" : "above"}
                  </p>
                }
              </div>
            </div>
            }

            <div className="flex-1 px-4 py-2 overflow-hidden">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {info.slice(0, 12).map((item) =>
                <div key={item.label} className="min-w-0">
                    <p className="text-[7px] text-[#4a4550] uppercase tracking-wider font-bold leading-none">{item.label}</p>
                    <p className="text-[10px] text-[#1A1814] font-bold truncate mt-0.5">{item.value}</p>
                  </div>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {info.slice(12).map((item) =>
                <div key={item.label} className="bg-[#F7F4EF] rounded-lg px-2 py-1 border border-black/[0.04]">
                    <p className="text-[7px] text-[#4a4550] uppercase tracking-wider font-bold">{item.label}</p>
                    <p className="text-[9px] text-[#1A1814] font-black truncate">{item.value}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2 flex items-center justify-between border-t border-black/[0.06]">
              <div className="flex items-center gap-1.5 min-w-0">
                {deal && <span className="text-[8px] uppercase tracking-wider font-black px-2 py-1 rounded-full border" style={{ background: deal.bg, color: deal.color, borderColor: deal.border }}>{l.deal_label}</span>}
                {l.fresh_annual && <span className="text-[8px] font-black text-[#0F7A56]">Fresh annual</span>}
              </div>
              <Link to={`/ati-passport/${l.id}`} className="pointer-events-auto flex items-center gap-1 text-[9px] text-[#D4A017] hover:text-[#0B2D5B] font-black uppercase tracking-wider" onClick={(e) => e.stopPropagation()}>
                Report <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Back side */}
          <div className="absolute inset-0 bg-[#111113] border border-[#E8A83A]/25 shadow-xl overflow-hidden flex flex-col p-4" style={{ borderRadius: 15, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <button
              onClick={(e) => {e.stopPropagation();setFlipped(false);}}
              className="pointer-events-auto absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[#E8A83A] hover:text-white"
              title="Back to front">
              
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="pr-10">
              <p className="text-[#E8A83A] text-[8px] uppercase tracking-[0.24em] font-black">Confidential Back Side</p>
              <h3 className="text-white font-black text-lg leading-tight mt-1">Broker / LOI Data</h3>
              <p className="text-white/40 text-[10px] mt-1">Owner, operator, A&P, CAMO or broker with LOI only.</p>
            </div>

            {!accessAllowed ?
            <div className="flex-1 flex flex-col items-center justify-center text-center px-5">
                <div className="w-16 h-16 rounded-full bg-[#E8A83A]/10 border border-[#E8A83A]/30 flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-[#E8A83A]" />
                </div>
                <p className="text-white font-black text-sm uppercase tracking-wide">Locked confidential layer</p>
                <p className="text-white/50 text-[11px] leading-relaxed mt-2">
                  Commission chain, Mash IDs, owner/operator details and LOI-sensitive data stay hidden until verified access is granted.
                </p>
              </div> :

            <div className="flex-1 mt-5 space-y-3">
                {[
              { label: "1st Level", value: l.broker_split || "Broker / seller split — private", id: l.broker_mash_id },
              { label: "2nd Level", value: l.finders_fee || "Finder fee — private", id: l.finder_mash_id },
              { label: "3rd Level", value: l.referral_fee || "Referral fee — private", id: l.referral_mash_id }].
              map((row) =>
              <div key={row.label} className="rounded-xl bg-white/[0.06] border border-white/10 p-3">
                    <p className="text-[#E8A83A] text-[8px] uppercase tracking-[0.18em] font-black">{row.label}</p>
                    <p className="text-white text-[12px] font-bold mt-1">{row.value}</p>
                    <p className="text-white/40 text-[10px] mt-0.5">Mash ID: {row.id || "Pending"}</p>
                  </div>
              )}
              </div>
            }

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white/45 text-[9px] uppercase tracking-wider font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E8A83A]" /> Restricted ATI data
              </div>
              <Link to={`/ati-passport/${l.id}`} className="pointer-events-auto text-[9px] text-[#E8A83A] font-black uppercase tracking-wider hover:text-white" onClick={(e) => e.stopPropagation()}>
                Request LOI
              </Link>
            </div>
          </div>
        </div>
      </div>
      {editing && <CardAdminEditor listing={l} onClose={() => setEditing(false)} />}
    </div>);

}

// ─── Swipeable top card ────────────────────────────────────────
function SwipeableCard({ listing, onLike, onDiscard, onOffer }) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const discardOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);
  const offerOpacity = useTransform(y, [-SWIPE_THRESHOLD, -20], [1, 0]);

  const handleDragEnd = async (_, info) => {
    const ox = info.offset.x;
    const oy = info.offset.y;
    // Vertical (up) takes priority when it dominates
    if (oy < -SWIPE_THRESHOLD && Math.abs(oy) > Math.abs(ox)) {
      await controls.start({ y: -600, opacity: 0, transition: { duration: 0.3 } });
      onOffer(listing);
    } else if (ox > SWIPE_THRESHOLD) {
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } });
      onLike(listing);
    } else if (ox < -SWIPE_THRESHOLD) {
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } });
      onDiscard(listing);
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing opacity-85"
      style={{ x, y, rotate }}
      animate={controls}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}>
      
      {/* Like overlay */}
      <motion.div className="absolute inset-0 z-10 flex items-start justify-start p-5 pointer-events-none rounded-2xl overflow-hidden"
      style={{ opacity: likeOpacity, background: "rgba(15,122,86,0.06)", borderWidth: 2, borderStyle: "solid", borderColor: "rgba(15,122,86,0.4)" }}>
        <div className="bg-[#0F7A56] text-white px-4 py-1.5 rounded-xl font-black text-sm flex items-center gap-2 rotate-[-12deg]">
          <ThumbsUp className="w-4 h-4" /> INTERESTED
        </div>
      </motion.div>

      {/* Discard overlay */}
      <motion.div className="absolute inset-0 z-10 flex items-start justify-end p-5 pointer-events-none rounded-2xl overflow-hidden"
      style={{ opacity: discardOpacity, background: "rgba(192,57,43,0.05)", borderWidth: 2, borderStyle: "solid", borderColor: "rgba(192,57,43,0.35)" }}>
        <div className="bg-[#C0392B] text-white px-4 py-1.5 rounded-xl font-black text-sm flex items-center gap-2 rotate-[12deg]">
          SKIP <ThumbsDown className="w-4 h-4" />
        </div>
      </motion.div>

      {/* Offer (up) overlay */}
      <motion.div className="absolute inset-0 z-10 flex items-end justify-center p-5 pointer-events-none rounded-2xl overflow-hidden"
      style={{ opacity: offerOpacity, background: "rgba(232,168,58,0.07)", borderWidth: 2, borderStyle: "solid", borderColor: "rgba(232,168,58,0.45)" }}>
        <div className="bg-[#E8A83A] text-[#111113] px-4 py-1.5 rounded-xl font-black text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" /> CREATE ATI OFFER
        </div>
      </motion.div>

      <Card listing={listing} />
    </motion.div>);

}

// ─── Public export: carousel with center card + visible side cards, arrows & touchpad ────
export default function SwipeDeck({ listings, onLike, onDiscard, onOffer }) {
  const [current, setCurrent] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  const prevIdx = current > 0 ? current - 1 : null;
  const nextIdx = current + 1 < listings.length ? current + 1 : null;
  const currentListing = listings[current];

  useEffect(() => {
    setCurrent(0);
  }, [listings]);

  const handleNext = useCallback(() => {
    setCurrent((c) => c + 1 < listings.length ? c + 1 : c);
  }, [listings.length]);

  const handlePrev = useCallback(() => {
    setCurrent((c) => c > 0 ? c - 1 : c);
  }, []);

  const handleLikeCard = (l) => {
    onLike(l);
    handleNext();
  };

  const handleDiscardCard = (l) => {
    onDiscard(l);
    handleNext();
  };

  const handleOfferCard = useCallback((l) => {
    if (!l) return;
    onOffer?.(l);
    navigate(`/ati-quick-score?listing=${l.id}`);
  }, [onOffer, navigate]);

  // Touchpad 2-finger swipe via wheel events (horizontal on trackpads)
  const handleWheel = useCallback((e) => {
    const { deltaX, deltaY } = e;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      e.preventDefault();
      if (deltaX > 0) handleNext();else
      handlePrev();
    }
  }, [handleNext, handlePrev]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Keyboard binds: ←/A skip, →/D interested, ↑/W create offer
  useEffect(() => {
    const handleKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;
      const l = listings[current];
      if (!l) return;
      const k = e.key.toLowerCase();
      if (e.key === "ArrowRight" || k === "d") { onLike(l); handleNext(); }
      else if (e.key === "ArrowLeft" || k === "a") { onDiscard(l); handleNext(); }
      else if (e.key === "ArrowUp" || k === "w") { e.preventDefault(); handleOfferCard(l); handleNext(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [listings, current, onLike, onDiscard, handleNext, handleOfferCard]);

  if (listings.length === 0) return null;

  return (
    <div className="w-full">
      {/* Desktop/Tablet header hint */}
      <div className="hidden md:flex items-center justify-center gap-4 mb-6 px-4">
        <div className="flex items-center gap-2 text-[11px] text-[#4a4550] font-semibold uppercase tracking-wider">
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Swipe left to skip
        </div>
        <div className="h-4 w-px bg-black/10" />
        <div className="flex items-center gap-2 text-[11px] text-[#4a4550] font-semibold uppercase tracking-wider">
          Swipe right to shortlist
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <div className="h-4 w-px bg-black/10" />
        <div className="flex items-center gap-2 text-[11px] text-[#A67C00] font-semibold uppercase tracking-wider">
          <ChevronUp className="w-4 h-4 animate-pulse" />
          Swipe up to create ATI offer
        </div>
        <div className="h-4 w-px bg-black/10" />
        <div className="text-[10px] text-[#4a4550] font-medium normal-case tracking-normal">Keys: ← / → / ↑ or A / D / W</div>
      </div>

      {/* Mobile instruction banner */}
      <div className="md:hidden mb-4 bg-[rgba(11,45,91,0.05)] border border-[rgba(11,45,91,0.15)] rounded-xl px-4 py-2.5 text-center">
        <p className="text-[11px] text-[#0B2D5B] font-semibold">👆 Swipe or use arrows to browse</p>
      </div>

      {/* Carousel container — three visible cards + arrows */}
      <div
        ref={carouselRef}
        className="relative w-full mx-auto overflow-hidden"
        style={{
          height: "clamp(560px, 78vh, 700px)",
          perspective: "1200px"
        }}>
        
        {/* ── LEFT ARROW ── */}
        {current > 0 &&
        <button
          onClick={handlePrev}
          className="absolute left-1 md:left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 border border-black/[0.08] shadow-lg flex items-center justify-center text-[#1A1814] hover:text-[#E8A83A] hover:scale-110 transition-all active:scale-95"
          aria-label="Previous aircraft">
            
            <ChevronLeft className="w-5 h-5" />
          </button>
        }

        {/* ── RIGHT ARROW ── */}
        {current + 1 < listings.length &&
        <button
          onClick={handleNext}
          className="absolute right-1 md:right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 border border-black/[0.08] shadow-lg flex items-center justify-center text-[#1A1814] hover:text-[#E8A83A] hover:scale-110 transition-all active:scale-95"
          aria-label="Next aircraft">
            
            <ChevronRight className="w-5 h-5" />
          </button>
        }

        {/* ── LEFT SIDE CARD (previous, faded & smaller) ── */}
        {prevIdx != null && listings[prevIdx] &&
        <div
          className="absolute inset-y-0 hidden md:flex items-center justify-end pointer-events-none z-0"
          style={{
            left: "2%",
            width: "32%",
            opacity: 0.45,
            filter: "blur(1px)",
            transform: "scale(0.82) translateX(-6%)"
          }}>
            
            <div className="w-full h-[85%] rounded-2xl overflow-hidden shadow-lg">
              <Card listing={listings[prevIdx]} />
            </div>
          </div>
        }

        {/* ── CENTER MAIN CARD ── */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10 mx-auto"
          style={{ width: "44%", left: "28%" }}>
          
          <div className="w-full" style={{ height: "92%" }}>
            {currentListing &&
            <SwipeableCard
              key={currentListing.id}
              listing={currentListing}
              onLike={handleLikeCard}
              onDiscard={handleDiscardCard}
              onOffer={handleOfferCard} />
            }
          </div>
        </div>

        {/* ── RIGHT SIDE CARD (next, faded & smaller) ── */}
        {nextIdx != null && listings[nextIdx] &&
        <div
          className="absolute inset-y-0 hidden md:flex items-center justify-start pointer-events-none z-0"
          style={{
            right: "2%",
            width: "32%",
            opacity: 0.45,
            filter: "blur(1px)",
            transform: "scale(0.82) translateX(6%)"
          }}>
            
            <div className="w-full h-[85%] rounded-2xl overflow-hidden shadow-lg">
              <Card listing={listings[nextIdx]} />
            </div>
          </div>
        }

        {/* ── PAGE INDICATOR ── */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {Array.from({ length: Math.min(listings.length, 20) }).map((_, i) =>
          <div
            key={i}
            className="rounded-full transition-all duration-200"
            style={{
              width: i === current ? 16 : 5,
              height: 5,
              background: i === current ? "#E8A83A" : "rgba(0,0,0,0.15)"
            }} />

          )}
        </div>
      </div>

      {/* ── MOBILE: Full-width card (no side cards) ── */}
      <div className="md:hidden mt-2 text-center text-[10px] text-[#4a4550] font-medium">
        {current + 1} / {listings.length}
      </div>
    </div>);

}