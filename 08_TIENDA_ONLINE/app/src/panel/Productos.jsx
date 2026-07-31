import React, { useEffect, useState, useRef } from 'react';
import { api, plata, invalidarProductos, claveAdmin } from '../lib/api.js';

// headers para escribir fotos: JSON + el token de sesión (si no, da 401 con auth activa)
const authJSON = () => ({ 'Content-Type': 'application/json', 'x-rl-admin': claveAdmin() });
import Modal from './Modal.jsx';

/* Grilla de fotos ordenable estilo MercadoLibre: arrastrás una foto (con mouse o
 * con el dedo) y las demás se corren. La PRIMERA es la portada. El orden es la
 * fuente de verdad y se guarda en Supabase apenas soltás. */
function GrillaFotos({ fotos, mapaColores, colores, onOrden, onPortada, onBorrar, onColor }) {
  const [orden, setOrden] = useState(fotos);
  const [drag, setDrag] = useState(null);
  const refs = useRef({});
  useEffect(() => { setOrden(fotos); }, [fotos.join('§')]);

  function onDown(e, src) { setDrag(src); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
  function onMove(e) {
    if (!drag) return;
    e.preventDefault();
    for (const src of orden) {
      if (src === drag) continue;
      const r = refs.current[src]?.getBoundingClientRect();
      if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        setOrden(o => {
          const from = o.indexOf(drag), to = o.indexOf(src);
          if (from < 0 || from === to) return o;
          const n = o.slice(); n.splice(from, 1); n.splice(to, 0, drag); return n;
        });
        break;
      }
    }
  }
  function onUp() {
    if (!drag) return;
    setDrag(null);
    if (orden.join('§') !== fotos.join('§')) onOrden(orden);
  }

  if (!orden.length) return <p className="ayuda">Sin fotos todavía — subí las primeras abajo.</p>;
  return (
    <div className="ml-grilla" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {orden.map((src, i) => {
        const archivo = src.split('/').pop().split('?')[0];
        const portada = i === 0;
        return (
          <div
            key={src}
            ref={el => (refs.current[src] = el)}
            className={'ml-foto' + (portada ? ' portada' : '') + (drag === src ? ' agarrada' : '')}
            onPointerDown={e => onDown(e, src)}
            title="Arrastrá para reordenar"
          >
            <span className="ml-pos">{portada ? '★ Portada' : i + 1}</span>
            <img src={src} alt="" draggable={false} />
            <div className="ml-acc" onPointerDown={e => e.stopPropagation()}>
              {!portada && <button className="btn-mini" title="Poner de portada" onClick={() => onPortada(src)}>★</button>}
              <button className="btn-mini" title="Quitar" onClick={() => onBorrar(src)}>×</button>
            </div>
            {colores.length > 0 && (
              <select className="ml-color" onPointerDown={e => e.stopPropagation()} value={mapaColores[archivo] || ''} onChange={e => onColor(src, e.target.value)}>
                <option value="">— color —</option>
                {colores.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        );
      })}
    </div>
  );
}

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

/* Paleta de colores para anteojos (con matices). Escribís "verde" y aparecen los verdes. */
const PALETA_COLORES = [
  'Negro', 'Blanco', 'Gris', 'Gris oscuro', 'Gris claro', 'Gris humo', 'Plateado', 'Dorado', 'Gunmetal', 'Bronce', 'Nude',
  'Marrón', 'Marrón oscuro', 'Marrón claro', 'Carey', 'Havana', 'Tortoise', 'Ámbar', 'Beige',
  'Rojo', 'Bordó', 'Vino', 'Rosa', 'Rosa claro', 'Rosa viejo', 'Fucsia', 'Coral',
  'Naranja', 'Naranja flúor', 'Amarillo', 'Mostaza', 'Ocre',
  'Verde', 'Verde oscuro', 'Verde claro', 'Verde militar', 'Verde agua', 'Verde botella', 'Oliva', 'Menta',
  'Azul', 'Azul oscuro', 'Azul marino', 'Azul claro', 'Celeste', 'Turquesa', 'Petróleo',
  'Violeta', 'Lila', 'Morado', 'Púrpura',
  'Transparente', 'Cristal', 'Ahumado', 'Degradado', 'Degradado marrón', 'Degradado gris',
  'Espejado', 'Espejado azul', 'Espejado plata', 'Espejado dorado', 'Espejado rosa',
  'Polarizado', 'Fotocromático', 'Prizm Sapphire', 'Prizm Ruby', 'Prizm Black', 'Prizm Rose Gold', 'G-15', 'B-15'
];
/* muestra de color para el puntito del menú (aproximado; default gris) */
const MUESTRA = {
  negro: '#111', blanco: '#fff', gris: '#8a8a8a', 'gris oscuro': '#555', 'gris claro': '#c8c8c8', 'gris humo': '#9a958f', plateado: '#cfd4d8', dorado: '#c9a227', gunmetal: '#4a4e54', bronce: '#8c6b3f', nude: '#e6c9b0',
  marrón: '#6b4423', 'marrón oscuro': '#4a2e18', 'marrón claro': '#a9763f', carey: '#7a4a1e', havana: '#6e4423', tortoise: '#6e4423', ámbar: '#c47a1a', beige: '#e3cfa8',
  rojo: '#c0392b', bordó: '#6d1a2a', vino: '#722f37', rosa: '#e58fb0', 'rosa claro': '#f3c6d6', 'rosa viejo': '#c98a92', fucsia: '#d81b8c', coral: '#f0765a',
  naranja: '#e8720c', 'naranja flúor': '#ff6a00', amarillo: '#e8c20c', mostaza: '#c69214', ocre: '#b07a2a',
  verde: '#2e8b57', 'verde oscuro': '#1f5133', 'verde claro': '#7ec98f', 'verde militar': '#4b5320', 'verde agua': '#8fd6c4', 'verde botella': '#13543a', oliva: '#6b6b23', menta: '#a9e6c9',
  azul: '#2860c4', 'azul oscuro': '#16336b', 'azul marino': '#1b264f', 'azul claro': '#7fb0e6', celeste: '#68b8e0', turquesa: '#22b3b0', petróleo: '#1f5560',
  violeta: '#7b3fbf', lila: '#b79ad6', morado: '#5e2b8a', púrpura: '#6a1b7a',
  transparente: 'linear-gradient(135deg,#eee,#cfcfcf)', cristal: 'linear-gradient(135deg,#eef4f7,#cdd9de)', ahumado: '#5a5550',
  degradado: 'linear-gradient(#8a6b4a,#efe6da)', espejado: 'linear-gradient(135deg,#bfe3f0,#e7cfe0)', polarizado: '#3a3f45', fotocromático: 'linear-gradient(135deg,#cfd6da,#7a7f86)',
  'prizm sapphire': 'linear-gradient(135deg,#1f6bd6,#0a3f8a)', 'prizm ruby': 'linear-gradient(135deg,#e0561f,#b01030)', 'prizm black': '#2b2b2b', 'prizm rose gold': 'linear-gradient(135deg,#e6b98f,#c98a92)'
};
const muestraDe = c => MUESTRA[sinTildes(c)] || '#b9b3aa';

/* Selector de color: input con datalist nativo — menú de todos los colores y, cuando
 * escribís (ej. "verde"), el navegador filtra los que matchean. No se corta con el scroll. */
function ColorCombo({ value, onChange, placeholder }) {
  return (
    <input
      list="paleta-colores" value={value || ''} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  );
}

/* Editor de variantes estilo MercadoLibre: color de marco / lente / varilla, con menú
 * de colores + typeahead. La 1ª parte con dato arma el "color" que ve el cliente. */
function EditorVariantes({ producto, onCerrar, onGuardado }) {
  // migración suave: una variante vieja (solo `color`) pasa ese color a "marco"
  const [filas, setFilas] = useState(() => (producto.variantes || []).map(v => ({
    ...v,
    color_marco: v.color_marco || (!v.color_lente && !v.color_varilla ? (v.color || '') : ''),
    color_lente: v.color_lente || '',
    color_varilla: v.color_varilla || ''
  })));
  const [guardando, setGuardando] = useState(false);

  const set = (i, campo, valor) => setFilas(f => f.map((x, j) => j === i ? { ...x, [campo]: valor } : x));
  const agregar = () => setFilas(f => [...f, {
    color_marco: '', color_lente: '', color_varilla: '', talle: '', stock: 'CONSULTAR',
    sku: `${producto.codigo || producto.id}-${f.length + 1}`, codigo: producto.codigo || ''
  }]);
  const quitar = i => setFilas(f => f.filter((_, j) => j !== i));
  // el "color" que ve el cliente se arma con las partes (marco lidera; suma lente/varilla)
  const componer = v => {
    const p = [];
    if ((v.color_marco || '').trim()) p.push(v.color_marco.trim());
    if ((v.color_lente || '').trim()) p.push('lente ' + v.color_lente.trim());
    if ((v.color_varilla || '').trim()) p.push('varilla ' + v.color_varilla.trim());
    return p.join(' · ') || (v.color || '').trim();
  };

  async function guardar() {
    const conColor = filas.map(v => ({ ...v, color: componer(v) })).filter(v => v.color);
    const sinColor = filas.length - conColor.length;
    if (!conColor.length) return alert('Agregá al menos un color. El color es lo que el cliente elige en la ficha.');
    const skus = conColor.map(v => (v.sku || '').trim()).filter(Boolean);
    if (new Set(skus).size !== skus.length) return alert('Hay SKUs repetidos. Cada variante necesita el suyo (o dejalo vacío y se genera solo).');
    setGuardando(true);
    try {
      // endpoint dedicado: REEMPLAZA el set completo (agregar y quitar funcionan)
      const r = await api('productos/' + producto.id + '/variantes', 'PUT', { variantes: conColor });
      invalidarProductos();
      onGuardado();
      onCerrar();
      alert(`✓ Guardado: ${r.n} ${r.n === 1 ? 'variante' : 'variantes'}${sinColor ? ` (${sinColor} sin color no se guardaron)` : ''}`);
    } catch (e) { alert('No se pudo guardar: ' + e.message); }
    finally { setGuardando(false); }
  }

  return (
    <div className="modal-fondo abierto" onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div className="modal-caja" style={{ maxWidth: 860 }}>
        <datalist id="paleta-colores">{PALETA_COLORES.map(c => <option key={c} value={c} />)}</datalist>
        <h2>Variantes — {producto.marca} {producto.modelo}</h2>
        <p className="ayuda">Cada fila es una variante. Elegí el color de cada parte: escribí (ej. "verde") y te salen los matices para elegir, o tocá el menú. El <b>marco</b> es el color principal que ve el cliente. Talle y stock a la derecha.</p>
        <div style={{ maxHeight: '52vh', overflowY: 'auto', margin: '12px 0' }}>
          <table className="tabla-variantes">
            <thead>
              <tr>
                <th style={{ minWidth: 130 }}>Color marco</th>
                <th style={{ minWidth: 130 }}>Color lente</th>
                <th style={{ minWidth: 130 }}>Color varilla</th>
                <th style={{ minWidth: 90 }}>Talle</th>
                <th style={{ minWidth: 110 }}>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((v, i) => (
                <tr key={i}>
                  <td><ColorCombo value={v.color_marco} placeholder="Negro…" onChange={val => set(i, 'color_marco', val)} /></td>
                  <td><ColorCombo value={v.color_lente} placeholder="Verde…" onChange={val => set(i, 'color_lente', val)} /></td>
                  <td><ColorCombo value={v.color_varilla} placeholder="opcional" onChange={val => set(i, 'color_varilla', val)} /></td>
                  <td><input value={v.talle || ''} placeholder="Standard" onChange={e => set(i, 'talle', e.target.value)} /></td>
                  <td>
                    <select value={v.stock || 'CONSULTAR'} onChange={e => set(i, 'stock', e.target.value)}>
                      {ESTADOS_STOCK.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><button className="btn-mini" onClick={() => quitar(i)}>×</button></td>
                </tr>
              ))}
              {!filas.length && <tr><td colSpan="6"><span className="ayuda">Sin variantes. Agregá la primera.</span></td></tr>}
            </tbody>
          </table>
        </div>
        {filas.some(v => componer(v)) && (
          <div style={{ margin: '4px 0 12px' }}>
            <span className="ayuda">Así lo verá el cliente: </span>
            {filas.map((v, i) => { const c = componer(v); return c ? <span key={i} className="var-chip"><span className="color-punto" style={{ background: muestraDe(v.color_marco || v.color_lente || v.color_varilla) }} />{c}</span> : null; })}
          </div>
        )}
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

  /* ---- gestor de fotos MercadoLibre: subir, quitar y ARRASTRAR para reordenar.
   *      La lista `fotos` (array de URLs, la 1ª = portada) es la fuente de verdad,
   *      vive en Supabase y se guarda en cada cambio. ---- */
  const [fotosDe, setFotosDe] = useState(null);   // producto en edición de fotos
  const [fotos, setFotos] = useState([]);
  const [mapaColores, setMapaColores] = useState({});
  const [subiendo, setSubiendo] = useState(false);
  const [variantesDe, setVariantesDe] = useState(null);
  const [link, setLink] = useState('');
  const [mlLista, setMlLista] = useState(null);   // candidatos de ML para "Actualizar en ML"
  const [mlSel, setMlSel] = useState(new Set());
  const [mlMsg, setMlMsg] = useState('');

  async function abrirFotos(p) {
    setFotosDe(p);
    setMlLista(null); setMlMsg(''); setMlSel(new Set());
    // identidad = id del producto (no foto_codigo, que varios modelos comparten)
    setFotos(await fetch('/api/fotos/' + p.id).then(r => r.json()).catch(() => []));
    setMapaColores(await fetch('/api/fotos-mapa/' + p.id).then(r => r.json()).catch(() => ({})));
  }
  // guarda la lista (orden / altas / bajas) en Supabase + espejo. Optimista en pantalla.
  async function guardarLista(nueva) {
    setFotos(nueva);
    try {
      const r = await fetch('/api/fotos-set/' + fotosDe.id, {
        method: 'POST', headers: authJSON(),
        body: JSON.stringify({ fotos: nueva })
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'error');
      invalidarProductos();
    } catch (e) { alert('No se pudo guardar: ' + e.message); abrirFotos(fotosDe); }
  }
  async function asignarColor(src, color) {
    const archivo = src.split('/').pop().split('?')[0];
    await fetch('/api/fotos-color/' + fotosDe.id, {
      method: 'POST', headers: authJSON(),
      body: JSON.stringify({ archivo, color: color || null })
    });
    setMapaColores(m => { const n = { ...m }; if (color) n[archivo] = color; else delete n[archivo]; return n; });
  }
  async function subirFotos(e) {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setSubiendo(true);
    const nuevas = [];
    for (const f of files) {
      const base64 = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
      try {
        const r = await fetch('/api/fotos-subir/' + fotosDe.id, {
          method: 'POST', headers: authJSON(),
          body: JSON.stringify({ base64, ext: (f.name.split('.').pop() || 'jpg') })
        });
        const j = await r.json();
        if (j.url) nuevas.push(j.url); else alert('No subió una foto: ' + (j.error || ''));
      } catch (err) { alert('Error al subir: ' + err.message); }
    }
    setSubiendo(false);
    if (nuevas.length) await guardarLista([...fotos, ...nuevas]);
  }
  // importar fotos pegando el LINK de una página de producto (MELI, tienda, etc.) o de una imagen
  async function importarDeLink(url) {
    const u = (url || '').trim();
    if (!/^https?:\/\//i.test(u)) { alert('Pegá un link que empiece con http'); return; }
    setSubiendo(true);
    try {
      const r = await fetch('/api/fotos-importar/' + fotosDe.id, {
        method: 'POST', headers: authJSON(), body: JSON.stringify({ url: u })
      });
      const j = await r.json();
      if (!r.ok) { alert('No se pudo importar: ' + (j.error || r.status)); return; }
      if (j.urls?.length) { setLink(''); await guardarLista([...fotos, ...j.urls]); }
      else alert('No encontré imágenes en ese link.');
    } catch (e) { alert('Error al importar: ' + e.message); }
    finally { setSubiendo(false); }
  }
  // Ctrl+V de una imagen copiada → la sube directo (si pegás texto, no interfiere)
  async function pegarImagen(e) {
    const imgs = [...(e.clipboardData?.items || [])].filter(it => it.type.startsWith('image/'));
    if (!imgs.length) return;
    e.preventDefault();
    setSubiendo(true);
    const nuevas = [];
    for (const it of imgs) {
      const f = it.getAsFile(); if (!f) continue;
      const base64 = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f); });
      try {
        const r = await fetch('/api/fotos-subir/' + fotosDe.id, {
          method: 'POST', headers: authJSON(), body: JSON.stringify({ base64, ext: (f.type.split('/')[1] || 'png') })
        });
        const j = await r.json(); if (j.url) nuevas.push(j.url);
      } catch {}
    }
    setSubiendo(false);
    if (nuevas.length) await guardarLista([...fotos, ...nuevas]);
  }
  const borrarFoto = src => guardarLista(fotos.filter(x => x !== src));
  const hacerPortada = src => guardarLista([src, ...fotos.filter(x => x !== src)]);

  // --- Actualizar en ML: buscar publicaciones del modelo y empujar estas fotos a las elegidas ---
  async function buscarML() {
    setMlMsg('Buscando en MercadoLibre…'); setMlLista(null); setMlSel(new Set());
    try {
      const r = await fetch('/api/sync-ml/buscar/' + fotosDe.id, { method: 'POST', headers: authJSON() });
      const j = await r.json();
      if (!r.ok) { setMlMsg('Error: ' + (j.error || r.status)); return; }
      setMlLista(j.candidatos || []);
      setMlMsg((j.candidatos || []).length ? 'Elegí las publicaciones que son de ESTE color y actualizo sus fotos:' : 'No encontré publicaciones de este modelo en ML.');
    } catch (e) { setMlMsg('Error: ' + e.message); }
  }
  async function pushML() {
    const itemIds = [...mlSel];
    if (!itemIds.length) return;
    setMlMsg('Actualizando fotos en ML…');
    try {
      const r = await fetch('/api/sync-ml/push/' + fotosDe.id, { method: 'POST', headers: authJSON(), body: JSON.stringify({ itemIds }) });
      const j = await r.json();
      if (!r.ok) { setMlMsg('Error: ' + (j.error || r.status)); return; }
      const ok = (j.resultados || []).filter(x => x.ok).length;
      setMlMsg(`✓ Actualizadas ${ok} de ${itemIds.length} publicaciones con estas ${j.fotos} fotos. (ML tarda 1-2 min en mostrarlas)`);
      setMlSel(new Set());
    } catch (e) { setMlMsg('Error: ' + e.message); }
  }
  const toggleML = id => setMlSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

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
          <div className="modal-caja" style={{ width: 'min(780px, 100%)' }} onPaste={pegarImagen}>
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
            <p className="ayuda" style={{ margin: '10px 0 0' }}>Arrastrá las fotos para reordenarlas — la primera es la portada. ★ = pasar al frente, × = quitar.</p>
            <div style={{ margin: '12px 0 18px' }}>
              <GrillaFotos
                fotos={fotos}
                mapaColores={mapaColores}
                colores={[...new Set((fotosDe.variantes || []).map(v => v.color))].filter(Boolean)}
                onOrden={guardarLista}
                onPortada={hacerPortada}
                onBorrar={borrarFoto}
                onColor={asignarColor}
              />
              {subiendo && <p className="ayuda" style={{ marginTop: 10 }}>Trayendo fotos…</p>}
            </div>
            {/* Traer fotos pegando un link — sin descargar nada a mano */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="url"
                placeholder="Pegá el link de una página (MELI, tienda…) o de una imagen"
                value={link}
                onChange={e => setLink(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); importarDeLink(link); } }}
                style={{ flex: 1 }}
              />
              <button className="btn-oro" disabled={subiendo || !link.trim()} onClick={() => importarDeLink(link)}>Traer fotos</button>
            </div>
            <p className="ayuda" style={{ margin: '0 0 14px' }}>💡 Pegá el link de una página de producto y traigo las fotos solas · o hacé <b>Ctrl+V</b> de una imagen copiada.</p>
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
            {/* Actualizar estas fotos en MercadoLibre (elegís la publicación del color correcto) */}
            <div style={{ borderTop: '1px solid #e8e2d5', margin: '2px 0 14px', paddingTop: 14 }}>
              <button className="btn-sec" onClick={buscarML}>🔄 Actualizar estas fotos en MercadoLibre</button>
              {mlMsg && <p className="ayuda" style={{ margin: '10px 0 0' }}>{mlMsg}</p>}
              {mlLista && mlLista.length > 0 && (
                <>
                  <div style={{ maxHeight: 230, overflowY: 'auto', margin: '10px 0', border: '1px solid #eee6d6', borderRadius: 8 }}>
                    {mlLista.map(c => (
                      <label key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 8px', cursor: 'pointer', fontSize: '.8rem', borderBottom: '1px solid #f3eee2' }}>
                        <input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={mlSel.has(c.id)} onChange={() => toggleML(c.id)} />
                        {c.thumbnail && <img src={c.thumbnail} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flex: '0 0 auto' }} />}
                        <span style={{ flex: 1, lineHeight: 1.2 }}>{c.title}</span>
                        <span style={{ whiteSpace: 'nowrap' }}>{c.status === 'active' ? '🟢' : '⏸'} {c.fotos}📷</span>
                      </label>
                    ))}
                  </div>
                  <button className="btn-oro" disabled={!mlSel.size} onClick={pushML}>Actualizar {mlSel.size ? mlSel.size + ' ' : ''}en ML</button>
                </>
              )}
            </div>
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
