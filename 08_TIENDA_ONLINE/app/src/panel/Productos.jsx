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

const sinTildes = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const ESTADOS_STOCK = ['STOCK', 'POCO STOCK', 'POR ENTRAR', 'CONSULTAR'];

/* Editor de variantes estilo Tiendanube: una fila por combinación color+talle.
 * Todo editable a mano — sin esto dependés de que el proveedor mande bien el xlsx. */
function EditorVariantes({ producto, onCerrar, onGuardado }) {
  const [filas, setFilas] = useState(() => (producto.variantes || []).map(v => ({ ...v })));
  const [guardando, setGuardando] = useState(false);

  const set = (i, campo, valor) => setFilas(f => f.map((x, j) => j === i ? { ...x, [campo]: valor } : x));
  const agregar = () => setFilas(f => [...f, {
    color: '', talle: '', stock: 'CONSULTAR',
    sku: `${producto.codigo || producto.id}-${f.length + 1}`, codigo: producto.codigo || ''
  }]);
  const quitar = i => setFilas(f => f.filter((_, j) => j !== i));

  async function guardar() {
    const limpias = filas.filter(v => (v.color || '').trim());
    const skus = limpias.map(v => v.sku);
    if (new Set(skus).size !== skus.length) return alert('Hay SKUs repetidos. Cada variante necesita el suyo.');
    setGuardando(true);
    try {
      await api('productos/' + producto.id, 'PUT', { ...producto, variantes: limpias });
      invalidarProductos();
      onGuardado();
      onCerrar();
    } catch (e) { alert('No se pudo guardar: ' + e.message); }
    finally { setGuardando(false); }
  }

  return (
    <div className="modal-fondo abierto" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="modal-caja" style={{ maxWidth: 860 }}>
        <h2>Variantes — {producto.marca} {producto.modelo}</h2>
        <p className="ayuda">Cada fila es un color + talle con su stock. Lo que ponés acá es lo que el cliente elige en la ficha. El color tiene que escribirse igual que el que le asignás a las fotos.</p>
        <div style={{ maxHeight: '52vh', overflowY: 'auto', margin: '12px 0' }}>
          <table>
            <thead>
              <tr><th style={{ minWidth: 170 }}>Color</th><th>Talle</th><th>SKU</th><th>Stock</th><th></th></tr>
            </thead>
            <tbody>
              {filas.map((v, i) => (
                <tr key={i}>
                  <td><input value={v.color || ''} placeholder="Negro/verde" onChange={e => set(i, 'color', e.target.value)} /></td>
                  <td><input value={v.talle || ''} placeholder="Standard (50-22)" onChange={e => set(i, 'talle', e.target.value)} /></td>
                  <td><input value={v.sku || ''} onChange={e => set(i, 'sku', e.target.value)} /></td>
                  <td>
                    <select value={v.stock || 'CONSULTAR'} onChange={e => set(i, 'stock', e.target.value)}>
                      {ESTADOS_STOCK.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><button className="btn-mini" onClick={() => quitar(i)}>×</button></td>
                </tr>
              ))}
              {!filas.length && <tr><td colSpan="5"><span className="ayuda">Sin variantes. Agregá la primera.</span></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="modal-botones" style={{ justifyContent: 'space-between' }}>
          <button className="btn-sec" onClick={agregar}>+ Agregar variante</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-sec" onClick={onCerrar}>Cancelar</button>
            <button className="btn-oro" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar variantes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Productos() {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(null); // null | {titulo, campos, onGuardar}
  const [busca, setBusca] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fCanal, setFCanal] = useState('');
  const [fFotos, setFFotos] = useState('');

  const cargar = () => api('admin/productos').then(setLista).catch(() => {});
  useEffect(() => { cargar(); }, []);

  const filtrada = lista.filter(p => {
    const txt = sinTildes(`${p.marca} ${p.modelo} ${p.codigo} ${p.id}`);
    return (!busca || sinTildes(busca).split(/\s+/).every(w => txt.includes(w))) &&
      (!fEstado || p.estado === fEstado) &&
      (!fCanal || p.canal === fCanal) &&
      (!fFotos || (fFotos === 'ok' ? !!p.fotos_ok : !p.fotos_ok));
  });

  /* paginado: 25 por página, vuelve a la 1 al cambiar filtros */
  const POR_PAGINA = 25;
  const [pag, setPag] = useState(0);
  useEffect(() => { setPag(0); }, [busca, fEstado, fCanal, fFotos]);
  const totalPags = Math.max(1, Math.ceil(filtrada.length / POR_PAGINA));
  const visibles = filtrada.slice(pag * POR_PAGINA, (pag + 1) * POR_PAGINA);

  /* ---- gestor de fotos (con asignación de color por foto → la ficha obedece) ---- */
  const [fotosDe, setFotosDe] = useState(null);   // producto en edición de fotos
  const [fotos, setFotos] = useState([]);
  const [mapaColores, setMapaColores] = useState({});
  const [variantesDe, setVariantesDe] = useState(null);
  async function abrirFotos(p) {
    setFotosDe(p);
    setFotos(await fetch('/api/fotos/' + p.foto_codigo).then(r => r.json()).catch(() => []));
    setMapaColores(await fetch('/api/fotos-mapa/' + p.foto_codigo).then(r => r.json()).catch(() => ({})));
  }
  async function asignarColor(src, color) {
    const archivo = src.split('/').pop();
    await fetch('/api/fotos-color/' + fotosDe.foto_codigo, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivo, color: color || null })
    });
    setMapaColores(m => { const n = { ...m }; if (color) n[archivo] = color; else delete n[archivo]; return n; });
  }
  async function subirFotos(e) {
    for (const f of e.target.files) {
      const base64 = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
      await fetch('/api/fotos-subir/' + fotosDe.foto_codigo, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, ext: f.name.split('.').pop() })
      });
    }
    abrirFotos(fotosDe);
  }
  async function borrarFoto(src) {
    await fetch('/api/fotos-borrar/' + fotosDe.foto_codigo, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivo: src.split('/').pop() })
    });
    abrirFotos(fotosDe);
  }
  async function hacerPortada(src) {
    await fetch('/api/fotos-portada/' + fotosDe.foto_codigo, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivo: src.split('/').pop() })
    });
    abrirFotos(fotosDe);
  }

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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
        <input
          style={{ maxWidth: 320 }}
          placeholder="Buscar por marca, modelo o código…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select style={{ maxWidth: 160 }} value={fEstado} onChange={e => setFEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="a_pedido">A pedido</option>
          <option value="proximamente">Próximamente</option>
          <option value="pausado">Pausado</option>
        </select>
        <select style={{ maxWidth: 160 }} value={fCanal} onChange={e => setFCanal(e.target.value)}>
          <option value="">Todos los canales</option>
          <option value="ML+WEB">MELI + Web</option>
          <option value="WEB">Solo web (LUX)</option>
        </select>
        <select style={{ maxWidth: 180 }} value={fFotos} onChange={e => setFFotos(e.target.value)}>
          <option value="">Fotos: todas</option>
          <option value="no">Sin revisar</option>
          <option value="ok">Ya revisadas</option>
        </select>
        <span className="ayuda" style={{ margin: 0 }}>{filtrada.length} de {lista.length}</span>
      </div>
      <div className="tarjeta">
        <table>
          <thead>
            <tr><th>Producto</th><th>Precio web</th><th>Precio MELI</th><th>Costo USD</th><th>Stock</th><th>Canal</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {visibles.map(p => (
              <tr key={p.id}>
                <td><b>{p.marca}</b> {p.modelo}<br /><span style={{ color: 'var(--hueso-35)', fontSize: '.76rem' }}>{p.codigo}</span></td>
                <td>{p.precio_web ? plata(p.precio_web) : <span className="pill pill-warn">consultar</span>}</td>
                <td>{p.precio_ml ? plata(p.precio_ml) : '—'}</td>
                <td>{p.costo_usd ? 'U$' + p.costo_usd : '—'}</td>
                <td>{p.stock}</td>
                <td>{p.canal}</td>
                <td><span className={'pill ' + (p.estado === 'disponible' ? 'pill-ok' : p.estado === 'proximamente' ? 'pill-warn' : 'pill-gris')}>{p.estado}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn-mini" onClick={() => abrirFotos(p)} title={p.fotos_ok ? 'Fotos revisadas' : 'Fotos sin revisar'}>
                    {p.fotos_ok ? '✓ Fotos' : 'Fotos'}
                  </button>{' '}
                  <button className="btn-mini" onClick={() => setVariantesDe(p)}>
                    Variantes{p.variantes?.length ? ` (${new Set(p.variantes.map(v => v.color)).size})` : ''}
                  </button>{' '}
                  <button className="btn-mini" onClick={() => editar(p)}>Editar</button>{' '}
                  <button className="btn-mini" onClick={() => borrar(p)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
        <button className="btn-mini" disabled={pag === 0} onClick={() => setPag(p => p - 1)} style={{ opacity: pag === 0 ? .4 : 1 }}>‹ Anterior</button>
        <span className="ayuda" style={{ margin: 0 }}>Página {pag + 1} de {totalPags}</span>
        <button className="btn-mini" disabled={pag >= totalPags - 1} onClick={() => setPag(p => p + 1)} style={{ opacity: pag >= totalPags - 1 ? .4 : 1 }}>Siguiente ›</button>
      </div>

      {modal && <Modal {...modal} onCerrar={() => setModal(null)} />}

      {variantesDe && (
        <EditorVariantes
          producto={variantesDe}
          onCerrar={() => setVariantesDe(null)}
          onGuardado={cargar}
        />
      )}

      {fotosDe && (
        <div className="modal-fondo abierto" onClick={e => e.target === e.currentTarget && setFotosDe(null)}>
          <div className="modal-caja">
            <h2>Fotos — {fotosDe.marca} {fotosDe.modelo}</h2>
            <p className="ayuda">Asignale el color a cada foto: cuando el cliente elige ese color en la ficha, ve ESA foto. La portada ★ es la que sale en el catálogo — elegí siempre una donde la gafa apunte a la izquierda.</p>
            {(() => {
              const coloresProducto = [...new Set((fotosDe.variantes || []).map(v => v.color))].filter(Boolean);
              const conFoto = new Set(Object.values(mapaColores).filter(Boolean));
              const faltan = coloresProducto.filter(c => !conFoto.has(c));
              if (!coloresProducto.length) return null;
              return (
                <p className={'ayuda'} style={{ margin: '10px 0 0', color: faltan.length ? '#B4531F' : '#1D7A3E' }}>
                  {coloresProducto.length - faltan.length} de {coloresProducto.length} colores con foto propia
                  {faltan.length > 0 && <> · sin foto: {faltan.join(' · ')}</>}
                </p>
              );
            })()}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, margin: '14px 0 18px' }}>
              {fotos.map(src => {
                const archivo = src.split('/').pop();
                const esPortada = /^00[_.]/.test(archivo);
                const coloresProducto = [...new Set((fotosDe.variantes || []).map(v => v.color))];
                return (
                  <div key={src} style={{ position: 'relative' }}>
                    <img src={src} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#fff', borderRadius: 10, border: esPortada ? '2px solid #1D1D1F' : mapaColores[archivo] ? '2px solid #1D7A3E' : '1px solid rgba(0,0,0,.08)' }} />
                    <button
                      className="btn-mini"
                      title={esPortada ? 'Es la portada' : 'Usar como portada'}
                      style={{ position: 'absolute', top: 4, left: 4, background: esPortada ? '#1D1D1F' : undefined, color: esPortada ? '#fff' : undefined }}
                      onClick={() => hacerPortada(src)}
                    >★</button>
                    <button className="btn-mini" style={{ position: 'absolute', top: 4, right: 4 }} onClick={() => borrarFoto(src)}>×</button>
                    <select
                      style={{ marginTop: 6, fontSize: '.72rem', padding: '5px 8px' }}
                      value={mapaColores[archivo] || ''}
                      onChange={e => asignarColor(src, e.target.value)}
                    >
                      <option value="">— sin color —</option>
                      {coloresProducto.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                );
              })}
              {!fotos.length && <p className="ayuda">Sin fotos todavía — subí las primeras.</p>}
            </div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '.82rem', marginBottom: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ width: 'auto', margin: 0 }}
                checked={!!fotosDe.fotos_ok}
                onChange={async e => {
                  const ok = e.target.checked;
                  await api('productos/' + fotosDe.id, 'PUT', { fotos_ok: ok });
                  invalidarProductos(); cargar();
                  setFotosDe(f => ({ ...f, fotos_ok: ok }));
                }}
              />
              Fotos revisadas — confirmo que todas son de <b>este</b> modelo
            </label>
            <div className="modal-botones" style={{ justifyContent: 'space-between' }}>
              <label className="btn-oro" style={{ cursor: 'pointer' }}>
                + Agregar fotos
                <input type="file" accept="image/*" multiple hidden onChange={subirFotos} />
              </label>
              <button className="btn-sec" onClick={() => setFotosDe(null)}>Listo</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
