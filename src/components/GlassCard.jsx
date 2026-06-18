export default function GlassCard({children,style={},className='',onClick,glow,strong=false,header,footer,padding='24px'}){
  const opacity=strong?0.10:0.07;
  const glowStyle=glow?{boxShadow:`0 0 0 1px ${glow}25,0 8px 32px ${glow}10`}:{boxShadow:'0 4px 24px rgba(0,0,0,0.25)'};
  return(
    <div className={className} onClick={onClick} style={{background:`rgba(255,255,255,${opacity})`,backdropFilter:'blur(22px)',WebkitBackdropFilter:'blur(22px)',border:glow?`1px solid ${glow}30`:'1px solid rgba(255,255,255,0.11)',borderRadius:'16px',...glowStyle,cursor:onClick?'pointer':'default',transition:'transform 0.18s,box-shadow 0.18s',overflow:'hidden',...style}}
      onMouseEnter={onClick?e=>{e.currentTarget.style.transform='translateY(-2px)';}:undefined}
      onMouseLeave={onClick?e=>{e.currentTarget.style.transform='translateY(0)';}:undefined}>
      {header&&(<><div style={{padding:`${padding} ${padding} 0`}}>{header}</div><div style={{borderTop:'1px solid rgba(255,255,255,0.08)',margin:'16px 0 0'}}/></>)}
      <div style={{padding}}>{children}</div>
      {footer&&(<><div style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}/><div style={{padding:`0 ${padding} ${padding}`}}>{footer}</div></>)}
    </div>
  );
}