import { useCallback, useEffect, useRef, useState } from 'react';
import { appParams } from '@/lib/app-params';

const wsUrl = () => {
  const base = (appParams.appBaseUrl || location.origin).replace(/\/$/, '').replace(/^https/, 'wss').replace(/^http(?!s)/, 'ws');
  return `${base}/api/apps/${appParams.appId}/functions/geminiLiveProxy${appParams.token ? `?token=${encodeURIComponent(appParams.token)}` : ''}`;
};
export default function useLiveInspection(onFinding) {
  const videoRef = useRef(null), canvasRef = useRef(null), streamRef = useRef(null), socketRef = useRef(null), timerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    socketRef.current?.close(1000);
    streamRef.current?.getTracks().forEach(t => t.stop());
    socketRef.current = null; streamRef.current = null; setStatus('idle'); setErrorMessage('');
  }, []);
  useEffect(() => stop, [stop]);
  const start = useCallback(async () => {
    setStatus('connecting');
    setErrorMessage('');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported');
      setErrorMessage('Camera access requires a secure HTTPS page and a supported browser.');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    } catch (cameraError) {
      if (cameraError.name === 'OverconstrainedError') {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); } catch (fallbackError) { cameraError = fallbackError; }
      }
      if (!stream) {
        if (cameraError.name === 'NotAllowedError' || cameraError.name === 'SecurityError') {
          setStatus('denied');
          setErrorMessage('Camera access is blocked. Allow camera permission for this site in your browser settings, then try again.');
        } else if (cameraError.name === 'NotFoundError' || cameraError.name === 'DevicesNotFoundError') {
          setStatus('no_camera');
          setErrorMessage('No available camera was found on this device.');
        } else {
          setStatus('error');
          setErrorMessage(cameraError.message || 'The camera could not be started.');
        }
        return;
      }
    }

    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play().catch(() => {});
    try {
      const ws = new WebSocket(wsUrl()); socketRef.current = ws;
      ws.onopen = () => { setStatus('live'); timerRef.current = setInterval(() => { const c = canvasRef.current; if (!c || !videoRef.current || ws.readyState !== WebSocket.OPEN) return; c.width = 640; c.height = 480; c.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480); ws.send(JSON.stringify({ realtimeInput: { video: { mimeType: 'image/jpeg', data: c.toDataURL('image/jpeg', .7).split(',')[1] } } })); }, 2500); };
      ws.onmessage = e => { const msg = JSON.parse(e.data); (msg?.serverContent?.modelTurn?.parts || []).forEach(p => p.text && onFinding(p.text)); };
      ws.onerror = () => { setStatus('error'); setErrorMessage('The camera opened, but live AI analysis could not connect.'); };
      ws.onclose = () => { if (socketRef.current !== ws) return; clearInterval(timerRef.current); stream.getTracks().forEach(track => track.stop()); socketRef.current = null; streamRef.current = null; setStatus('error'); setErrorMessage(message => message || 'The live AI analysis connection closed. Please try again.'); };
    } catch (connectionError) {
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStatus('error');
      setErrorMessage(connectionError.message || 'Live AI analysis could not connect.');
    }
  }, [onFinding]);
  return { videoRef, canvasRef, status, errorMessage, start, stop };
}