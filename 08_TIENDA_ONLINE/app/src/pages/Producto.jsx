import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { plata, track, getFotos } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto, { Badge, TileMarca, popColor } from '../components/CardProducto.jsx';

export default function Producto() {
  const { id } = useParams();
  const nav = useNavigate();
  const cfg = useCfg();
  const productos = useProductos();
  const [fotos, setFotos] = useState([]);
  const [fotoActiva, setFotoActiva] = useState(0);

  const p = (productos || []).find(x => x.id === id);

  useEffect(() => {
    if (productos && !p) nav('/catalogo', { replace: true });
  }, [productos, p]);

  useEffect(() => {
    if (!p) return;
    document.title = `${p.marca} ${p.modelo} — RICHARD LENS`;
    setFotoActiva(0);
    getFotos(p.foto_codigo).then(setFotos);
    track('visita_producto', p.id);
    return () => { document.title = 'RICHARD LENS — Anteojos 100% originales. Se te nota lo rich.'; };
  }, [p?.id]);

  const rel = (productos || []).filter(x => x.id !== id)
    .sort((a, b) => (b.marca === p?.marca) - (a.marca === p?.marca)).slice(0, 4);
  useReveals(id + (productos ? 1 : 0));

  if (!p) return <main className="wrap" style={{ paddingTop: 150, minHeight: '60vh' }} />;

  const msgWA = `Hola, me interesa el ${p.marca} ${p.modelo} (${p.codigo}). ¿Precio y stock?`;

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

          <div className="prod-specs">
            <div className="spec"><small>Color</small><span>{p.color}</span></div>
            <div className="spec"><small>Cristal</small><span>{p.cristal}</span></div>
            <div className="spec"><small>Forma</small><span>{p.forma}</span></div>
            <div className="spec"><small>Material</small><span>{p.material}</span></div>
            <div className="spec"><small>Autenticidad</small><span>Grabados + estuche + factura</span></div>
            <div className="spec"><small>Envío</small><span>24-48 h, asegurado, todo el país</span></div>
          </div>

          {p.precio_web > 0 && cfg ? (
            <div className="prod-precio-box">
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
            <BotonWA cfg={cfg} className="btn btn-oro" texto={msgWA}>
              {p.estado === 'a_pedido' ? 'Encargar este par' : 'Quiero este par'}
            </BotonWA>
            <Link to="/catalogo" className="btn btn-linea">Ver más modelos</Link>
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
