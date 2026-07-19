import React, { useEffect, useState } from 'react';
import { api, plata, invalidarProductos } from '../lib/api.js';
import Modal from './Modal.jsx';

const CAMPOS = p => [
  { id: 'marca', label: 'Marca', valor: p?.marca },
  { id: 'modelo', label: 'Modelo', valor: p?.modelo },
  { id: 'codigo', label: 'Código/SKU', valor: p?.codigo },
  { id: 'color', label: 'Color', valor: p?.color },
  { id: 'cristal', label: 'Cristal', valor: p?.cristal },
  { id: 'forma', label: 'Forma', tipo: 'select', valor: p?.forma || 'cuadrado', opciones: [['wayfarer', 'Wayfarer'], ['aviador', 'Aviador'], ['redondo', 'Redondo'], ['cuadrado', 'Cuadrado'], ['deportivo', 'Deportivo']] },
  { id: 'precio_web', label: 'Precio web ($, 0=consultar)', tipo: 'number', valor: p?.precio_web ?? 0 },
  { id: 'precio_ml', label: 'Precio MELI ($)', tipo: 'number', valor: p?.precio_ml ?? 0 },
  { id: 'costo_usd', label: 'Costo (USD)', tipo: 'number', valor: p?.costo_usd ?? 0 },
  { id: 'stock', label: 'Stock', tipo: 'number', valor: p?.stock ?? 0 },
  { id: 'canal', label: 'Canal', tipo: 'select', valor: p?.canal || 'WEB', opciones: [['ML+WEB', 'MELI + Web'], ['WEB', 'Solo web (LUX)']] },
  { id: 'estado', label: 'Estado', tipo: 'select', valor: p?.estado || 'a_pedido', opciones: [['disponible', 'Disponible'], ['a_pedido', 'A pedido'], ['proximamente', 'Próximamente'], ['pausado', 'Pausado (no se muestra)']] },
  { id: 'destacado', label: 'Destacado en home', tipo: 'select', valor: String(p?.destacado ?? false), opciones: [['true', 'Sí'], ['false', 'No']] },
  { id: 'descripcion', label: 'Descripción (1-2 frases)', valor: p?.descripcion, ancho: true }
];

export default function Productos() {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(null); // null | {titulo, campos, onGuardar}

  const cargar = () => api('admin/productos').then(setLista).catch(() => {});
  useEffect(() => { cargar(); }, []);

  function editar(p) {
    setModal({
      titulo: p ? `Editar — ${p.marca} ${p.modelo}` : 'Nuevo producto',
      campos: CAMPOS(p),
      onGuardar: async out => {
        out.destacado = out.destacado === 'true';
        if (p) await api('productos/' + p.id, 'PUT', out);
        else await api('productos', 'POST', out);
        invalidarProductos();
        cargar();
      }
    });
  }

  async function borrar(p) {
    if (!confirm(`¿Borrar ${p.marca} ${p.modelo}?`)) return;
    await api('productos/' + p.id, 'DELETE');
    invalidarProductos();
    cargar();
  }

  async function sync() {
    const r = await api('sync-csv', 'POST');
    alert(r.ok ? `Listo: ${r.nuevos} nuevos, ${r.actualizados} actualizados (${r.total} en total).` : 'Error: ' + r.error);
    invalidarProductos();
    cargar();
  }

  return (
    <section>
      <div className="vista-head">
        <h1>Productos</h1>
        <div className="acciones">
          <button className="btn-sec" onClick={sync}>Importar STOCK.csv</button>
          <a className="btn-sec" href="/api/export-shopify.csv" download style={{ textDecoration: 'none', display: 'inline-block' }}>Exportar a Shopify</a>
          <button className="btn-oro" onClick={() => editar(null)}>+ Producto</button>
        </div>
      </div>
      <p className="ayuda">El flujo: completás <code>07_CATALOGO/STOCK.csv</code> → "Importar" → ajustás precio acá. Precio 0 = "Consultar por WhatsApp" en la tienda.</p>
      <div className="tarjeta">
        <table>
          <thead>
            <tr><th>Producto</th><th>Precio web</th><th>Precio MELI</th><th>Costo USD</th><th>Stock</th><th>Canal</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id}>
                <td><b>{p.marca}</b> {p.modelo}<br /><span style={{ color: 'var(--hueso-35)', fontSize: '.76rem' }}>{p.codigo}</span></td>
                <td>{p.precio_web ? plata(p.precio_web) : <span className="pill pill-warn">consultar</span>}</td>
                <td>{p.precio_ml ? plata(p.precio_ml) : '—'}</td>
                <td>{p.costo_usd ? 'U$' + p.costo_usd : '—'}</td>
                <td>{p.stock}</td>
                <td>{p.canal}</td>
                <td><span className={'pill ' + (p.estado === 'disponible' ? 'pill-ok' : p.estado === 'proximamente' ? 'pill-warn' : 'pill-gris')}>{p.estado}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn-mini" onClick={() => editar(p)}>Editar</button>{' '}
                  <button className="btn-mini" onClick={() => borrar(p)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <Modal {...modal} onCerrar={() => setModal(null)} />}
    </section>
  );
}
