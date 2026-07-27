import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

/* Todo lo de la tienda, editable y agrupado. Se guarda en Supabase (secreto 'config')
 * así sobrevive a los deploys de Render. Los campos con punto (textos.garantia) son
 * anidados. */
const GRUPOS = [
  ['Marca', [
    ['negocio', 'Nombre del negocio', 'text'],
    ['tagline', 'Tagline / eslogan', 'text'],
  ]],
  ['Contacto', [
    ['whatsapp', 'WhatsApp (con 549, sin +)', 'text'],
    ['whatsapp_display', 'WhatsApp visible', 'text'],
    ['instagram', 'Instagram (sin @)', 'text'],
  ]],
  ['Comercial', [
    ['cuotas', 'Cuotas sin interés', 'number'],
    ['descuento_transferencia', '% descuento por transferencia', 'number'],
    ['envio_gratis_desde', 'Envío gratis desde ($ · 0 = siempre gratis)', 'number'],
  ]],
  ['Textos de confianza (home y ficha)', [
    ['textos.garantia', 'Garantía', 'textarea'],
    ['textos.envios', 'Envíos', 'textarea'],
    ['textos.cambios', 'Cambios', 'textarea'],
  ]],
  ['Metas internas (solo tablero)', [
    ['meta_pares_dia', 'Meta de pares por día', 'number'],
    ['meta_facturacion_dia', 'Meta de facturación por día ($)', 'number'],
  ]],
];

const leerPath = (obj, path) => path.split('.').reduce((o, k) => (o || {})[k], obj);
function setPath(obj, path, val) {
  const ks = path.split('.');
  const copia = { ...obj };
  let cur = copia;
  for (let i = 0; i < ks.length - 1; i++) { cur[ks[i]] = { ...(cur[ks[i]] || {}) }; cur = cur[ks[i]]; }
  cur[ks[ks.length - 1]] = val;
  return copia;
}

export default function ConfigView() {
  const [cfg, setCfg] = useState(null);
  const [estado, setEstado] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { api('config').then(setCfg).catch(() => {}); }, []);

  async function guardar() {
    setGuardando(true);
    let out = { ...cfg };
    for (const [, campos] of GRUPOS)
      for (const [id, , tipo] of campos)
        if (tipo === 'number') out = setPath(out, id, Number(leerPath(out, id)) || 0);
    try {
      await api('config', 'POST', out);
      setCfg(out);
      setEstado('Guardado ✓ La tienda ya usa los valores nuevos (y quedan en Supabase).');
    } catch (e) { setEstado('Error: ' + e.message); }
    setGuardando(false);
    setTimeout(() => setEstado(''), 4500);
  }

  if (!cfg) return <section><h1>Config</h1><p className="ayuda">Cargando…</p></section>;

  return (
    <section>
      <div className="vista-head">
        <h1>Config de la tienda</h1>
        <div className="acciones">
          <button className="btn-oro" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar todo'}</button>
        </div>
      </div>
      <p className="ayuda">Se aplica en la tienda al instante y queda guardado en Supabase — no se pierde en los deploys.</p>
      {estado && <p className="ayuda" style={{ color: estado.startsWith('Error') ? '#B4531F' : '#1D7A3E', fontWeight: 600 }}>{estado}</p>}
      {GRUPOS.map(([titulo, campos]) => (
        <div className="tarjeta" key={titulo} style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '.95rem', marginBottom: 14 }}>{titulo}</h2>
          <div className="form-config">
            {campos.map(([id, label, tipo]) => (
              <label key={id} style={tipo === 'textarea' ? { gridColumn: '1 / -1' } : undefined}>{label}
                {tipo === 'textarea'
                  ? <textarea rows={2} value={leerPath(cfg, id) ?? ''} onChange={e => setCfg(c => setPath(c, id, e.target.value))} />
                  : <input type={tipo} value={leerPath(cfg, id) ?? ''} onChange={e => setCfg(c => setPath(c, id, e.target.value))} />}
              </label>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
