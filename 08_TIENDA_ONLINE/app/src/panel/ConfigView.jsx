import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const CAMPOS = [
  ['whatsapp', 'WhatsApp (con 549, sin +)', 'text'],
  ['whatsapp_display', 'WhatsApp visible', 'text'],
  ['instagram', 'Instagram (sin @)', 'text'],
  ['cuotas', 'Cuotas', 'number'],
  ['descuento_transferencia', '% off transferencia', 'number'],
  ['meta_pares_dia', 'Meta pares/día', 'number'],
  ['meta_facturacion_dia', 'Meta facturación/día ($)', 'number']
];

export default function ConfigView() {
  const [cfg, setCfg] = useState(null);
  const [estado, setEstado] = useState('');

  useEffect(() => { api('config').then(setCfg).catch(() => {}); }, []);

  async function guardar() {
    const out = { ...cfg };
    CAMPOS.forEach(([id, , tipo]) => { if (tipo === 'number') out[id] = Number(out[id]) || 0; });
    await api('config', 'POST', out);
    setEstado('Guardado. La tienda ya usa los valores nuevos.');
    setTimeout(() => setEstado(''), 3000);
  }

  if (!cfg) return <h1>Config</h1>;

  return (
    <section>
      <h1>Config</h1>
      <div className="tarjeta form-config">
        {CAMPOS.map(([id, label, tipo]) => (
          <label key={id}>{label}
            <input type={tipo} value={cfg[id] ?? ''} onChange={e => setCfg(c => ({ ...c, [id]: e.target.value }))} />
          </label>
        ))}
        <button className="btn-oro" onClick={guardar}>Guardar</button>
        {estado && <p className="ayuda">{estado}</p>}
      </div>
    </section>
  );
}
