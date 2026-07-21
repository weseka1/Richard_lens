import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { track } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto from '../components/CardProducto.jsx';

const ESTADOS = [['disponible', 'Stock ya'], ['a_pedido', 'A pedido']];
const POR_PAGINA = 24; // el navegador se ahoga si pintamos los 505 juntos (cada card pide sus fotos)

/* paginador: ‹ 1 2 3 … 21 › — siempre muestra primera, última y las vecinas */
function Paginador({ pagina, paginas, onIr }) {
  if (paginas <= 1) return null;
  const nums = [];
  for (let i = 1; i <= paginas; i++) {
    if (i === 1 || i === paginas || Math.abs(i - pagina) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <div className="paginador">
      <button className="pag-btn" disabled={pagina === 1} onClick={() => onIr(pagina - 1)}>‹</button>
      {nums.map((n, i) => n === '…'
        ? <span key={'p' + i} className="pag-puntos">…</span>
        : <button key={n} className={'pag-btn' + (n === pagina ? ' activo' : '')} onClick={() => onIr(n)}>{n}</button>
      )}
      <button className="pag-btn" disabled={pagina === paginas} onClick={() => onIr(pagina + 1)}>›</button>
    </div>
  );
}

function Chips({ items, valor, onCambio, labels = {} }) {
  return (
    <div className="filtro-grupo">
      <button className={'chip' + (!valor ? ' activo' : '')} onClick={() => onCambio(null)}>Todo</button>
      {items.map(v => (
        <button key={v} className={'chip' + (valor === v ? ' activo' : '')} onClick={() => onCambio(v)}>
          {labels[v] || v}
        </button>
      ))}
    </div>
  );
}

const TITULOS = {
  hombre: ['Gafas Hombre', 'Los marcos que bancan cualquier cara. Todos nuestros modelos son unisex — esto es lo que más piden ellos.'],
  mujer: ['Gafas Mujer', 'De Erika a Miu Miu. Todos nuestros modelos son unisex — esto es lo que más piden ellas.'],
  vendidos: ['Más vendidos', 'Los que vuelan. Stock real, entrega inmediata.'],
  promo: ['En promoción', 'Precios que el mercado no puede seguir. Original, con factura y garantía doble.']
};

export default function Catalogo() {
  const cfg = useCfg();
  const productos = useProductos();
  const [params] = useSearchParams();
  const [marca, setMarca] = useState(params.get('marca'));
  const [forma, setForma] = useState(null);
  const [estado, setEstado] = useState(null);
  const [canal, setCanal] = useState(params.get('canal'));
  const genero = params.get('genero');
  const orden = params.get('orden');
  const promo = params.get('promo');
  const q = (params.get('q') || '').toLowerCase();

  const [pagina, setPagina] = useState(1);

  useEffect(() => { setCanal(params.get('canal')); setMarca(params.get('marca')); }, [params]);
  // cualquier filtro nuevo vuelve a la página 1: si no, quedás mirando una página que ya no existe
  useEffect(() => { setPagina(1); }, [q, marca, forma, estado, canal, genero, orden, promo]);
  useEffect(() => { track('visita', 'catalogo' + (canal ? ':cajafuerte' : promo ? ':promo' : orden ? ':vendidos' : '')); }, []);

  const [tituloPagina, bajada] = TITULOS[genero || (promo ? 'promo' : orden === 'vendidos' ? 'vendidos' : '')] ||
    ['Catálogo', 'Todo original, todo con garantía doble. Lo que no ves acá, se consigue a pedido — preguntá.'];

  const marcas = useMemo(() => [...new Set((productos || []).map(p => p.marca))], [productos]);
  // formas dinámicas: las 8 categorías con más modelos
  const FORMAS = useMemo(() => {
    const conteo = {};
    (productos || []).forEach(p => { conteo[p.forma] = (conteo[p.forma] || 0) + 1; });
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
  }, [productos]);
  let lista = (productos || []).filter(p =>
    (!q || q.split(/\s+/).every(w => `${p.marca} ${p.modelo} ${p.codigo}`.toLowerCase().includes(w))) &&
    (!marca || p.marca === marca) &&
    (!forma || p.forma === forma) &&
    (!estado || p.estado === estado) &&
    (!canal || p.canal === canal) &&
    (!promo || (p.precio_web > 0 && p.precio_web <= 229900)) &&
    (p.estado !== 'proximamente' || (!promo && !orden))
  );
  // orden de góndola: RB clásicos → collabs → Oakley → lujo → resto; armazones al final;
  // dentro de cada grupo: destacados y stock primero
  const rango = p => {
    if (p.forma === 'armazón recetado') return 60;
    if (p.marca === 'Ray-Ban') return 10;
    if (p.marca.startsWith('Ray-Ban ·')) return 20;
    if (p.marca === 'Oakley') return 25;
    if (p.canal === 'WEB') return 30;   // el lujo
    return 40;
  };
  lista = [...lista].sort((a, b) =>
    (orden === 'vendidos' || genero)
      ? (b.destacado - a.destacado) || (b.stock - a.stock)
      : rango(a) - rango(b) || (b.destacado - a.destacado) || (b.stock - a.stock) || a.marca.localeCompare(b.marca)
  );

  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const pagActual = Math.min(pagina, paginas);
  const visibles = lista.slice((pagActual - 1) * POR_PAGINA, pagActual * POR_PAGINA);
  const irA = n => { setPagina(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useReveals(visibles.length + pagActual);

  return (
    <main className="wrap" style={{ paddingTop: 130 }}>
      <p className="sec-kicker">La colección</p>
      <h1 className="sec-titulo">{tituloPagina}</h1>
      <p className="sec-bajada">{bajada}</p>

      <div className="filtros">
        <Chips
          items={['Ray-Ban', 'Ray-Ban · Ferrari', 'Louis Vuitton', 'Dior', 'Gucci', 'Prada', 'Oakley'].filter(m => marcas.includes(m))}
          valor={marca}
          onCambio={v => { setMarca(v); setCanal(null); }}
        />
        <select
          className="chip select-marca"
          value={marca || ''}
          onChange={e => { setMarca(e.target.value || null); setCanal(null); }}
        >
          <option value="">Todas las marcas</option>
          {marcas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="filtros">
        <Chips items={FORMAS} valor={forma} onCambio={setForma} />
        <Chips items={ESTADOS.map(e => e[0])} valor={estado} onCambio={setEstado} labels={Object.fromEntries(ESTADOS)} />
      </div>

      {lista.length > 0 && (
        <p className="catalogo-conteo">
          {lista.length} {lista.length === 1 ? 'modelo' : 'modelos'}
          {paginas > 1 && <> · página {pagActual} de {paginas}</>}
        </p>
      )}

      <div className="grid-productos" style={{ marginBottom: 40 }}>
        {visibles.map((p, i) => <CardProducto key={p.id} p={p} i={i} cfg={cfg} />)}
        {productos && lista.length === 0 && (
          <p style={{ color: 'var(--hueso-60)', gridColumn: '1/-1', padding: '40px 0' }}>
            No hay resultados con esos filtros. Lo que buscás seguro se consigue:{' '}
            <BotonWA cfg={cfg} texto="Hola, busco un modelo que no está en la web.">
              <span style={{ color: 'var(--oro)' }}>preguntanos por WhatsApp</span>
            </BotonWA>.
          </p>
        )}
      </div>

      <div style={{ marginBottom: 110 }}>
        <Paginador pagina={pagActual} paginas={paginas} onIr={irA} />
      </div>
    </main>
  );
}
