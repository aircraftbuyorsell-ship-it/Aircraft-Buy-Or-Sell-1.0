import { useCallback, useEffect, useRef, useState } from 'react';
import { appParams } from '@/lib/app-params';

const wsUrl = () => {
  const base = (appParams.appBaseUrl || location.origin).replace(/\/$/, '').replace(/^https/, 'wss').replace(/^http(?!s)/, 'ws');
  return `${base}/api/apps/${appParams.appId}/functions/geminiLiveProxy${appParams.token ? `?token=${encodeURIComponent(appParams.token)}` : ''}`;
};
export default function useLiveInspection(onFinding) {
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null), socketRef = useRef(null), timerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    socketRef.current?.close(1000);
    streamRef.current?.getTracks().forEach(t => t.stop());
    socketRef.current = null; streamRef.current = null; setStatus('idle');
  }, []);
  useEffect(() => stop, [stop]);
  const start = useCallback(async () => {
    setStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play();
      const ws = new WebSocket(wsUrl()); socketRef.current = ws;
      ws.onopen = () => { setStatus('live'); timerRef.current = setInterval(() => { const c = canvasRef.current; c.width = 640; c.height = 480; c.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480); ws.send(JSON.stringify({ realtime_input: { media_chunks: [{ mime_type: 'image/jpeg', data: c.toDataURL('image/jpeg', .7).split(',')[1] }] } })); }, 2500); };
      ws.onmessage = e => { const msg = JSON.parse(e.data); (msg?.serverContent?.modelTurn?.parts || []).forEach(p => p.text && onFinding(p.text)); };
      ws.onerror = () => setStatus('error'); ws.onclose = () => setStatus(s => s === 'idle' ? s : 'error');
    } catch { setStatus('denied'); }
  }, [onFinding]);
  return { videoRef, canvasRef, status, start, stop };
}