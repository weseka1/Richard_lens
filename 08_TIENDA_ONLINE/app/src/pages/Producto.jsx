import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { plata, track, getFotos } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto, { Badge, TileMarca, popColor } from '../components/CardProducto.jsx';
import { agregar, precioLista } from '../lib/carrito.js';
import Probador from '../components/Probador.jsx';

const PILL_STOCK = {
  'STOCK': ['Stock ya', '#C6A75E', '#0A0A0B'],
  'POCO STOCK': ['Quedan pocos', '#F4F1EA', '#0A0A0B'],
  'POR ENTRAR': ['Sin stock', 'rgba(244,241,234,.08)', 'rgba(244,241,234,.5)'],
  'CONSULTAR': ['Sin stock', 'rgba(244,241,234,.08)', 'rgba(244,241,234,.5)']
};

export default function Producto() {
  const { id } = useParams();
  const nav = useNavigate();
  const cfg = useCfg();
  const productos = useProductos();
  const [fotos, setFotos] = useState([]);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [variante, setVariante] = useState(null);
  const [probador, setProbador] = useState(false);

  const p = (productos || []).find(x => x.id === id);

  useEffect(() => {
    if (productos && !p) nav('/catalogo', { replace: true });
  }, [productos, p]);

  useEffect(() => {
    if (!p) return;
    import('../lib/seo.js').then(({ setSeo, jsonldProducto }) => setSeo({
      titulo: `Anteojos ${p.marca} ${p.modelo} Originales — Precio Argentina | Richard Lens`,
      descripcion: `${p.marca} ${p.modelo} 100% original con garantía doble.${p.precio_web ? ` $${p.precio_web.toLocaleString('es-AR')} y cuotas.` : ''} ${p.variantes?.length || 1} variantes. Envíos a toda Argentina.`,
      jsonld: jsonldProducto(p, cfg)
    }));
    setFotoActiva(0);
    getFotos(p.foto_codigo).then(setFotos);
    track('visita_producto', p.id);
    return () => { document.title = 'RICHARD LENS — Anteojos 100% originales. Se te nota lo rich.'; };
  }, [p?.id]);

  const rel = (productos || []).filter(x => x.id !== id)
    .sort((a, b) => (b.marca === p?.marca) - (a.marca === p?.marca)).slice(0, 4);
  useReveals(id + (productos ? 1 : 0));

  if (!p) return <main className="wrap" style={{ paddingTop: 150, minHeight: '60vh' }} />;

  const v = variante || p.variantes?.[0];
  const msgWA = v
    ? `Hola, me interesa el ${p.marca} ${p.modelo} en ${v.color} (${v.codigo}, talle ${v.talle}). ¿Precio?`
    : `Hola, me interesa el ${p.marca} ${p.modelo} (${p.codigo}). ¿Precio y stock?`;

  return (
    <main className="wrap">
      <div className="producto-layout">
        <div>
          <div className="galeria-principal" style={{ '--pop': popColor(p.id) }}>
            {fotos.length
              ? <img src={fotos[fotoActiva]} alt={`${p.marca} ${p.modelo}`} />
              : <TileMarca p={p} nota="Fotos reales por WhatsApp — pedilas" />}
          </div>
          {fotos.length > 1 && (
            <div className="galeria-thumbs">
              {fotos.map((f, i) => (
                <img key={f} src={f} alt={`vista ${i + 1}`} className={i === fotoActiva ? 'activa' : ''} onClick={() => setFotoActiva(i)} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <Badge p={p} estatico />
            <span className="card-num" style={{ position: 'static' }}>{p.codigo}</span>
          </div>
          <p className="prod-marca">{p.marca}</p>
          <h1 className="prod-titulo">{p.modelo}</h1>
          <p className="prod-desc">{p.descripcion}</p>

          {p.variantes?.length > 0 && (() => {
            const conStock = x => x.stock === 'STOCK' || x.stock === 'POCO STOCK';
            const colores = [...new Set(p.variantes.map(x => x.color))];
            const colorSel = v?.color || colores[0];
            const deColor = p.variantes.filter(x => x.color === colorSel);
            const [labelSel, bgSel, fgSel] = PILL_STOCK[v?.stock] || PILL_STOCK['CONSULTAR'];
            return (
              <div className="selector-variantes">
                <p className="selector-label">Color <span>· {colores.length} disponibles</span></p>
                <div className="selector-chips">
                  {colores.map(c => {
                    const hay = p.variantes.some(x => x.color === c && conStock(x));
                    return (
                      <button
                        key={c}
                        className={'chip-var' + (colorSel === c ? ' activo' : '') + (hay ? '' : ' agotado')}
                        onClick={() => setVariante(p.variantes.find(x => x.color === c && conStock(x)) || p.variantes.find(x => x.color === c))}
                      >{c}</button>
                    );
                  })}
                </div>
                <p className="selector-label">Talle</p>
                <div className="selector-chips">
                  {deColor.map(x => (
                    <button
                      key={x.sku}
                      className={'chip-var chip-talle' + (v?.sku === x.sku ? ' activo' : '') + (conStock(x) ? '' : ' agotado')}
                      onClick={() => setVariante(x)}
                    >{x.talle || 'Único'}</button>
                  ))}
                </div>
                {v && (
                  <div className="selector-estado">
                    <span style={{ background: bgSel, color: fgSel }} className="selector-pill">{labelSel}</span>
                    <span className="selector-cod">SKU {v.sku} · {v.codigo}</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="prod-specs">
            {!p.variantes?.length && <div className="spec"><small>Color</small><span>{p.color}</span></div>}
            {!p.variantes?.length && <div className="spec"><small>Cristal</small><span>{p.cristal}</span></div>}
            <div className="spec"><small>Forma</small><span>{p.forma}</span></div>
            <div className="spec"><small>Material</small><span>{p.material}</span></div>
            <div className="spec"><small>Autenticidad</small><span>Grabados + estuche + factura</span></div>
            <div className="spec"><small>Envío</small><span>24-48 h, asegurado, todo el país</span></div>
          </div>

          {p.precio_web > 0 && cfg ? (
            <div className="prod-precio-box">
              <span className="precio-lista" style={{ fontSize: '1.1rem' }}>{plata(precioLista(p.precio_web))}</span>
              <div className="prod-precio">{plata(p.precio_web)}</div>
              <div className="prod-cuotas">{cfg.cuotas} cuotas de {plata(Math.round(p.precio_web / cfg.cuotas))}</div>
              <div className="prod-transfer">{cfg.descuento_transferencia}% off por transferencia: {plata(Math.round(p.precio_web * (1 - cfg.descuento_transferencia / 100)))}</div>
            </div>
          ) : (
            <div className="prod-precio-box">
              <div className="prod-precio" style={{ fontSize: '1.4rem' }}>Precio por WhatsApp</div>
              <div className="prod-cuotas">Precio real del día en minutos, con cuotas y descuento por transferencia. Sin números viejos.</div>
            </div>
          )}

          <div className="hero-ctas">
            {p.precio_web > 0 && p.estado === 'disponible' ? (
              <button
                className="btn-brush brush-rosa"
                onClick={() => agregar({
                  id: p.id, marca: p.marca, modelo: p.modelo, precio: p.precio_web,
                  sku: v?.sku, color: v?.color, codigo: v?.codigo, talle: v?.talle
                })}
              >Agregar al carrito</button>
            ) : (
              <BotonWA cfg={cfg} className="btn-brush brush-rosa" texto={msgWA}>
                {p.estado === 'a_pedido' ? 'Encargar este par' : 'Quiero este par'}
              </BotonWA>
            )}
            <BotonWA cfg={cfg} className="btn-pill pill-claro" texto={msgWA}>Consultar por WhatsApp</BotonWA>
            <button className="btn-pill pill-claro" onClick={() => setProbador(true)}>Probátelas con tu selfie</button>
          </div>

          <Probador
            abierto={probador}
            onCerrar={() => setProbador(false)}
            fotoGafas={`/img/tryon/${p.id}.png`}
            nombre={`${p.marca} ${p.modelo}`}
          />
        </div>
      </div>

      <section className="seccion">
        <p className="sec-kicker reveal">Seguí mirando</p>
        <h2 className="sec-titulo reveal" style={{ fontSize: 'clamp(1.6rem,3.5vw,2.6rem)' }}>De la misma familia</h2>
        <div className="grid-productos" style={{ marginTop: 34 }}>
          {rel.map((x, i) => <CardProducto key={x.id} p={x} i={i} cfg={cfg} />)}
        </div>
      </section>
    </main>
  );
}
