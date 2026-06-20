import { Link } from "react-router-dom";
import {
  Upload, ShieldCheck, HelpCircle, X, Plane, Zap,
} from "lucide-react";
import MiniGlobe         from "@/components/MiniGlobe";
import SwipeDeck         from "@/components/listings/SwipeCard";
import BulkActionsBar    from "@/components/listings/BulkActionsBar";
import ListingRow        from "@/components/listings/ListingRow";
import SelectAllCheckbox from "@/components/listings/SelectAllCheckbox";
import ListingDrawer     from "@/components/listings/ListingDrawer";
import QuickPasteImport  from "@/components/listings/QuickPasteImport";
import AircraftWizard    from "@/components/aircraft-wizard/AircraftWizard";
import UpgradeGate       from "@/components/marketing/UpgradeGate";
import { TOKEN_COSTS }   from "@/lib/pricing";

// ─── v2 design tokens ─────────────────────────────────────────────────────────
const T = {
  ink:      "#04060a",
  ink1:     "#0d1117",
  ink2:     "#111620",
  ink3:     "#1a2235",
  amber:    "#f5c242",
  amberDim: "rgba(245,194,66,0.09)",
  amberBdr: "rgba(245,194,66,0.22)",
  teal:     "#5dcaa5",
  tealDim:  "rgba(93,202,165,0.09)",
  tealBdr:  "rgba(93,202,165,0.20)",
  red:      "#e24b4a",
  redDim:   "rgba(226,75,74,0.10)",
  redBdr:   "rgba(226,75,74,0.22)",
  w1:       "rgba(255,255,255,0.90)",
  w2:       "rgba(255,255,255,0.50)",
  w3:       "rgba(255,255,255,0.25)",
  w4:       "rgba(255,255,255,0.09)",
  border:   "rgba(255,255,255,0.08)",
  borderMd: "rgba(255,255,255,0.12)",
};

const card = {
  background:   T.ink1,
  border:       `0.5px solid ${T.border}`,
  borderRadius: "12px",
  overflow:     "hidden",
};

const cardElevated = {
  ...card,
  background: T.ink2,
};

function Label({ children, color = T.w3, style = {} }) {
  return (
    <p style={{
      fontSize:      "9px",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      fontWeight:    600,
      color,
      margin:        0,
      ...style,
    }}>
      {children}
    </p>
  );
}

