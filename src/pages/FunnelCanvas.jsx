import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Save, Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// ── Block palette definition (aviation-specific) ──────────────────────────
const BLOCK_PALETTE = [
  {
    category: "Traffic Sources",
    color: "#4e8ef7",
    blocks: [
      { type: "traffic_facebook", label: "Facebook Groups", icon: "📘" },
      { type: "traffic_linkedin", label: "LinkedIn Aviation", icon: "💼" },
      { type: "traffic_google", label: "Google Ads", icon: "🔍" },
      { type: "traffic_email", label: "Email Campaign", icon: "📧" },
      { type: "traffic_referral", label: "Direct Referral", icon: "🤝" },
    ]
  },
  {
    category: "Awareness",
    color: "#a855f7",
    blocks: [
      { type: "aware_listing", label: "Listing Preview", icon: "✈️" },
      { type: "aware_ati", label: "ATI Score Teaser", icon: "📊" },
      { type: "aware_omvm", label: "OMVM Preview", icon: "💰" },
    ]
  },
  {
    category: "Lead Capture",
    color: "#f5c242",
    blocks: [
      { type: "lead_inquiry", label: "Inquiry Form", icon: "📋" },
      { type: "lead_nreg", label: "N-Number Lookup", icon: "🔎" },
      { type: "lead_ati_free", label: "Free Quick ATI", icon: "⚡" },
    ]
  },
  {
    category: "Qualification",
    color: "#f97316",
    blocks: [
      { type: "qual_broker", label: "Broker Contact", icon: "👤" },
      { type: "qual_finance", label: "Finance Pre-Check", icon: "🏦" },
      { type: "qual_prebuy", label: "Pre-Buy Interest", icon: "🔬" },
    ]
  },
  {
    category: "Conversion",
    color: "#5dcaa5",
    blocks: [
      { type: "conv_ati_full", label: "Full ATI Report", icon: "📄" },
      { type: "conv_inspection", label: "Inspection Request", icon: "🔧" },
      { type: "conv_offer", label: "Offer Submission", icon: "📝" },
    ]
  },
  {
    category: "Closing",
    color: "#e24b4a",
    blocks: [
      { type: "close_escrow", label: "Escrow Initiation", icon: "🔐" },
      { type: "close_agreement", label: "Purchase Agreement", icon: "✍️" },
      { type: "close_transfer", label: "Title Transfer", icon: "🏆" },
    ]
  },
  {
    category: "Post-Sale",
    color: "#5dcaa5",
    blocks: [
      { type: "post_passport", label: "Passport Transfer", icon: "🛂" },
      { type: "post_onboard", label: "Owner Onboard", icon: "🎉" },
      { type: "post_referral", label: "Referral Request", icon: "⭐" },
    ]
  },
];

const categoryColor = (type) => {
  const cat = BLOCK_PALETTE.find(c => c.blocks.some(b => b.type === type));
  return cat?.color || "#f5c242";
};

const blockMeta = (type) => {
  for (const cat of BLOCK_PALETTE) {
    const b = cat.blocks.find(b => b.type === type);
    if (b) return b;
  }
  return { label: type, icon: "📦" };
};

