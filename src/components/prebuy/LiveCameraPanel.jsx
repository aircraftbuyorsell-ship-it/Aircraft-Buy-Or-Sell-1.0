import { useCallback, useState } from 'react';
import { Camera, Square } from 'lucide-react';
import useLiveInspection from '@/hooks/useLiveInspection';
const ENGINES = [{ id: 'gemini', label: 'Gemini Live' }, { id: 'nvidia', label: 'NVIDIA NIM' }];
export default function LiveCameraPanel({ onFinding }) {
  const [engine, setEngine] = useState('gemini');
  const capture=useCallback(text=>onFinding({category:'maintenance',severity:/red flag|crack|corrosion|leak|damage/i.test(text)?'major':'observation',priority:'before_purchase',title:'AI camera observation',description:text,recommended_action:'Certified inspector verification required',source:'ai_camera'}),[onFinding]);
  const {videoRef,canvasRef,status,errorMessage,start,stop}=useLiveInspection(capture,engine);
  const busy = status === 'live' || status === 'connecting';
  return <div className="space-y-4">
    <div className="flex gap-2">{ENGINES.map(option=><button key={option.id} onClick={()=>setEngine(option.id)} disabled={busy} className={`rounded-full px-3 py-1 text-xs font-bold border transition-colors disabled:opacity-50 ${engine===option.id?'bg-primary text-primary-foreground border-primary':'bg-transparent text-foreground border-border'}`}>{option.label}</button>)}</div>
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black"><video ref={videoRef} muted playsInline className="h-full w-full object-cover"/><canvas ref={canvasRef} className="hidden"/><span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">{status==='live'?`LIVE AI ANALYSIS · ${engine==='nvidia'?'NVIDIA':'GEMINI'}`:status.replace('_',' ').toUpperCase()}</span></div>
    {errorMessage&&<div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground"><p>{errorMessage}</p>{status==='denied'&&<p className="mt-1 text-xs text-muted-foreground">Open the browser lock/settings icon, set Camera to Allow, reload the page, and start again.</p>}</div>}
    <div className="flex gap-3">{status!=='live'?<button onClick={start} disabled={status==='connecting'} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50"><Camera className="h-4 w-4"/>{status==='connecting'?'Connecting…':'Start camera'}</button>:<button onClick={stop} className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 font-bold text-destructive-foreground"><Square className="h-4 w-4"/>End session</button>}</div>
    <p className="text-xs text-muted-foreground">AI observations are automatically added as unverified findings and must be confirmed by a certified inspector.</p>
  </div>;
}