export default function ListingsBody({
  isLoading,
  filtered,
  listings,
  viewMode,
  shortlisted,
  discarded,
  selectedIds,
  selected,
  showImport,
  showWizard,
  showFAQ,
  gate,
  tokens,
  isVerified,
  queryClient,
  setShortlisted,
  setDiscarded,
  setSelected,
  setShowImport,
  setShowWizard,
  setShowFAQ,
  setGate,
  selectAll,
  clearSelection,
  toggleSelect,
  requireFeature,
}) {
  const unscored      = listings.filter((l) => !l.ati_score).length;
  const totalReviewed = shortlisted.length + discarded.length;
  const progress      = filtered.length > 0 ? (totalReviewed / filtered.length) * 100 : 0;

  return (
    <div className="px-4 md:px-8 py-5 pb-8">

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <MiniGlobe size={48} label="Loading listings…" color={T.amber} />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && filtered.length === 0 && (
        <div style={{
          ...card,
          position:       "relative",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          padding:        "64px 24px",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: T.border }} aria-hidden />

          <div style={{
            width:          "44px",
            height:         "44px",
            borderRadius:   "50%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            background:     T.w4,
            marginBottom:   "12px",
          }}>
            <Plane size={20} style={{ color: T.w3 }} />
          </div>

          <p style={{ color: T.w2, fontSize: "13px", fontWeight: 600, margin: 0 }}>
            No aircraft match your criteria
          </p>
          <p style={{ color: T.w3, fontSize: "11px", marginTop: "4px", marginBottom: "20px" }}>
            Try adjusting filters or add a new listing
          </p>

          <button
            onClick={() =>
              requireFeature(
                "ati_passport_full",
                TOKEN_COSTS.ati_passport_full,
                () => setShowImport(true),
              )
            }
            style={{
              display:     "inline-flex",
              alignItems:  "center",
              gap:         "7px",
              background:  T.amber,
              color:       T.ink,
              fontWeight:  600,
              fontSize:    "12px",
              padding:     "9px 18px",
              borderRadius: "8px",
              border:      "none",
              cursor:      "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fdd05a"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = T.amber; }}
          >
            <Upload size={13} />
            Add First Aircraft
          </button>
        </div>
      )}

      {/* ── Grid / Swipe deck ── */}
      {!isLoading && filtered.length > 0 && viewMode === "grid" && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          <div className="w-full lg:flex-1 min-w-0">

            {shortlisted.length > 0 && (
              <div style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "8px",
                background:   T.tealDim,
                border:       `0.5px solid ${T.tealBdr}`,
                borderRadius: "10px",
                padding:      "10px 14px",
                marginBottom: "12px",
              }}>
                <ShieldCheck size={14} style={{ color: T.teal, flexShrink: 0 }} />
                <p style={{ color: T.teal, fontSize: "12px", fontWeight: 600, margin: 0 }}>
                  {shortlisted.length} shortlisted
                </p>
                <button
                  onClick={() => setShortlisted([])}
                  style={{
                    marginLeft:  "auto",
                    color:       T.teal,
                    opacity:     0.6,
                    background:  "none",
                    border:      "none",
                    cursor:      "pointer",
                    display:     "flex",
                    padding:     0,
                  }}
                  aria-label="Clear shortlist"
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {filtered.filter((l) => !discarded.includes(l.id)).length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: T.w3 }}>
                <p style={{ fontSize: "28px", marginBottom: "8px" }}>✈️</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: T.w2, margin: 0 }}>
                  You've reviewed all aircraft
                </p>
                {discarded.length > 0 && (
                  <button
                    onClick={() => setDiscarded([])}
                    style={{
                      marginTop:   "14px",
                      fontSize:    "11px",
                      color:       T.amber,
                      fontWeight:  600,
                      background:  "none",
                      border:      "none",
                      cursor:      "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                  >
                    ↺ Restore {discarded.length} skipped
                  </button>
                )}
              </div>
            ) : (
              <SwipeDeck
                listings={filtered.filter((l) => !discarded.includes(l.id))}
                onLike={(l) =>
                  setShortlisted((prev) =>
                    prev.includes(l.id) ? prev : [...prev, l.id],
                  )
                }
                onDiscard={(l) => setDiscarded((prev) => [...prev, l.id])}
              />
            )}
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:flex flex-col gap-3 w-72 shrink-0">

            <div style={{ ...cardElevated, padding: "20px" }}>
              <div style={{ height: "2px", background: T.amberBdr, margin: "-20px -20px 16px" }} aria-hidden />

              <Label color={T.amber} style={{ marginBottom: "16px" }}>Session Stats</Label>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                <div>
                  <p style={{ fontSize: "11px", color: T.w3, fontWeight: 500, marginBottom: "2px" }}>Remaining</p>
                  <p style={{ fontSize: "26px", fontWeight: 600, color: T.w1, margin: 0, letterSpacing: "-0.03em" }}>
                    {filtered.filter((l) => !discarded.includes(l.id)).length}
                  </p>
                </div>

                <div style={{ height: "0.5px", background: T.border }} />

                <div>
                  <p style={{ fontSize: "11px", color: T.w3, fontWeight: 500, marginBottom: "2px" }}>Shortlisted</p>
                  <p style={{ fontSize: "22px", fontWeight: 600, color: T.teal, margin: 0, letterSpacing: "-0.03em" }}>
                    {shortlisted.length}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "11px", color: T.w3, fontWeight: 500, marginBottom: "2px" }}>Skipped</p>
                  <p style={{ fontSize: "22px", fontWeight: 600, color: T.red, margin: 0, letterSpacing: "-0.03em" }}>
                    {discarded.length}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "11px", color: T.w3, fontWeight: 500, marginBottom: "2px" }}>Reviewed</p>
                  <p style={{ fontSize: "22px", fontWeight: 600, color: T.amber, margin: 0, letterSpacing: "-0.03em" }}>
                    {totalReviewed}
                    <span style={{ fontSize: "13px", color: T.w3, fontWeight: 500, letterSpacing: 0 }}>
                      {" "}/ {filtered.length}
                    </span>
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: `0.5px solid ${T.border}` }}>
                <div style={{
                  height:       "3px",
                  borderRadius: "99px",
                  overflow:     "hidden",
                  background:   T.w4,
                }}>
                  <div style={{
                    height:      "100%",
                    background:  T.amber,
                    borderRadius: "99px",
                    width:       `${progress}%`,
                    transition:  "width 0.4s ease",
                  }} />
                </div>
                <p style={{
                  fontSize:   "9px",
                  marginTop:  "6px",
                  textAlign:  "center",
                  color:      T.w3,
                  letterSpacing: "0.04em",
                }}>
                  {Math.round(progress)}% Complete
                </p>
              </div>

              {discarded.length > 0 && (
                <button
                  onClick={() => setDiscarded([])}
                  style={{
                    width:       "100%",
                    marginTop:   "12px",
                    paddingTop:  "10px",
                    borderTop:   `0.5px solid ${T.border}`,
                    fontSize:    "11px",
                    color:       T.amber,
                    fontWeight:  600,
                    background:  "none",
                    border:      "none",
                    cursor:      "pointer",
                    textAlign:   "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  ↺ Restore skipped
                </button>
              )}
            </div>

            {shortlisted.length > 0 && (
              <div style={{
                ...card,
                background: T.tealDim,
                border:     `0.5px solid ${T.tealBdr}`,
                padding:    "16px 18px",
              }}>
                <Label color={T.teal} style={{ marginBottom: "12px" }}>Your Shortlist</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0", maxHeight: "240px", overflowY: "auto" }}>
                  {filtered
                    .filter((l) => shortlisted.includes(l.id))
                    .slice(0, 5)
                    .map((l) => (
                      <div
                        key={l.id}
                        style={{
                          display:      "flex",
                          alignItems:   "center",
                          gap:          "10px",
                          padding:      "8px 0",
                          borderBottom: `0.5px solid ${T.tealBdr}`,
                        }}
                      >
                        <div style={{
                          flexShrink:   0,
                          width:        "26px",
                          height:       "26px",
                          borderRadius: "6px",
                          background:   T.tealDim,
                          border:       `0.5px solid ${T.tealBdr}`,
                          display:      "flex",
                          alignItems:   "center",
                          justifyContent: "center",
                        }}>
                          <span style={{ color: T.teal, fontSize: "11px", fontWeight: 700 }}>✓</span>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{
                            fontSize:   "11px",
                            fontWeight: 600,
                            color:      T.teal,
                            margin:     0,
                            overflow:   "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {l.year} {l.make} {l.model}
                          </p>
                          <p style={{
                            fontSize:   "10px",
                            color:      T.w3,
                            margin:     0,
                            fontFamily: "'Courier New', monospace",
                            letterSpacing: "0.04em",
                          }}>
                            {l.registration}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                {shortlisted.length > 5 && (
                  <p style={{
                    fontSize:  "9px",
                    color:     T.teal,
                    marginTop: "8px",
                    textAlign: "center",
                    fontWeight: 600,
                    opacity:   0.7,
                  }}>
                    +{shortlisted.length - 5} more
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── List view ── */}
      {!isLoading && filtered.length > 0 && viewMode === "list" && (
        <div>
          {selectedIds.length > 0 && (
            <BulkActionsBar
              selectedIds={selectedIds}
              allIds={filtered.map((l) => l.id)}
              onClear={clearSelection}
              onSelectAll={selectAll}
            />
          )}

          <div style={{ ...card, position: "relative" }}>
            <div
              style={{
                position:   "absolute",
                top:        0,
                left:       0,
                right:      0,
                height:     "2px",
                background: `linear-gradient(90deg, transparent 5%, ${T.amber} 50%, transparent 95%)`,
                opacity:    0.5,
                zIndex:     10,
              }}
              aria-hidden
            />

            <div style={{
              display:          "flex",
              alignItems:       "center",
              gap:              "20px",
              padding:          "10px 20px",
              borderBottom:     `0.5px solid ${T.border}`,
              background:       "rgba(255,255,255,0.03)",
            }}>
              <SelectAllCheckbox
                filtered={filtered}
                selectedIds={selectedIds}
                onSelectAll={selectAll}
                onClear={clearSelection}
              />
              <div className="w-11 shrink-0 hidden sm:block" />
              <div style={{
                flex:          1,
                fontSize:      "9px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight:    600,
                color:         T.w3,
              }}>
                Aircraft
              </div>
              <div
                style={{
                  flexShrink:    0,
                  width:         "96px",
                  textAlign:     "right",
                  fontSize:      "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight:    600,
                  color:         T.w3,
                }}
                className="hidden sm:block"
              >
                Price
              </div>
            </div>

            {filtered.map((l) => (
              <ListingRow
                key={l.id}
                listing={l}
                onClick={setSelected}
                selected={selectedIds.includes(l.id)}
                onToggle={toggleSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Unscored CTA strip ── */}
      {!isLoading && unscored > 0 && (
        <div style={{
          marginTop:    "12px",
          display:      "flex",
          alignItems:   "center",
          gap:          "12px",
          background:   T.ink1,
          border:       `0.5px solid ${T.amberBdr}`,
          borderRadius: "10px",
          padding:      "12px 16px",
        }}>
          <div style={{
            width:          "30px",
            height:         "30px",
            borderRadius:   "8px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            flexShrink:     0,
            background:     T.amberDim,
            border:         `0.5px solid ${T.amberBdr}`,
          }}>
            <Zap size={14} style={{ color: T.amber }} />
          </div>
          <p style={{ color: T.w2, fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700, color: T.amber }}>{unscored} aircraft</span>
            {" "}not yet scored — open any listing to issue an ATI Score Card.
          </p>
        </div>
      )}

      {/* ── Modals ── */}
      <ListingDrawer listing={selected} onClose={() => setSelected(null)} />

      <QuickPasteImport
        open={showImport}
        onClose={() => setShowImport(false)}
        onPublish={() => {
          queryClient.invalidateQueries({ queryKey: ["listings-public"] });
          setShowImport(false);
        }}
      />

      <AircraftWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onPublish={() => {
          queryClient.invalidateQueries({ queryKey: ["listings-public"] });
          setShowWizard(false);
        }}
      />

      <UpgradeGate
        open={!!gate}
        onClose={() => setGate(null)}
        feature={gate?.feature}
        requiredTokens={gate?.requiredTokens}
        userTokens={tokens}
        isVerified={isVerified}
      />

      {/* ── Mini FAQ modal ── */}
      {showFAQ && (
        <div
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         50,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        "16px",
            background:     "rgba(4,6,10,0.72)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFAQ(false); }}
        >
          <div style={{
            ...card,
            background:  T.ink1,
            border:      `0.5px solid ${T.borderMd}`,
            maxWidth:    "520px",
            width:       "100%",
            maxHeight:   "80vh",
            overflowY:   "auto",
            boxShadow:   "0 24px 64px rgba(0,0,0,0.6)",
          }}>
            <div style={{ height: "2px", background: T.amber }} aria-hidden />

            <div style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <HelpCircle size={16} style={{ color: T.amber }} />
                  <h3 style={{
                    fontSize:      "15px",
                    fontWeight:    600,
                    letterSpacing: "-0.03em",
                    color:         T.w1,
                    margin:        0,
                  }}>
                    Quick Guide
                  </h3>
                </div>
                <button
                  onClick={() => setShowFAQ(false)}
                  style={{
                    color:      T.w3,
                    background: "none",
                    border:     "none",
                    cursor:     "pointer",
                    display:    "flex",
                    padding:    "4px",
                  }}
                  aria-label="Close FAQ"
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.w1; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = T.w3; }}
                >
                  <X size={16} />
                </button>
              </div>

              {[
                {
                  q: "What is an ATI Score Card?",
                  a: "The ABOS Transaction Intelligence (ATI) Score Card is an 8-dimension evaluation of an aircraft's documentation, maintenance, avionics, usage history, and market readiness — scored 0–120.",
                },
                {
                  q: "What's the minimum info needed?",
                  a: "At minimum: make, model, and year. For a full score, provide registration (N-reg or EASA mark), total time, engine hours, TBO, avionics, and last annual date.",
                },
                {
                  q: "How do I create a card?",
                  a: 'Click the "Create ATI Score Card" button above and enter a registration. If the aircraft exists in FAA records, data auto-populates. Or use "Manual Add" to enter details yourself.',
                },
                {
                  q: "What is Expert Valuation?",
                  a: "Expert Valuation — our aviation specialist appraisal combining comparable market data, technical aircraft analysis, and current market conditions to produce a price band estimate.",
                },
                {
                  q: "Who can see my listing?",
                  a: "Public listings are visible to all logged-in users. Sensitive owner/operator details stay locked behind the confidential card back, accessible only with verified LOI.",
                },
              ].map(({ q, a }) => (
                <div key={q} style={{ marginBottom: "16px" }}>
                  <p style={{
                    fontWeight:    600,
                    fontSize:      "12px",
                    color:         T.amber,
                    margin:        "0 0 4px",
                    letterSpacing: "-0.01em",
                  }}>
                    {q}
                  </p>
                  <p style={{
                    color:      T.w2,
                    fontSize:   "12px",
                    lineHeight: 1.65,
                    margin:     0,
                  }}>
                    {a}
                  </p>
                </div>
              ))}

              <div style={{
                marginTop:  "20px",
                paddingTop: "14px",
                borderTop:  `0.5px solid ${T.border}`,
              }}>
                <Link
                  to="/max-chat"
                  style={{
                    fontSize:   "11px",
                    color:      T.amber,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                >
                  Need more help? Ask Max, our aviation assistant →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}