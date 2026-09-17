import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { normalizeReg } from '@/lib/aircraftLookup';
import registryLocation from '@/components/homepage/registryLocation';

export default function useGlobeSearch() {
  const navigate = useNavigate();
  const [marker, setMarker] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const active = useRef(true), locked = useRef(false), timers = useRef([]);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; timers.current.forEach(clearTimeout); };
  }, []);
  const search = async (value) => {
    const registration = normalizeReg(value);
    if (!registration || locked.current) return;
    locked.current = true; setBusy(true); setMarker(null);
    setStatus(`Locating ${registration} in registry records…`);
    document.getElementById('dashboard-globe-hero')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    let data = null;
    let lookupTimer;
    try {
      const response = await Promise.race([
        base44.functions.invoke('globalAircraftLookup', { registration }),
        new Promise(resolve => { lookupTimer = setTimeout(() => resolve(null), 8000); timers.current.push(lookupTimer); })
      ]);
      data = response?.data;
    } catch {
      // Search must still reach the advisor if its optional map preview is unavailable.
    } finally { clearTimeout(lookupTimer); }
    if (!active.current) return;
    const location = registryLocation(data, registration);
    setMarker({ ...location, registration, id: Date.now() });
    setStatus(`${registration}: ${location.locationLabel}. Opening Aircraft Advisor…`);
    timers.current.push(setTimeout(() => {
      if (!active.current) return;
      navigate(`/finance-advisor?registration=${encodeURIComponent(registration)}`);
      locked.current = false; setBusy(false);
    }, 1200));
  };
  return { marker, busy, status, search };
}