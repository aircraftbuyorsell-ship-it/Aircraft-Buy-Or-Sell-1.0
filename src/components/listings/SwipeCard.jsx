import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, TrendingDown, TrendingUp,
  CheckCircle2, ThumbsUp, ThumbsDown, Lock, RotateCw, ShieldCheck } from
"lucide-react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";

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
  const color = scoreColor(l.ati_score);
  const deal = dealStyle(l.deal_label);
  const isBelow = l.discount_pct != null && l.discount_pct >= 0;
  const photo = l.photo_url || l.image_url || l.cover_image || l.images?.[0] || l.image_attachments?.[0];
  const aircraftTitle = `${l.year || ""} ${l.make || ""} ${l.model || ""}`.trim() || "Aircraft";
  const accessAllowed = l.confidential_access || l.is_owner || l.is_operator || l.has_loi;
  const fmtMoney = (v) => v ? `$${Number(v).toLocaleString()}` : "On request";
  const fmtHours = (v) => v ? `${Number(v).toLocaleString()} h` : "—";
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
            <div className="relative h-[34%] bg-[#F7F4EF] border-b border-black/[0.06] overflow-hidden">
              {photo ?
              <img src={photo} alt={aircraftTitle} className="w-full h-full object-cover" /> :

              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0B2D5B] to-[#111113]">
                  <span className="text-[#E8A83A] text-[10px] uppercase tracking-[0.24em] font-black">Frontside Photo</span>
                </div>
              }
              <div className="absolute top-3 left-3 bg-white/92 backdrop-blur rounded-full px-2.5 py-1 border border-black/[0.08]">
                <p className="text-[8px] uppercase tracking-[0.18em] font-black text-[#0B2D5B]">SEO Standard</p>
              </div>
              <button
                onClick={(e) => {e.stopPropagation();setFlipped(true);}}
                className="pointer-events-auto absolute top-3 right-3 w-8 h-8 rounded-full bg-white/92 border border-black/[0.08] flex items-center justify-center text-[#0B2D5B] hover:text-[#E8A83A]"
                title="Show confidential back">
                
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 border-b border-black/[0.06]">
              <div className="min-w-0">
                <p className="text-[#E8A83A] text-[8px] uppercase tracking-[0.2em] font-black">ATI Score Card</p>
                <h3 className="text-[#1A1814] font-black text-lg leading-tight truncate">{aircraftTitle}</h3>
                <p className="text-[#6B6560] font-mono text-[10px] mt-0.5">{l.registration || "N-reg pending"}</p>
                <p className="text-[#AAA49C] text-[9px] mt-1">ID {l.public_card_code || l.ati_card_code || l.id?.slice(-8) || "—"}</p>
              </div>
              <div className="shrink-0 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg" style={{ backgroundColor: color }}>
                  {l.ati_score || "—"}
                </div>
                <p className="text-[8px] uppercase tracking-wide font-black mt-1" style={{ color }}>{scoreLabel(l.ati_score)}</p>
              </div>
            </div>

            <div className="px-4 py-2 grid grid-cols-2 gap-2 border-b border-black/[0.06]">
              <div>
                <p className="text-[8px] text-[#AAA49C] uppercase tracking-wider font-bold">Price</p>
                <p className="text-sm font-black text-[#1A1814]">{fmtMoney(l.asking_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-[#AAA49C] uppercase tracking-wider font-bold">OMVM</p>
                <p className="text-sm font-black text-[#0B2D5B]">{l.omvm_value ? fmtMoney(l.omvm_value) : "—"}</p>
                {l.discount_pct != null &&
                <p className={`text-[9px] font-black ${isBelow ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
                    {Math.abs(l.discount_pct)}% {isBelow ? "below" : "above"}
                  </p>
                }
              </div>
            </div>

            <div className="flex-1 px-4 py-2 overflow-hidden">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {info.slice(0, 12).map((item) =>
                <div key={item.label} className="min-w-0">
                    <p className="text-[7px] text-[#AAA49C] uppercase tracking-wider font-bold leading-none">{item.label}</p>
                    <p className="text-[10px] text-[#1A1814] font-bold truncate mt-0.5">{item.value}</p>
                  </div>
                )}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {info.slice(12).map((item) =>
                <div key={item.label} className="bg-[#F7F4EF] rounded-lg px-2 py-1 border border-black/[0.04]">
                    <p className="text-[7px] text-[#AAA49C] uppercase tracking-wider font-bold">{item.label}</p>
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
    </div>);

}

// ─── Swipeable top card ────────────────────────────────────────
function SwipeableCard({ listing, onLike, onDiscard }) {
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const discardOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);

  const handleDragEnd = async (_, info) => {
    const offset = info.offset.x;
    if (offset > SWIPE_THRESHOLD) {
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } });
      onLike(listing);
    } else if (offset < -SWIPE_THRESHOLD) {
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } });
      onDiscard(listing);
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing opacity-60"
      style={{ x, rotate }}
      animate={controls}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
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

      <Card listing={listing} />
    </motion.div>);

}

// ─── Public export: carousel with center card + blurred sides ────
export default function SwipeDeck({ listings, onLike, onDiscard }) {
  const [current, setCurrent] = useState(0);
  const visible = listings.slice(current, current + 3);

  if (listings.length === 0) return null;

  const handleNextSlide = () => {
    if (current + 3 < listings.length) setCurrent(current + 1);
  };

  const handlePrevSlide = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const handleLikeCard = (l) => {
    onLike(l);
    handleNextSlide();
  };

  const handleDiscardCard = (l) => {
    onDiscard(l);
    handleNextSlide();
  };

  return (
    <div className="w-full">
      {/* Desktop/Tablet header hint */}
      <div className="hidden md:flex items-center justify-center gap-4 mb-6 px-4">
        <div className="flex items-center gap-2 text-[11px] text-[#AAA49C] font-semibold uppercase tracking-wider">
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Swipe left to skip
        </div>
        <div className="h-4 w-px bg-black/10" />
        <div className="flex items-center gap-2 text-[11px] text-[#AAA49C] font-semibold uppercase tracking-wider">
          Swipe right to shortlist
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>

      {/* Mobile instruction banner */}
      <div className="md:hidden mb-4 bg-[rgba(11,45,91,0.05)] border border-[rgba(11,45,91,0.15)] rounded-xl px-4 py-2.5 text-center">
        <p className="text-[11px] text-[#0B2D5B] font-semibold">👆 Swipe or tap buttons to browse</p>
      </div>

      {/* Carousel container — center card + blurred sides */}
      <div
        className="relative w-full mx-auto overflow-hidden"
        style={{
          height: "clamp(560px, 82vh, 720px)",
          perspective: "1000px"
        }}>
        
        {/* Blurred left card (peek from left) */}
        {visible[0] &&
        <div
          className="absolute inset-y-0 left-0 w-1/4 md:w-1/3 pointer-events-none z-0 flex items-center justify-center px-2"
          style={{
            opacity: 0.35
          }}>
          
            <div className="w-full h-4/5 rounded-2xl overflow-hidden blur-md scale-75 origin-right">
              <Card listing={visible[0]} />
            </div>
          </div>
        }

        {/* Center main draggable card (full focus) */}
        <div
          className="absolute inset-0 flex items-center justify-center px-4 sm:px-0"
          style={{ zIndex: 10 }}>
          
          <div className="w-full max-w-sm sm:max-w-md" style={{ height: "100%" }}>
            {visible[0] &&
            <SwipeableCard
              key={visible[0].id}
              listing={visible[0]}
              onLike={handleLikeCard}
              onDiscard={handleDiscardCard} />

            }
          </div>
        </div>

        {/* Blurred right card (peek from right) */}
        {visible[1] &&
        <div
          className="absolute inset-y-0 right-0 w-1/4 md:w-1/3 pointer-events-none z-0 flex items-center justify-center px-2"
          style={{
            opacity: 0.35
          }}>
          
            <div className="w-full h-4/5 rounded-2xl overflow-hidden blur-md scale-75 origin-left">
              <Card listing={visible[1]} />
            </div>
          </div>
        }
      </div>
    </div>);

}