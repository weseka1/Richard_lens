import React, { useEffect, useRef, useState } from 'react';

/* Probador virtual con ajuste automático.
 *
 * La versión anterior te dejaba arrastrar las gafas a mano y eso espantaba:
 * nadie quiere pelearse con un slider antes de comprar. Ahora se detecta la
 * cara, se ubican los ojos y las gafas se apoyan solas — con la inclinación
 * y el tamaño que corresponden. El ajuste fino queda escondido por si alguien
 * lo quiere tocar.
 *
 * El modelo se carga sólo al abrir el probador (import dinámico), así no le
 * pesa a quien no lo usa. La foto nunca sale del dispositivo.
 */

const FALLBACK = '/img/tryon/rb2140-901.png';

export default function Probador({ abierto, onCerrar, fotoGafas, nombre, precio, onComprar }) {
  const [selfie, setSelfie] = useState(null);
  const [gafasSrc, setGafasSrc] = useState(fotoGafas);
  const [estado, setEstado] = useState('');          // '' | buscando | listo | sin-cara
  const [pos, setPos] = useState({ x: 50, y: 38 });  // % del lienzo
  const [escala, setEscala] = useState(0.55);
  const [rot, setRot] = useState(0);
  const [ajusteAbierto, setAjusteAbierto] = useState(false);

  const lienzoRef = useRef(null);
  const arrastre = useRef(null);

  useEffect(() => setGafasSrc(fotoGafas), [fotoGafas]);
  const alFallarGafas = () => { if (gafasSrc !== FALLBACK) setGafasSrc(FALLBACK); };

  if (!abierto) return null;

  function cargarSelfie(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setSelfie(r.result); setEstado('buscando'); };
    r.readAsDataURL(f);
  }

  /* Detecta la cara y apoya las gafas sobre la línea de los ojos */
  async function ajustarSolo(img) {
    try {
      const tf = await import('@tensorflow/tfjs-core');
      await import('@tensorflow/tfjs-backend-webgl');
      const fd = await import('@tensorflow-models/face-detection');
      await tf.setBackend('webgl').catch(() => {});
      await tf.ready();

      const detector = await fd.createDetector(fd.SupportedModels.MediaPipeFaceDetector, {
        runtime: 'tfjs', maxFaces: 1
      });
      const caras = await detector.estimateFaces(img, { flipHorizontal: false });
      if (!caras?.length) { setEstado('sin-cara'); return; }

      const kp = caras[0].keypoints || [];
      const ojoD = kp.find(k => k.name === 'rightEye') || kp[0];
      const ojoI = kp.find(k => k.name === 'leftEye') || kp[1];
      if (!ojoD || !ojoI) { setEstado('sin-cara'); return; }

      const W = img.naturalWidth || img.width;
      const H = img.naturalHeight || img.height;
      const cx = (ojoD.x + ojoI.x) / 2;
      const cy = (ojoD.y + ojoI.y) / 2;
      const distOjos = Math.hypot(ojoI.x - ojoD.x, ojoI.y - ojoD.y);
      const angulo = Math.atan2(ojoI.y - ojoD.y, ojoI.x - ojoD.x) * 180 / Math.PI;

      // unas gafas cubren aproximadamente 2,2 veces la distancia entre ojos
      setPos({ x: (cx / W) * 100, y: (cy / H) * 100 });
      setEscala(Math.max(0.2, Math.min(1.1, (distOjos * 2.2) / W)));
      setRot(Math.max(-25, Math.min(25, angulo)));
      setEstado('listo');
    } catch (e) {
      console.warn('probador: no pude detectar la cara —', e.message);
      setEstado('sin-cara');
    }
  }

  function alBajar(e) {
    e.preventDefault();
    arrastre.current = { rect: lienzoRef.current.getBoundingClientRect() };
    e.target.setPointerCapture?.(e.pointerId);
  }
  function alMover(e) {
    if (!arrastre.current) return;
    const { rect } = arrastre.current;
    setPos({
      x: Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100))
    });
  }
  const alSoltar = () => { arrastre.current = null; };

  async function descargar() {
    const canvas = document.createElement('canvas');
    const base = new Image();
    base.src = selfie;
    await new Promise(ok => { base.onload = ok; });
    canvas.width = base.naturalWidth;
    canvas.height = base.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(base, 0, 0);
    const gafas = new Image();
    gafas.crossOrigin = 'anonymous';
    gafas.src = gafasSrc;
    await new Promise(ok => { gafas.onload = ok; });
    const w = canvas.width * escala * 0.9;
    const h = w * (gafas.naturalHeight / gafas.naturalWidth);
    ctx.translate(canvas.width * pos.x / 100, canvas.height * pos.y / 100);
    ctx.rotate(rot * Math.PI / 180);
    ctx.drawImage(gafas, -w / 2, -h / 2, w, h);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.download = 'richardlens-probador.jpg';
    a.click();
  }

  const AVISO = {
    buscando: 'Buscando tu cara…',
    listo: 'Listo. Si querés, ajustalo abajo.',
    'sin-cara': 'No te encontré la cara — movelas vos con el dedo.'
  };

  return (
    <div className="probador-fondo" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="probador-caja">
        <div className="probador-head">
          <span>Probátelas — {nombre}</span>
          <button onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        {!selfie ? (
          <label className="probador-drop">
            <input type="file" accept="image/*" capture="user" onChange={cargarSelfie} hidden />
            <span className="probador-drop-titulo">Sacate una selfie de frente</span>
            <span className="probador-drop-sub">Las gafas se te acomodan solas. La foto no sale de tu teléfono.</span>
            <span className="btn-brush" style={{ marginTop: 16 }}>Abrir cámara</span>
          </label>
        ) : (
          <>
            <div
              className="probador-lienzo"
              ref={lienzoRef}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerLeave={alSoltar}
            >
              <img src={selfie} alt="Tu selfie" draggable={false} onLoad={e => ajustarSolo(e.currentTarget)} />
              <img
                src={gafasSrc}
                alt="Gafas"
                className="probador-gafas"
                draggable={false}
                onError={alFallarGafas}
                onPointerDown={alBajar}
                style={{
                  left: pos.x + '%', top: pos.y + '%',
                  width: (escala * 90) + '%',
                  transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                  opacity: estado === 'buscando' ? 0 : 1,
                  transition: 'opacity .3s ease, left .35s ease, top .35s ease, width .35s ease'
                }}
              />
              {estado === 'buscando' && <div className="probador-cargando">Acomodando…</div>}
            </div>

            {estado && <p className="probador-tip">{AVISO[estado]}</p>}

            <button className="probador-ajuste-toggle" onClick={() => setAjusteAbierto(v => !v)}>
              {ajusteAbierto ? 'Ocultar ajuste fino' : 'Ajustar a mano'}
            </button>
            {ajusteAbierto && (
              <div className="probador-controles">
                <label>Tamaño<input type="range" min="0.2" max="1.1" step="0.01" value={escala} onChange={e => setEscala(+e.target.value)} /></label>
                <label>Rotación<input type="range" min="-25" max="25" step="0.5" value={rot} onChange={e => setRot(+e.target.value)} /></label>
              </div>
            )}

            <div className="probador-acciones">
              <button className="btn-pill pill-claro" onClick={() => { setSelfie(null); setEstado(''); }}>Otra foto</button>
              <button className="btn-pill pill-claro" onClick={descargar}>Descargar</button>
              {onComprar && (
                <button className="btn-brush" onClick={() => { onComprar(); onCerrar(); }}>
                  Me quedan{precio ? ` — ${precio}` : ''} · Comprar
                </button>
              )}
            </div>
            <p className="probador-tip" style={{ fontSize: '.72rem' }}>🛡️ Y si al recibirlas no te convencen: 30 días de cambio, sin drama.</p>
          </>
        )}
      </div>
    </div>
  );
}
