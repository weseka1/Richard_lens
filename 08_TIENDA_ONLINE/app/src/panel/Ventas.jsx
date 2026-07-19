import React, { useEffect, useState } from 'react';
import { api, plata } from '../lib/api.js';
import Modal from './Modal.jsx';

const ESTADOS = [['nuevo', 'Nuevo'], ['senado', 'Señado'], ['pagado', 'Pagado'], ['enviado', 'Enviado'], ['entregado', 'Entregado'], ['caido', 'Caído']];

export default function Ventas() {
  const [pedidos, setPedidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [modal, setModal] = useState(false);

  const cargar = () => Promise.all([api('pedidos'), api('admin/productos')])
    .then(([pe, pr]) => { setPedidos(pe); setProductos(pr); }).catch(() => {});
  useEffect(() => { cargar(); }, []);

  return (
    <section>
      <div className="vista-head">
        <h1>Ventas</h1>
        <button className="btn-oro" onClick={() => setModal(true)}>+ Registrar venta</button>
      </div>
      <p className="ayuda">Cada venta cerrada por WhatsApp/IG/MELI se registra acá — esto alimenta la facturación del tablero.</p>
      <div className="tarjeta">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Producto</th><th>Cant.</th><th>Monto</th><th>Canal</th><th>Cliente</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p.id}>
                <td>{new Date(p.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</td>
                <td>{p.producto || '—'}</td>
                <td>{p.cantidad || 1}</td>
                <td><b>{plata(p.monto)}</b></td>
                <td>{p.canal || '—'}</td>
                <td>{p.cliente || '—'}</td>
                <td>
                  <select
                    value={p.estado}
                    style={{ width: 'auto' }}
                    onChange={async e => { await api('pedidos/' + p.id, 'PUT', { estado: e.target.value }); cargar(); }}
                  >
                    {ESTADOS.map(e => <option key={e[0]} value={e[0]}>{e[1]}</option>)}
                  </select>
                </td>
                <td>
                  <button className="btn-mini" onClick={async () => {
                    if (confirm('¿Borrar esta venta?')) { await api('pedidos/' + p.id, 'DELETE'); cargar(); }
                  }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal
          titulo="Registrar venta"
          campos={[
            { id: 'producto', label: 'Producto', tipo: 'select', opciones: productos.map(x => [`${x.marca} ${x.modelo}`, `${x.marca} ${x.modelo}`]), ancho: true },
            { id: 'cantidad', label: 'Cantidad', tipo: 'number', valor: 1 },
            { id: 'monto', label: 'Monto total ($)', tipo: 'number', valor: '' },
            { id: 'canal', label: 'Canal', tipo: 'select', valor: 'whatsapp', opciones: [['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['meli', 'MercadoLibre'], ['web', 'Web']] },
            { id: 'cliente', label: 'Cliente (nombre o tel)', valor: '' },
            { id: 'estado', label: 'Estado', tipo: 'select', valor: 'pagado', opciones: ESTADOS }
          ]}
          onGuardar={async out => { await api('pedidos', 'POST', out); cargar(); }}
          onCerrar={() => setModal(false)}
        />
      )}
    </section>
  );
}
