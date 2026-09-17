import * as THREE from 'three';

export default function globeSearchMarker(globe, camera, canvas, label, point, radius, texture) {
  const phi = THREE.MathUtils.degToRad(90 - point.lat), theta = THREE.MathUtils.degToRad(point.lon + 180);
  const normal = new THREE.Vector3(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
  const start = globe.quaternion.clone(), target = new THREE.Quaternion().setFromUnitVectors(normal, new THREE.Vector3(0, 0, 1));
  const group = new THREE.Group();
  group.position.copy(normal).multiplyScalar(radius + 0.025);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.3, 8), new THREE.MeshBasicMaterial({ color: 0xf5c242 }));
  pin.rotation.x = Math.PI / 2; pin.position.z = 0.15;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.095, 48), new THREE.MeshBasicMaterial({ color: 0xf5c242, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color: 0xf5c242, transparent: true, depthWrite: false }));
  head.position.z = 0.3; head.scale.set(0.24, 0.24, 1);
  group.add(pin, ring, head); globe.add(group);
  const born = performance.now(), reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const world = new THREE.Vector3(), projected = new THREE.Vector3(), surfaceNormal = new THREE.Vector3(), toCamera = new THREE.Vector3();
  return {
    update(now) {
      const age = (now - born) / 1000;
      const turn = reduced ? 1 : Math.min(age / 0.38, 1);
      globe.quaternion.slerpQuaternions(start, target, 1 - Math.pow(1 - turn, 3));
      const rise = reduced ? 1 : Math.max(0.01, Math.min((age - 0.15) / 0.45, 1));
      pin.scale.y = rise; pin.position.z = 0.15 * rise; head.position.z = 0.3 * rise;
      const pulse = reduced ? 0.25 : (Math.max(age - 0.25, 0) % 0.8) / 0.8;
      ring.scale.setScalar(1 + pulse * 3); ring.material.opacity = 0.7 * (1 - pulse);
      globe.updateMatrixWorld(true); head.getWorldPosition(world);
      surfaceNormal.copy(normal).applyQuaternion(globe.quaternion);
      toCamera.copy(camera.position).sub(world).normalize();
      projected.copy(world).project(camera);
      const visible = surfaceNormal.dot(toCamera) > 0 && projected.z < 1;
      label.style.opacity = visible ? '1' : '0';
      const x = (projected.x + 1) * canvas.clientWidth / 2, y = (1 - projected.y) * canvas.clientHeight / 2;
      label.style.left = `${Math.max(110, Math.min(canvas.clientWidth - 110, x))}px`;
      label.style.top = `${Math.max(72, y - 14)}px`;
    },
    dispose() {
      globe.remove(group); group.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
      label.style.opacity = '0';
    }
  };
}