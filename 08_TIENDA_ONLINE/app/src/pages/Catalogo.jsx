import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { track } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto from '../components/CardProducto.jsx';

const ESTADOS = [['disponible', 'Stock ya'], ['a_pedido', 'A pedido']];

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

export default function Catalogo() {
  const cfg = useCfg();
  const productos = useProductos();
  const [params] = useSearchParams();
  const [marca, setMarca] = useState(params.get('marca'));
  const [forma, setForma] = useState(null);
  const [estado, setEstado] = useState(null);
  const [canal, setCanal] = useState(params.get('canal'));

  useEffect(() => { setCanal(params.get('canal')); setMarca(params.get('marca')); }, [params]);
  useEffect(() => { track('visita', 'catalogo' + (canal ? ':cajafuerte' : '')); }, []);

  const marcas = useMemo(() => [...new Set((productos || []).map(p => p.marca))], [productos]);
  // formas dinámicas: las 8 categorías con más modelos
  const FORMAS = useMemo(() => {
    const conteo = {};
    (productos || []).forEach(p => { conteo[p.forma] = (conteo[p.forma] || 0) + 1; });
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
  }, [productos]);
  const lista = (productos || []).filter(p =>
    (!marca || p.marca === marca) &&
    (!forma || p.forma === forma) &&
    (!estado || p.estado === estado) &&
    (!canal || p.canal === canal)
  );
  useReveals(lista.length);

  return (
    <main className="wrap" style={{ paddingTop: 130 }}>
      <p className="sec-kicker">La colección</p>
      <h1 className="sec-titulo">Catálogo</h1>
      <p className="sec-bajada">Todo original, todo con garantía doble. Lo que no ves acá, se consigue a pedido — preguntá.</p>

      <div className="filtros">
        <Chips items={marcas} valor={marca} onCambio={v => { setMarca(v); setCanal(null); }} />
      </div>
      <div className="filtros">
        <Chips items={FORMAS} valor={forma} onCambio={setForma} />
        <Chips items={ESTADOS.map(e => e[0])} valor={estado} onCambio={setEstado} labels={Object.fromEntries(ESTADOS)} />
      </div>

      <div className="grid-productos" style={{ marginBottom: 110 }}>
        {lista.map((p, i) => <CardProducto key={p.id} p={p} i={i} cfg={cfg} />)}
        {productos && lista.length === 0 && (
          <p style={{ color: 'var(--hueso-60)', gridColumn: '1/-1', padding: '40px 0' }}>
            No hay resultados con esos filtros. Lo que buscás seguro se consigue:{' '}
            <BotonWA cfg={cfg} texto="Hola, busco un modelo que no está en la web.">
              <span style={{ color: 'var(--oro)' }}>preguntanos por WhatsApp</span>
            </BotonWA>.
          </p>
        )}
      </div>
    </main>
  );
}