// ── Main canvas component ──────────────────────────────────────────────────
export default function FunnelCanvas() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  const [blocks, setBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connecting, setConnecting] = useState(null); // source block id when drawing connection
  const [dragging, setDragging] = useState(null);     // { id, offsetX, offsetY }
  const [dirty, setDirty] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);

  const { data: funnel, isLoading } = useQuery({
    queryKey: ["funnel", id],
    queryFn: () => base44.entities.SalesFunnel.get(id)
  });

  useEffect(() => {
    if (funnel) {
      setBlocks(funnel.blocks || []);
      setConnections(funnel.connections || []);
    }
  }, [funnel]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesFunnel.update(id, data),
    onSuccess: () => { setDirty(false); qc.invalidateQueries(["funnel", id]); }
  });

  const save = () => saveMutation.mutate({ blocks, connections, status: funnel?.status });

  // Drag block from palette onto canvas
  const handlePaletteDragStart = (e, blockType, blockLabel, blockIcon) => {
    e.dataTransfer.setData("blockType", blockType);
    e.dataTransfer.setData("blockLabel", blockLabel);
    e.dataTransfer.setData("blockIcon", blockIcon);
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("blockType");
    const label = e.dataTransfer.getData("blockLabel");
    const icon = e.dataTransfer.getData("blockIcon");
    if (!type) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    const newBlock = { id: `b-${Date.now()}`, type, label, icon, color: categoryColor(type), x, y };
    setBlocks(prev => [...prev, newBlock]);
    setDirty(true);
  };

  // Block drag on canvas
  const startBlockDrag = (e, blockId) => {
    e.stopPropagation();
    if (connecting) return;
    const block = blocks.find(b => b.id === blockId);
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left - pan.x) / zoom;
    const my = (e.clientY - rect.top - pan.y) / zoom;
    setDragging({ id: blockId, offsetX: mx - block.x, offsetY: my - block.y });
    setSelected(blockId);
  };

  const handleMouseMove = useCallback((e) => {
    if (dragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left - pan.x) / zoom;
      const my = (e.clientY - rect.top - pan.y) / zoom;
      setBlocks(prev => prev.map(b => b.id === dragging.id ? { ...b, x: mx - dragging.offsetX, y: my - dragging.offsetY } : b));
    }
    if (isPanning && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  }, [dragging, isPanning, pan, zoom]);

  const handleMouseUp = useCallback(() => {
    if (dragging) { setDragging(null); setDirty(true); }
    if (isPanning) { setIsPanning(false); panStart.current = null; }
  }, [dragging, isPanning]);

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target === svgRef.current) {
      setSelected(null);
      setConnecting(null);
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Connection drawing: click source output dot → click target block
  const handleBlockClick = (e, blockId) => {
    e.stopPropagation();
    if (connecting) {
      if (connecting !== blockId) {
        const exists = connections.some(c => c.from_id === connecting && c.to_id === blockId);
        if (!exists) {
          setConnections(prev => [...prev, { id: `c-${Date.now()}`, from_id: connecting, to_id: blockId }]);
          setDirty(true);
        }
      }
      setConnecting(null);
    } else {
      setSelected(blockId);
    }
  };

  const startConnect = (e, blockId) => {
    e.stopPropagation();
    setConnecting(blockId);
    setSelected(null);
  };

  const deleteSelected = () => {
    if (!selected) return;
    setBlocks(prev => prev.filter(b => b.id !== selected));
    setConnections(prev => prev.filter(c => c.from_id !== selected && c.to_id !== selected));
    setSelected(null);
    setDirty(true);
  };

  const deleteConnection = (connId) => {
    setConnections(prev => prev.filter(c => c.id !== connId));
    setDirty(true);
  };

  // SVG connection path between block centers
  const getBlockCenter = (block) => ({ x: block.x + 90, y: block.y + 28 });

  const getSvgPath = (from, to) => {
    const fx = from.x, fy = from.y;
    const tx = to.x, ty = to.y;
    const cx = (fx + tx) / 2;
    return `M ${fx} ${fy} C ${cx} ${fy}, ${cx} ${ty}, ${tx} ${ty}`;
  };

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
      Loading canvas...
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#04060a", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif", overflow: "hidden" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 52, borderBottom: "0.5px solid rgba(245,194,66,0.1)", flexShrink: 0, background: "rgba(4,6,10,0.95)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/funnels")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, padding: "4px 8px", borderRadius: 6 }}>
            <ArrowLeft size={15} /> Funnels
          </button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>{funnel?.name || "Untitled Funnel"}</span>
          {dirty && <span style={{ fontSize: 10, color: "#f5c242", letterSpacing: "0.08em", textTransform: "uppercase" }}>unsaved</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {connecting && (
            <span style={{ fontSize: 11, color: "#f5c242", background: "rgba(245,194,66,0.1)", border: "0.5px solid rgba(245,194,66,0.25)", borderRadius: 6, padding: "4px 10px" }}>
              Click a block to connect →
            </span>
          )}
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex" }}><ZoomOut size={14} /></button>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex" }}><ZoomIn size={14} /></button>
          <button onClick={() => { setZoom(1); setPan({ x: 40, y: 40 }); }} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 8px", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex" }}><RotateCcw size={14} /></button>
          {selected && (
            <button onClick={deleteSelected} style={{ background: "rgba(226,75,74,0.12)", border: "0.5px solid rgba(226,75,74,0.3)", borderRadius: 6, padding: "6px 10px", color: "#e24b4a", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}><Trash2 size={13} /> Delete</button>
          )}
          <button
            onClick={save}
            disabled={!dirty || saveMutation.isPending}
            style={{ background: dirty ? "#f5c242" : "rgba(245,194,66,0.2)", color: dirty ? "#04060a" : "rgba(245,194,66,0.4)", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: dirty ? "pointer" : "default", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Save size={14} /> {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT SIDEBAR — Block Palette */}
        <div style={{ width: 220, flexShrink: 0, borderRight: "0.5px solid rgba(255,255,255,0.06)", overflowY: "auto", background: "#04060a" }}>
          <div style={{ padding: "12px 14px 6px", fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Block Library</div>
          <div style={{ padding: "0 10px 16px" }}>
            {BLOCK_PALETTE.map(cat => (
              <div key={cat.category} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: cat.color, padding: "8px 4px 5px", fontWeight: 600 }}>{cat.category}</div>
                {cat.blocks.map(b => (
                  <div
                    key={b.type}
                    draggable
                    onDragStart={(e) => handlePaletteDragStart(e, b.type, b.label, b.icon)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, marginBottom: 3, cursor: "grab", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)", userSelect: "none", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  >
                    <span style={{ fontSize: 14 }}>{b.icon}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{b.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CANVAS */}
        <div
          ref={canvasRef}
          style={{ flex: 1, position: "relative", overflow: "hidden", cursor: isPanning ? "grabbing" : connecting ? "crosshair" : "grab",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "24px 24px", backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <svg ref={svgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {connections.map(conn => {
                  const fromBlock = blocks.find(b => b.id === conn.from_id);
                  const toBlock = blocks.find(b => b.id === conn.to_id);
                  if (!fromBlock || !toBlock) return null;
                  const from = getBlockCenter(fromBlock);
                  const to = getBlockCenter(toBlock);
                  return (
                    <g key={conn.id}>
                      <path d={getSvgPath(from, to)} fill="none" stroke="rgba(245,194,66,0.4)" strokeWidth="1.5" strokeDasharray="5,3" />
                      <circle cx={(from.x + to.x) / 2} cy={(from.y + to.y) / 2} r="5" fill="rgba(226,75,74,0.6)" style={{ cursor: "pointer", pointerEvents: "all" }}
                        onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id); }}
                      />
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Blocks */}
          <div style={{ position: "absolute", inset: 0 }}>
            <div style={{ position: "absolute", transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
              {blocks.map(block => {
                const color = block.color || categoryColor(block.type);
                const isSelected = selected === block.id;
                const isConnSrc = connecting === block.id;
                return (
                  <div
                    key={block.id}
                    style={{ position: "absolute", left: block.x, top: block.y, width: 180, userSelect: "none",
                      background: isConnSrc ? "rgba(245,194,66,0.12)" : isSelected ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                      border: `0.5px solid ${isSelected || isConnSrc ? color : "rgba(255,255,255,0.1)"}`,
                      borderTop: `2px solid ${color}`,
                      borderRadius: 10, boxShadow: isSelected ? `0 0 16px ${color}30` : "0 2px 8px rgba(0,0,0,0.4)",
                      cursor: dragging?.id === block.id ? "grabbing" : "grab", zIndex: isSelected ? 10 : 1
                    }}
                    onMouseDown={(e) => startBlockDrag(e, block.id)}
                    onClick={(e) => handleBlockClick(e, block.id)}
                  >
                    <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{block.icon || blockMeta(block.type).icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>{block.label}</span>
                    </div>
                    {/* Connect output dot */}
                    <div
                      title="Connect to another block"
                      onMouseDown={e => { e.stopPropagation(); startConnect(e, block.id); }}
                      style={{ position: "absolute", right: -6, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: "50%", background: color, border: "2px solid #04060a", cursor: "crosshair", zIndex: 20 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empty state */}
          {blocks.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, margin: 0 }}>Drag blocks from the left panel to build your funnel</p>
                <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, marginTop: 6 }}>Click the dot on a block to connect it to another</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}