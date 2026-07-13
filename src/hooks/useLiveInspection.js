import { useCallback, useEffect, useRef, useState } from 'react';
import { appParams } from '@/lib/app-params';

const FRAME_INTERVAL_MS = 1000;
const FRAME_MAX_WIDTH = 320;
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
      ws.onopen = () => {
        setStatus('live');
        timerRef.current = setInterval(() => {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (!canvas || !video?.videoWidth || ws.readyState !== WebSocket.OPEN) return;
          const width = Math.min(FRAME_MAX_WIDTH, video.videoWidth);
          const height = Math.max(1, Math.round(video.videoHeight * width / video.videoWidth));
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(video, 0, 0, width, height);
          const data = canvas.toDataURL('image/jpeg', .6).split(',')[1];
          ws.send(JSON.stringify({ realtimeInput: { mediaChunks: [{ mimeType: 'image/jpeg', data }] } }));
        }, FRAME_INTERVAL_MS);
      };
      ws.onmessage = e => { const msg = JSON.parse(e.data); if (msg?.error) { setStatus('error'); setErrorMessage(msg.error); return; } (msg?.serverContent?.modelTurn?.parts || []).forEach(p => p.text && onFinding(p.text)); };
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