import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/* El lente girando (turntable estilo Apple): armazón negro brillante + detalles oro,
 * rotación lenta infinita. Carga lazy — no pesa en el primer paint. */
export default function Gafas360() {
  const ref = useRef(null);

  useEffect(() => {
    const cont = ref.current;
    if (!cont) return;
    let renderer, frameId, vivo = true;
    try {
      const escena = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(32, cont.clientWidth / cont.clientHeight, 0.1, 100);
      cam.position.set(0, 0.2, 9);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(cont.clientWidth, cont.clientHeight);
      cont.appendChild(renderer.domElement);

      const negro = new THREE.MeshPhysicalMaterial({ color: 0x0B0B0C, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.12 });
      const oro = new THREE.MeshStandardMaterial({ color: 0xC9C9CE, metalness: 0.95, roughness: 0.25 }); // plata pulida, no dorado

      const gafas = new THREE.Group();
      // slot para modelo real: soltar un gafas.glb en app/public/img/ y lo usa en vez de las primitivas
      new GLTFLoader().load('/img/gafas.glb', g => {
        gafas.clear();
        const m = g.scene;
        const caja = new THREE.Box3().setFromObject(m);
        const tam = caja.getSize(new THREE.Vector3());
        const esc = 4.8 / Math.max(tam.x, tam.y, tam.z);
        m.scale.setScalar(esc);
        const centro = caja.getCenter(new THREE.Vector3()).multiplyScalar(esc);
        m.position.sub(centro);
        gafas.add(m);
      }, undefined, () => {});
      const lenteGeo = new RoundedBoxGeometry(2.15, 1.5, 0.22, 5, 0.42);
      const izq = new THREE.Mesh(lenteGeo, negro); izq.position.x = -1.32;
      const der = new THREE.Mesh(lenteGeo, negro); der.position.x = 1.32;
      const puente = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.16, 0.16, 3, 0.07), oro);
      puente.position.y = 0.42;
      const bisagraI = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.14, 0.14, 2, 0.05), oro);
      bisagraI.position.set(-2.42, 0.45, 0);
      const bisagraD = bisagraI.clone(); bisagraD.position.x = 2.42;
      const patillaGeo = new THREE.CylinderGeometry(0.05, 0.04, 3.4, 12);
      const patI = new THREE.Mesh(patillaGeo, negro);
      patI.rotation.x = Math.PI / 2; patI.position.set(-2.42, 0.45, -1.7);
      const patD = patI.clone(); patD.position.x = 2.42;
      gafas.add(izq, der, puente, bisagraI, bisagraD, patI, patD);
      gafas.rotation.x = -0.08;
      escena.add(gafas);

      escena.add(new THREE.AmbientLight(0xffffff, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 4, 5); escena.add(key);
      const relleno = new THREE.DirectionalLight(0xFFFFFF, 0.6); relleno.position.set(-4, -1, 3); escena.add(relleno);
      const contra = new THREE.PointLight(0xF5F5F7, 1.3, 30); contra.position.set(0, 2, -5); escena.add(contra);

      const reloj = new THREE.Clock();
      const frame = () => {
        if (!vivo) return;
        const t = reloj.getElapsedTime();
        gafas.rotation.y = t * 0.45;                       // el giro: lento, constante, hipnótico
        gafas.rotation.x = -0.08 + Math.sin(t * 0.5) * 0.04;
        renderer.render(escena, cam);
        frameId = requestAnimationFrame(frame);
      };
      frame();

      const onResize = () => {
        cam.aspect = cont.clientWidth / cont.clientHeight;
        cam.updateProjectionMatrix();
        renderer.setSize(cont.clientWidth, cont.clientHeight);
      };
      addEventListener('resize', onResize);
      return () => {
        vivo = false;
        cancelAnimationFrame(frameId);
        removeEventListener('resize', onResize);
        renderer.dispose();
        cont.innerHTML = '';
      };
    } catch { if (cont) cont.style.display = 'none'; }
  }, []);

  return <div ref={ref} style={{ position: 'absolute', inset: 0 }} aria-hidden="true" />;
}
