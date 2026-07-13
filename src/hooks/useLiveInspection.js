import { useCallback, useEffect, useRef, useState } from 'react';
import { appParams } from '@/lib/app-params';
import { base44 } from '@/api/base44Client';

const FRAME_INTERVAL_MS = 1000;
const NVIDIA_FRAME_INTERVAL_MS = 3000;
const FRAME_MAX_WIDTH = 320;
const captureFrame = (canvas, video) => {
  if (!canvas || !video?.videoWidth) return null;
  const width = Math.min(FRAME_MAX_WIDTH, video.videoWidth);
  const height = Math.max(1, Math.round(video.videoHeight * width / video.videoWidth));
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', .6).split(',')[1];
};
const wsUrl = () => {
  const base = (appParams.appBaseUrl || location.origin).replace(/\/$/, '').replace(/^https/, 'wss').replace(/^http(?!s)/, 'ws');
  return `${base}/api/apps/${appParams.appId}/functions/geminiLiveProxy${appParams.token ? `?token=${encodeURIComponent(appParams.token)}` : ''}`;
};
export default function useLiveInspection(onFinding, provider = 'gemini') {
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
    if (provider === 'nvidia') {
      setStatus('live');
      let inFlight = false;
      timerRef.current = setInterval(async () => {
        if (inFlight) return;
        const data = captureFrame(canvasRef.current, videoRef.current);
        if (!data) return;
        inFlight = true;
        try {
          const response = await base44.functions.invoke('nvidiaFrameAnalysis', { frame: data });
          if (response.data?.finding) onFinding(response.data.finding);
        } catch (analysisError) {
          setStatus('error');
          setErrorMessage(analysisError?.response?.data?.error || 'NVIDIA analysis failed.');
          clearInterval(timerRef.current);
        } finally {
          inFlight = false;
        }
      }, NVIDIA_FRAME_INTERVAL_MS);
      return;
    }
    try {
      const ws = new WebSocket(wsUrl()); socketRef.current = ws;
      ws.onopen = () => {
        setStatus('live');
        timerRef.current = setInterval(() => {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (ws.readyState !== WebSocket.OPEN) return;
          const data = captureFrame(canvas, video);
          if (data) ws.send(JSON.stringify({ realtimeInput: { video: { mimeType: 'image/jpeg', data } } }));
        }, FRAME_INTERVAL_MS);
      };
      ws.onmessage = e => {
        const msg = JSON.parse(e.data);
        if (msg?.error) { setStatus('error'); setErrorMessage(msg.error); return; }
        (msg?.serverContent?.modelTurn?.parts || []).forEach(part => part.text && onFinding(part.text));
        const transcription = msg?.serverContent?.outputTranscription?.text;
        if (transcription) onFinding(transcription);
      };
      ws.onerror = () => { setStatus('error'); setErrorMessage('The camera opened, but live AI analysis could not connect.'); };
      ws.onclose = () => { if (socketRef.current !== ws) return; clearInterval(timerRef.current); stream.getTracks().forEach(track => track.stop()); socketRef.current = null; streamRef.current = null; setStatus('error'); setErrorMessage(message => message || 'The live AI analysis connection closed. Please try again.'); };
    } catch (connectionError) {
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStatus('error');
      setErrorMessage(connectionError.message || 'Live AI analysis could not connect.');
    }
  }, [onFinding, provider]);
  return { videoRef, canvasRef, status, errorMessage, start, stop };
}