import { useMemo } from "react";
import * as THREE from "three";
import { fibonacciSphere, vec3ToLatLng, fbm } from "./globeUtils";

// Champagne-gold palette — varied per dot for a metallic, premium texture.
const GOLD = new THREE.Color("#D4A017");
const GOLD_BRIGHT = new THREE.Color("#F5C842");
const PLATINUM = new THREE.Color("#C9CDD2");

function hash01(i) {
  const s = Math.sin(i * 91.345 + 17.1) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Builds a single BufferGeometry of land dots distributed on a unit sphere.
 * Continents are simulated with fbm noise over lat/lng: dots only appear where
 * the noise exceeds a threshold (landmass), keeping oceans clean.
 *
 * @returns {THREE.BufferGeometry} with attributes: position, aColor, aSize, aLand
 */
export function useGlobeGeometry(count = 10000, radius = 1) {
  return useMemo(() => {
    const pts = fibonacciSphere(count);
    const pos = [];
    const col = [];
    const siz = [];
    const lnd = [];
    const tmp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const [x, y, z] = pts[i];
      const { lat, lng } = vec3ToLatLng(x, y, z);

      // Organic continent mask from layered noise, with a slight pole taper.
      const n = fbm(lng * 0.035 + 13.2, lat * 0.06 + 4.7, 4);
      const latBias = 1 - Math.pow(Math.abs(lat) / 90, 1.5) * 0.35;
      if (n * latBias <= 0.48) continue; // ocean → no dot

      const v = hash01(i);
      tmp.copy(GOLD).lerp(GOLD_BRIGHT, v * 0.6).lerp(PLATINUM, v * 0.25);
      pos.push(x, y, z);
      col.push(tmp.r, tmp.g, tmp.b);
      siz.push(0.9 + v * 0.7);
      lnd.push(1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(col), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(siz), 1));
    geo.setAttribute("aLand", new THREE.BufferAttribute(new Float32Array(lnd), 1));
    return geo;
  }, [count, radius]);
}