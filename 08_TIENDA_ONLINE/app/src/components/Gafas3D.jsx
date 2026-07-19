import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* Gafas wireframe de oro flotando + lluvia de puntos. Si WebGL falla, se oculta solo. */
export default function Gafas3D() {
  const ref = useRef(null);

  useEffect(() => {
    const cont = ref.current;
    if (!cont) return;
    let renderer, frameId, vivo = true;
    try {
      const escena = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(38, cont.clientWidth / cont.clientHeight, 0.1, 100);
      cam.position.set(0, 0, 9);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(1);
      renderer.setSize(cont.clientWidth, cont.clientHeight);
      cont.appendChild(renderer.domElement);

      const oro = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0.5 });
      const gafas = new THREE.Group();
      const aroGeo = new THREE.TorusGeometry(1.35, 0.07, 10, 48);
      const aroIzq = new THREE.Mesh(aroGeo, oro); aroIzq.position.x = -1.75;
      const aroDer = new THREE.Mesh(aroGeo, oro); aroDer.position.x = 1.75;
      const puente = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), oro);
      puente.rotation.z = Math.PI / 2; puente.position.y = 0.35;
      const patillaGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8);
      const patIzq = new THREE.Mesh(patillaGeo, oro);
      patIzq.rotation.x = Math.PI / 2; patIzq.position.set(-3.1, 0.35, -1.3);
      const patDer = patIzq.clone(); patDer.position.x = 3.1;
      gafas.add(aroIzq, aroDer, puente, patIzq, patDer);
      escena.add(gafas);

      const n = 90, pos = new Float32Array(n * 3);
      for (let i = 0; i < n * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 22; pos[i + 1] = (Math.random() - 0.5) * 14; pos[i + 2] = -4 - Math.random() * 8;
      }
      const puntos = new THREE.BufferGeometry();
      puntos.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const nube = new THREE.Points(puntos, new THREE.PointsMaterial({ color: 0xD4AF37, size: 0.045, transparent: true, opacity: 0.55 }));
      escena.add(nube);

      let mx = 0, my = 0;
      const onMouse = e => { mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2; };
      addEventListener('mousemove', onMouse, { passive: true });
      renderer.domElement.addEventListener('webglcontextlost', () => { vivo = false; cont.style.display = 'none'; });

      const reloj = new THREE.Clock();
      const frame = () => {
        if (!vivo) return;
        const t = reloj.getElapsedTime();
        gafas.rotation.y = Math.sin(t * 0.35) * 0.45 + mx * 0.3;
        gafas.rotation.x = Math.sin(t * 0.22) * 0.12 + my * 0.15;
        gafas.position.y = Math.sin(t * 0.8) * 0.15;
        nube.rotation.y = t * 0.02;
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
        removeEventListener('mousemove', onMouse);
        removeEventListener('resize', onResize);
        renderer.dispose();
        cont.innerHTML = '';
      };
    } catch {
      if (cont) cont.style.display = 'none';
    }
  }, []);

  return <div ref={ref} style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5 }} aria-hidden="true" />;
}
