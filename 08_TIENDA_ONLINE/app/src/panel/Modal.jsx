import React, { useEffect, useState } from 'react';

/* Modal de formulario genérico: campos = [{id, label, tipo?, opciones?, valor?, ancho?}] */
export default function Modal({ titulo, campos, onGuardar, onCerrar }) {
  const [valores, setValores] = useState({});

  useEffect(() => {
    const v = {};
    campos.forEach(c => { v[c.id] = c.valor ?? (c.tipo === 'select' ? c.opciones[0][0] : ''); });
    setValores(v);
  }, [campos]);

  function guardar() {
    const out = {};
    campos.forEach(c => {
      let v = valores[c.id];
      if (c.tipo === 'number') v = Number(v) || 0;
      out[c.id] = v;
    });
    onGuardar(out);
    onCerrar();
  }

  return (
    <div className="modal-fondo abierto" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="modal-caja">
        <h2>{titulo}</h2>
        <div className="modal-campos">
          {campos.map(c => (
            <label key={c.id} className={c.ancho ? 'ancho' : ''}>{c.label}
              {c.tipo === 'select' ? (
                <select value={valores[c.id] ?? ''} onChange={e => setValores(v => ({ ...v, [c.id]: e.target.value }))}>
                  {c.opciones.map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}
                </select>
              ) : (
                <input
                  type={c.tipo || 'text'}
                  value={valores[c.id] ?? ''}
                  step={c.step}
                  onChange={e => setValores(v => ({ ...v, [c.id]: e.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
        <div className="modal-botones">
          <button className="btn-sec" onClick={onCerrar}>Cancelar</button>
          <button className="btn-oro" onClick={guardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
