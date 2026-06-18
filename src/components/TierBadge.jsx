import{Lock,Zap,Building2,Globe}from"lucide-react";
const TIERS={free_explorer:{label:'Free',color:'#00c2cb',icon:Globe,bg:'rgba(0,194,203,0.12)'},starter:{label:'T1 Starter',color:'#22c55e',icon:Zap,bg:'rgba(34,197,94,0.12)'},pro:{label:'T2 Pro',color:'#D4A017',icon:Zap,bg:'rgba(212,160,23,0.12)'},enterprise:{label:'T3 Enterprise',color:'#f48120',icon:Building2,bg:'rgba(244,129,32,0.12)'},demo:{label:'DEMO',color:'#a855f7',icon:Zap,bg:'rgba(168,85,247,0.12)'},locked:{label:'Upgrade',color:'#ef4444',icon:Lock,bg:'rgba(239,68,68,0.10)'}};
export default function TierBadge({tier='free_explorer',locked=false,size='sm'}){
  const key=locked?'locked':tier;const meta=TIERS[key]||TIERS.free_explorer;const Icon=meta.icon;const isSmall=size==='sm';
  return(<span style={{display:'inline-flex',alignItems:'center',gap:isSmall?'3px':'5px',background:meta.bg,border:`1px solid ${meta.color}35`,borderRadius:isSmall?'5px':'8px',color:meta.color,fontSize:isSmall?'10px':'12px',fontWeight:700,padding:isSmall?'2px 7px':'4px 10px',letterSpacing:'0.06em',textTransform:'uppercase',whiteSpace:'nowrap'}}><Icon size={isSmall?9:11}/>{meta.label}</span>);
}
export function TierRow({tiers=[],label='Available for'}){
  return(<div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>{label&&<span style={{color:'rgba(255,255,255,0.4)',fontSize:'11px',marginRight:'2px'}}>{label}:</span>}{tiers.map(t=><TierBadge key={t} tier={t}/>)}</div>);
}