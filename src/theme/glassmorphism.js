// ABOS / IntraZone — Global Glass Morphism Design Tokens
export const COLORS = {
  navy:'#1B2A4A',gold:'#D4A017',orange:'#f48120',cyan:'#00c2cb',
  green:'#22c55e',purple:'#a855f7',red:'#ef4444',
  white10:'rgba(255,255,255,0.10)',white05:'rgba(255,255,255,0.05)',
  white15:'rgba(255,255,255,0.15)',white20:'rgba(255,255,255,0.20)',
};
export const TIER_META = {
  free_explorer:{label:'Free',color:'#00c2cb',bg:'rgba(0,194,203,0.15)'},
  starter:{label:'T1 Starter',color:'#22c55e',bg:'rgba(34,197,94,0.15)'},
  pro:{label:'T2 Pro',color:'#D4A017',bg:'rgba(212,160,23,0.15)'},
  enterprise:{label:'T3 Enterprise',color:'#f48120',bg:'rgba(244,129,32,0.15)'},
  demo:{label:'DEMO',color:'#a855f7',bg:'rgba(168,85,247,0.15)'},
};
export const glassBase=(opacity=0.07)=>({background:`rgba(255,255,255,${opacity})`,backdropFilter:'blur(22px)',WebkitBackdropFilter:'blur(22px)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'16px'});
export const glassCard=(opacity=0.07)=>({...glassBase(opacity),padding:'24px'});
export const glassStrong=()=>({background:'rgba(255,255,255,0.10)',backdropFilter:'blur(28px)',WebkitBackdropFilter:'blur(28px)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:'16px',padding:'24px'});
export const glassInput=()=>({background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'10px',color:'#fff',outline:'none',padding:'12px 16px',fontSize:'14px',width:'100%',boxSizing:'border-box',transition:'border-color 0.2s'});
export const btnPrimary=(color='#D4A017')=>({background:`linear-gradient(135deg,${color},${color}cc)`,border:'none',borderRadius:'10px',color:'#fff',cursor:'pointer',fontWeight:700,padding:'12px 28px',fontSize:'14px',transition:'opacity 0.2s,transform 0.15s',letterSpacing:'0.03em'});
export const btnGhost=(color='#fff')=>({background:'transparent',border:`1px solid ${color}30`,borderRadius:'10px',color,cursor:'pointer',fontWeight:600,padding:'10px 22px',fontSize:'13px',transition:'background 0.2s'});
export const h1=()=>({fontSize:'clamp(28px,4vw,42px)',fontWeight:800,color:'#fff',letterSpacing:'-0.02em',lineHeight:1.15,margin:0});
export const h2=()=>({fontSize:'clamp(18px,2.5vw,26px)',fontWeight:700,color:'#fff',letterSpacing:'-0.01em',margin:0});
export const textMuted=()=>({color:'rgba(255,255,255,0.55)',fontSize:'13px',lineHeight:1.6});
export const tierBadgeStyle=(tier)=>{const m=TIER_META[tier]||TIER_META.free_explorer;return{display:'inline-flex',alignItems:'center',gap:'4px',background:m.bg,border:`1px solid ${m.color}40`,borderRadius:'6px',color:m.color,fontSize:'11px',fontWeight:700,padding:'2px 8px',letterSpacing:'0.05em',textTransform:'uppercase'};};
export const pageBackground=()=>({minHeight:'100vh',background:'linear-gradient(135deg,#0a1628 0%,#1B2A4A 40%,#0d1f3c 100%)',color:'#fff'});
export default{COLORS,TIER_META,glassBase,glassCard,glassStrong,glassInput,btnPrimary,btnGhost,h1,h2,textMuted,tierBadgeStyle,pageBackground};