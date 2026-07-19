/* efectos3d.js — gafas wireframe de oro en el hero (Three.js CDN) + tilt de cards.
 * Si WebGL falla o no hay red, el hero queda type-driven y nada se rompe. */

export async function montarGafas3D(contenedorId) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  let THREE;
  try { THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js'); }
  catch { return; }
  try {
    const escena = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(38, cont.clientWidth / cont.clientHeight, 0.1, 100);
    cam.position.set(0, 0, 9);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(1); // GPUs modestas: dpr fijo
    renderer.setSize(cont.clientWidth, cont.clientHeight);
    cont.appendChild(renderer.domElement);

    const oro = new THREE.LineBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: .85 });
    const oroSolido = new THREE.MeshBasicMaterial({ color: 0xD4AF37, wireframe: true, transparent: true, opacity: .5 });
    const gafas = new THREE.Group();

    // dos aros (lentes) + puente + patillas = anteojo wireframe
    const aroGeo = new THREE.TorusGeometry(1.35, 0.07, 10, 48);
    const aroIzq = new THREE.Mesh(aroGeo, oroSolido); aroIzq.position.x = -1.75;
    const aroDer = new THREE.Mesh(aroGeo, oroSolido); aroDer.position.x = 1.75;
    const puente = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .8, 8), oroSolido);
    puente.rotation.z = Math.PI / 2; puente.position.y = .35;
    const patillaGeo = new THREE.CylinderGeometry(.05, .05, 2.6, 8);
    const patIzq = new THREE.Mesh(patillaGeo, oroSolido);
    patIzq.rotation.x = Math.PI / 2; patIzq.position.set(-3.1, .35, -1.3);
    const patDer = patIzq.clone(); patDer.position.x = 3.1;
    gafas.add(aroIzq, aroDer, puente, patIzq, patDer);
    escena.add(gafas);

    // lluvia sutil de $ — puntos dorados
    const puntos = new THREE.BufferGeometry();
    const n = 90, pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) {
      pos[i] = (Math.random() - .5) * 22; pos[i + 1] = (Math.random() - .5) * 14; pos[i + 2] = -4 - Math.random() * 8;
    }
    puntos.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const nube = new THREE.Points(puntos, new THREE.PointsMaterial({ color: 0xD4AF37, size: .045, transparent: true, opacity: .55 }));
    escena.add(nube);

    let mx = 0, my = 0;
    addEventListener('mousemove', e => {
      mx = (e.clientX / innerWidth - .5) * 2; my = (e.clientY / innerHeight - .5) * 2;
    }, { passive: true });

    let vivo = true;
    renderer.domElement.addEventListener('webglcontextlost', () => { vivo = false; cont.style.display = 'none'; });

    const reloj = new THREE.Clock();
    (function frame() {
      if (!vivo) return;
      const t = reloj.getElapsedTime();
      gafas.rotation.y = Math.sin(t * .35) * .45 + mx * .3;
      gafas.rotation.x = Math.sin(t * .22) * .12 + my * .15;
      gafas.position.y = Math.sin(t * .8) * .15;
      nube.rotation.y = t * .02;
      renderer.render(escena, cam);
      requestAnimationFrame(frame);
    })();

    addEventListener('resize', () => {
      cam.aspect = cont.clientWidth / cont.clientHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(cont.clientWidth, cont.clientHeight);
    });
  } catch { cont.style.display = 'none'; }
}

/* tilt 3D suave en las cards (sin librerías) */
export function activarTilt() {
  if (matchMedia('(pointer: coarse)').matches) return; // en mobile no
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
      card.style.transition = 'transform .1s';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = ''; card.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
    });
  });
}
