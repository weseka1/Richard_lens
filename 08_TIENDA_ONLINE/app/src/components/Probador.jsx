import React, { useRef, useState } from 'react';

/* Probador virtual v1: subís tu selfie y te ponés el modelo encima.
 * Ajuste manual fino (arrastrar / tamaño / rotación) + descarga de la foto.
 * v2 (futuro): auto-fit con detección de cara. */

export default function Probador({ abierto, onCerrar, fotoGafas, nombre }) {
  const [selfie, setSelfie] = useState(null);
  const [pos, setPos] = useState({ x: 50, y: 38 });      // % del lienzo
  const [escala, setEscala] = useState(0.55);
  const [rot, setRot] = useState(0);
  const lienzoRef = useRef(null);
  const arrastre = useRef(null);

  if (!abierto) return null;

  function cargarSelfie(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setSelfie(r.result);
    r.readAsDataURL(f);
  }

  function alBajar(e) {
    e.preventDefault();
    const rect = lienzoRef.current.getBoundingClientRect();
    arrastre.current = { rect };
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
    const lienzo = lienzoRef.current;
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
    gafas.src = fotoGafas;
    await new Promise(ok => { gafas.onload = ok; });
    const w = canvas.width * escala * 0.9;
    const h = w * (gafas.naturalHeight / gafas.naturalWidth);
    ctx.translate(canvas.width * pos.x / 100, canvas.height * pos.y / 100);
    ctx.rotate(rot * Math.PI / 180);
    ctx.drawImage(gafas, -w / 2, -h / 2, w, h);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.download = `richardlens-probador.jpg`;
    a.click();
  }

  return (
    <div className="probador-fondo" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="probador-caja">
        <div className="probador-head">
          <span>Probátelas — {nombre}</span>
          <button onClick={onCerrar} aria-label="Cerrar">×</button>
        </div>

        {!selfie ? (
          <label className="probador-drop">
            <input type="file" accept="image/*" onChange={cargarSelfie} hidden />
            <span className="probador-drop-titulo">Subí una selfie de frente</span>
            <span className="probador-drop-sub">o sacate una ahora desde el celu. La foto no sale de tu dispositivo.</span>
            <span className="btn-brush" style={{ marginTop: 16 }}>Elegir foto</span>
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
              <img src={selfie} alt="Tu selfie" draggable={false} />
              <img
                src={fotoGafas}
                alt="Gafas"
                className="probador-gafas"
                draggable={false}
                onPointerDown={alBajar}
                style={{
                  left: pos.x + '%', top: pos.y + '%',
                  width: (escala * 90) + '%',
                  transform: `translate(-50%, -50%) rotate(${rot}deg)`
                }}
              />
            </div>
            <div className="probador-controles">
              <label>Tamaño<input type="range" min="0.2" max="1.1" step="0.01" value={escala} onChange={e => setEscala(+e.target.value)} /></label>
              <label>Rotación<input type="range" min="-25" max="25" step="0.5" value={rot} onChange={e => setRot(+e.target.value)} /></label>
            </div>
            <p className="probador-tip">Arrastrá las gafas hasta tus ojos y ajustá con los controles.</p>
            <div className="probador-acciones">
              <button className="btn-pill pill-claro" onClick={() => setSelfie(null)}>Otra foto</button>
              <button className="btn-brush" onClick={descargar}>Descargar mi foto</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
