import React, { useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';

export function HeroGlobe({ mode = 'hero' }) {
  const globeRef = useRef();

  // Testovací souřadnice pro zlaté křivky (letové trasy) jako na obrázku
  const arcsData = useMemo(() => [
    { startLat: 40.7128, startLng: -74.0060, endLat: 50.0755, endLng: 14.4378, color: '#e0a938' }, // NY to Prague
    { startLat: 51.5074, startLng: -0.1278, endLat: 25.2048, endLng: 55.2708, color: '#e0a938' }, // London to Dubai
    { startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093, color: '#e0a938' } // Tokyo to Sydney
  ], []);

  // Aktivní bod N721AB zobrazený na obrázku
  const labelPoints = useMemo(() => [
    { lat: 40.7128, lng: -74.0060, text: 'N721AB · Registry matched' }
  ], []);

  useEffect(() => {
    if (globeRef.current) {
      // Zapnutí pomalé rotace glóbu na pozadí
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.6;
      globeRef.current.controls().enableZoom = true;
      
      // Nastavení pozice kamery, aby glóbus seděl jako na obrázku
      globeRef.current.pointOfView({ lat: 20, lng: -40, altitude: 1.8 });
    }
  }, []);

  return (
    <div className="w-full h-full relative select-none" style={{ touchAction: 'none' }}>
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)" // Průhledné pozadí, aby vyniklo teplé off-white hrdiny
        
        // Vzhled samotné zeměkoule (Apple/Stripe styl)
        showAtmosphere={true}
        atmosphereColor="#cbd5e1"
        atmosphereAltitude={0.15}
        
        // Načtení čisté, světlé topografické textury pro luxusní šedobílý vzhled
        globeImageUrl="//://unpkg.com"
        bumpImageUrl="//://unpkg.com"

        // Zlaté animované křivky (Flight Routes)
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={2}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        
        // Nastavení pulzujícího bodu pod bublinou
        ringsData={labelPoints}
        ringColor={() => '#10b981'} // Zelená jako na screenshotu
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1000}

        // Vykreslení té přesné plovoucí HTML bubliny z obrázku
        htmlElementsData={labelPoints}
        htmlLat="lat"
        htmlLng="lng"
        htmlElement={(d) => {
          const el = document.createElement('div');
          el.innerHTML = `
            <div class="flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-xl text-[10px] font-bold text-slate-800 whitespace-nowrap transform -translate-x-1/2 -translate-y-full mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ${d.text}
            </div>
          `;
          return el;
        }}
      />
    </div>
  );
}
export default HeroGlobe;