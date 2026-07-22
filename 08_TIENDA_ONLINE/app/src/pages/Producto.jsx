import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { plata, track, getFotos } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto, { Badge, TileMarca, popColor } from '../components/CardProducto.jsx';
import { agregar, precioLista } from '../lib/carrito.js';
// El probador de selfie queda fuera del lanzamiento hasta que el encuadre
// deje de deformar la cara. Vive en components/Probador.jsx.

/* mismo color escrito distinto ("marrón degradé" / "marron degrade") tiene que matchear */
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/* Las formas que le dicen algo al comprador. El resto de los valores de
 * `forma` ("lujo", "collab", "highstreet", "blaze") son cómo agrupamos el
 * catálogo nosotros, y en la ficha quedaban como si fueran una característica
 * del armazón. */
const FORMAS_VISIBLES = {
  aviador: 'Aviador', wayfarer: 'Wayfarer', clubmaster: 'Clubmaster',
  redondo: 'Redondo', cuadrado: 'Cuadrado', cats: 'Ojo de gato',
  deportivo: 'Deportivo', 'armazón recetado': 'Armazón recetado',
  'armazon recetado': 'Armazón recetado',
};

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
  const [mapaFotos, setMapaFotos] = useState({});
  const [fotoActiva, setFotoActiva] = useState(0);
  const [variante, setVariante] = useState(null);
  const [zoom, setZoom] = useState(false);
  const [verTodosColores, setVerTodosColores] = useState(false);
  useEffect(() => { setFotoActiva(0); }, [variante?.sku]); // al cambiar color, la galería arranca en su primera foto
  // flechas del teclado para recorrer la galería
  useEffect(() => {
    const tecla = e => {
      if (e.key === 'ArrowRight') setFotoActiva(a => a + 1);
      if (e.key === 'ArrowLeft') setFotoActiva(a => Math.max(0, a - 1));
    };
    addEventListener('keydown', tecla);
    return () => removeEventListener('keydown', tecla);
  }, []);

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
    fetch('/api/fotos-mapa/' + p.foto_codigo).then(r => r.json()).then(setMapaFotos).catch(() => setMapaFotos({}));
    track('visita_producto', p.id);
    return () => { document.title = 'RICHARD LENS — Anteojos 100% originales. Se te nota lo rich.'; };
  }, [p?.id]);

  const rel = (productos || []).filter(x => x.id !== id)
    .sort((a, b) => (b.marca === p?.marca) - (a.marca === p?.marca)).slice(0, 4);
  useReveals(id + (productos ? 1 : 0));

  if (!p) return <main className="wrap" style={{ paddingTop: 150, minHeight: '60vh' }} />;

  const v = variante || p.variantes?.[0];
  // si la auditoría IA mapeó fotos a colores, la galería respeta la variante elegida.
  // Comparamos normalizado: el proveedor escribe "Carey/marron degrade" y la foto
  // puede estar etiquetada "Carey/marrón degradé" — sin esto no matchea nunca.
  const fotosDeColor = v?.color
    ? fotos.filter(f => norm(mapaFotos[f.split('/').pop()]) === norm(v.color))
    : [];
  const galeria = fotosDeColor.length ? fotosDeColor : fotos;
  const variosColores = new Set((p.variantes || []).map(x => x.color)).size > 1;
  const msgWA = v
    ? `Hola, me interesa el ${p.marca} ${p.modelo} en ${v.color} (${v.codigo}, talle ${v.talle}). ¿Precio?`
    : `Hola, me interesa el ${p.marca} ${p.modelo} (${p.codigo}). ¿Precio y stock?`;

  return (
    <main className="wrap">
      <div className="producto-layout">
        <div>
          <div
            className="galeria-principal"
            style={{ '--pop': popColor(p.id), touchAction: 'pan-y' }}
            onPointerDown={e => { e.currentTarget.dataset.x = e.clientX; }}
            onPointerUp={e => {
              const dx = e.clientX - Number(e.currentTarget.dataset.x || e.clientX);
              if (Math.abs(dx) > 40 && galeria.length > 1)
                setFotoActiva(a => (Math.min(a, galeria.length - 1) + (dx < 0 ? 1 : -1) + galeria.length) % galeria.length);
            }}
          >
            {galeria.length
              ? <img src={galeria[Math.min(fotoActiva, galeria.length - 1)]} alt={`${p.marca} ${p.modelo}`} draggable={false} onClick={() => setZoom(true)} />
              : <TileMarca p={p} nota="Fotos reales por WhatsApp — pedilas" />}
            {galeria.length > 1 && (
              <>
                <button className="galeria-nav nav-izq" aria-label="Anterior"
                  onClick={e => { e.stopPropagation(); setFotoActiva(a => (Math.min(a, galeria.length - 1) - 1 + galeria.length) % galeria.length); }}>‹</button>
                <button className="galeria-nav nav-der" aria-label="Siguiente"
                  onClick={e => { e.stopPropagation(); setFotoActiva(a => (Math.min(a, galeria.length - 1) + 1) % galeria.length); }}>›</button>
                <span className="galeria-contador">{Math.min(fotoActiva, galeria.length - 1) + 1} / {galeria.length}</span>
              </>
            )}
          </div>
          {v?.color && variosColores && !fotosDeColor.length && fotos.length > 0 && (
            <p className="galeria-aviso">Fotos oficiales del modelo. La galería muestra la línea completa, no solo el color "{v.color}" — escribinos y te confirmamos el detalle exacto de esa variante antes de cerrar.</p>
          )}
          {zoom && galeria.length > 0 && (
            <div
              className="lightbox"
              onClick={e => e.target === e.currentTarget && setZoom(false)}
              onPointerDown={e => { e.currentTarget.dataset.x = e.clientX; }}
              onPointerUp={e => {
                const dx = e.clientX - Number(e.currentTarget.dataset.x || e.clientX);
                if (Math.abs(dx) > 40 && galeria.length > 1)
                  setFotoActiva(a => (Math.min(a, galeria.length - 1) + (dx < 0 ? 1 : -1) + galeria.length) % galeria.length);
              }}
              style={{ touchAction: 'pan-y' }}
            >
              <button className="lightbox-cerrar" onClick={() => setZoom(false)} aria-label="Cerrar">×</button>
              <img src={galeria[Math.min(fotoActiva, galeria.length - 1)]} alt={`${p.marca} ${p.modelo} ampliada`} />
              {galeria.length > 1 && (
                <>
                  <button className="lightbox-nav izq" aria-label="Anterior"
                    onClick={e => { e.stopPropagation(); setFotoActiva(a => (Math.min(a, galeria.length - 1) - 1 + galeria.length) % galeria.length); }}>‹</button>
                  <button className="lightbox-nav der" aria-label="Siguiente"
                    onClick={e => { e.stopPropagation(); setFotoActiva(a => (Math.min(a, galeria.length - 1) + 1) % galeria.length); }}>›</button>
                  <span className="lightbox-contador">{Math.min(fotoActiva, galeria.length - 1) + 1} / {galeria.length}</span>
                </>
              )}
            </div>
          )}
          {galeria.length > 1 && (
            <div className="galeria-thumbs">
              {galeria.map((f, i) => (
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
            const todos = [...new Set(p.variantes.map(x => x.color))];
            /* Los colores que TIENEN foto propia van primero y son los que
             * el cliente ve de entrada: elegir uno cambia la imagen de verdad.
             * Los demás quedan detrás de un "ver más", porque ofrecer veinte
             * colores donde la foto no cambia marea y hace desconfiar. */
            const tieneFoto = c => fotos.some(f => norm(mapaFotos[f.split('/').pop()]) === norm(c));
            const conFoto = todos.filter(tieneFoto);
            const sinFoto = todos.filter(c => !tieneFoto(c));
            const colores = conFoto.length ? [...conFoto, ...(verTodosColores ? sinFoto : [])] : todos;
            const colorSel = v?.color || colores[0];
            const deColor = p.variantes.filter(x => x.color === colorSel);
            const [labelSel, bgSel, fgSel] = PILL_STOCK[v?.stock] || PILL_STOCK['CONSULTAR'];
            const elegir = c => setVariante(p.variantes.find(x => x.color === c && conStock(x)) || p.variantes.find(x => x.color === c));
            return (
              <div className="selector-variantes">
                <p className="selector-label">Color <span>· {todos.length} disponibles</span></p>
                <div className="selector-chips">
                  {colores.map(c => {
                    const hay = p.variantes.some(x => x.color === c && conStock(x));
                    return (
                      <button
                        key={c}
                        className={'chip-var' + (colorSel === c ? ' activo' : '') + (hay ? '' : ' agotado')}
                        onClick={() => elegir(c)}
                      >{c}</button>
                    );
                  })}
                  {conFoto.length > 0 && sinFoto.length > 0 && !verTodosColores && (
                    <button className="chip-var chip-mas" onClick={() => setVerTodosColores(true)}>
                      +{sinFoto.length} colores a pedido
                    </button>
                  )}
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
            {/* "según variante" y "lujo"/"collab"/"highstreet" son etiquetas
                nuestras de catálogo: al cliente le suenan a planilla interna */}
            {!p.variantes?.length && p.cristal && !/seg[úu]n variante/i.test(p.cristal) &&
              <div className="spec"><small>Cristal</small><span>{p.cristal}</span></div>}
            {FORMAS_VISIBLES[String(p.forma || '').toLowerCase()] &&
              <div className="spec"><small>Forma</small><span>{FORMAS_VISIBLES[String(p.forma).toLowerCase()]}</span></div>}
            <div className="spec"><small>Material</small><span>{p.material}</span></div>
            <div className="spec"><small>Autenticidad</small><span>Grabados + estuche + factura</span></div>
            <div className="spec"><small>Envío</small><span>24-48 h, asegurado, todo el país</span></div>
            {/* además de ser cierto, llena el hueco que quedaba en la grilla */}
            <div className="spec"><small>Garantía</small><span>30 días para cambio</span></div>
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
          </div>
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
