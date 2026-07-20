import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { track, api } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto from '../components/CardProducto.jsx';
import HeroCollage from '../components/HeroCollage.jsx';

// el lente girando entra lazy (three.js no pesa en el primer paint)
const Gafas360 = lazy(() => import('../components/Gafas360.jsx'));

const MARCAS = ['RAY-BAN', 'OAKLEY', 'PRADA', 'GUCCI', 'DIOR', 'LOUIS VUITTON', 'CARTIER', 'SAINT LAURENT', 'BALENCIAGA', 'FENDI', 'VERSACE', 'CELINE', 'TOM FORD', 'MIU MIU', 'OFF-WHITE'];

/* la lógica Nike: categorías arriba, lo que queremos vender primero */
const CATEGORIAS = [
  { titulo: 'Gafas Hombre', href: '/catalogo?genero=hombre', foto: '/fotos/rb2140-901/01.jpg' },
  { titulo: 'Gafas Mujer', href: '/catalogo?genero=mujer', foto: '/fotos/rb4171-865-13/02.jpg' },
  { titulo: 'Más Vendidos', href: '/catalogo?orden=vendidos', foto: '/fotos/rb3025-l0205/01.jpg' },
  { titulo: 'En Promoción', href: '/catalogo?promo=1', foto: '/fotos/rb3016-w0365/01.jpg' }
];

const FAQS = [
  ['¿Cómo sé que no es réplica?', 'Antes de pagar te mostramos los grabados del cristal y la varilla, el estuche, el paño y la factura. Y si igual dudás: garantía doble — no es original, te devolvemos el doble.'],
  ['¿Hacen envíos al interior?', 'A todo el país, asegurado y con seguimiento. Despachamos en 24-48 h por Andreani u OCA.'],
  ['¿Puedo pagar en cuotas?', 'Sí, con tarjeta. Y si pagás por transferencia tenés descuento directo. Elegís al cerrar el pedido.'],
  ['¿Y si no me queda bien?', 'Tenés 30 días para cambiarlo, coordinando por el mismo WhatsApp donde compraste.']
];

const CONFIANZA = [
  ['I', 'Garantía doble de autenticidad', 'Si algo de lo que te vendimos no es original, te devolvemos el doble de lo que pagaste.'],
  ['II', 'Todo a la vista antes de pagar', 'Grabados, estuche, paño y factura. Video del par exacto que te llevás.'],
  ['III', 'Envíos asegurados al país entero', 'Despacho en 24-48 h con seguimiento, de Ushuaia a La Quiaca.'],
  ['IV', 'Cambios sin fricción', '30 días para cambiar, por el mismo canal donde compraste.']
];

function Newsletter() {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState('');
  async function suscribir(e) {
    e.preventDefault();
    if (!email) return;
    try {
      await api('suscriptores', 'POST', { email });
      setEstado('Adentro. Los drops te llegan antes que a nadie.');
      setEmail('');
      track('newsletter_alta', email);
    } catch { setEstado('Ese mail no parece válido — probá de nuevo.'); }
  }
  return (
    <section className="seccion news">
      <div className="wrap news-in reveal">
        <div>
          <p className="sec-kicker">La lista</p>
          <h2 className="sec-titulo" style={{ fontSize: 'clamp(1.8rem,3.6vw,2.8rem)' }}>Los drops llegan primero<br />a los de la lista.</h2>
          <p className="sec-bajada" style={{ marginBottom: 0 }}>Stock nuevo, precios y ediciones limitadas, directo a tu casilla. Sin spam — no somos de escribir de más.</p>
        </div>
        <form className="news-form" onSubmit={suscribir}>
          <input type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn-brush" type="submit">Entrar a la lista</button>
          {estado && <p className="news-ok">{estado}</p>}
        </form>
      </div>
    </section>
  );
}

export default function Home() {
  const cfg = useCfg();
  const productos = useProductos();
  useReveals(productos);
  useEffect(() => { track('visita', 'home'); }, []);

  const vendidos = (productos || []).filter(p => p.canal !== 'WEB' && p.estado === 'disponible' && p.destacado).slice(0, 4);
  const vault = (productos || []).filter(p => p.canal === 'WEB' && p.estado !== 'proximamente').slice(0, 8);
  const drop = vendidos[0];

  return (
    <main>
      {/* HERO editorial + panel de vidrio */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-panel">
            <div>
              <p className="hero-kicker">Anteojos 100% originales · Envíos a todo el país</p>
              <h1>
                <span className="l1">Se te nota</span>
                <span className="l2">lo rich.</span>
              </h1>
              <p className="hero-sub">Ray-Ban con entrega inmediata. Dior, Prada, Gucci, Louis Vuitton y Cartier directo a tu puerta — sin vidriera, sin verso, con garantía doble.</p>
              <div className="hero-ctas">
                <Link to="/catalogo" className="btn-brush">Ver la colección</Link>
                <BotonWA cfg={cfg} className="btn-pill" texto="Hola, quiero ver modelos y precios.">WhatsApp</BotonWA>
              </div>
            </div>
            <HeroCollage drop={drop} cfg={cfg} />
          </div>
        </div>
      </section>

      {/* TICKER MARCAS */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-in">
          {[0, 1].map(v => MARCAS.map((m, i) => (
            <React.Fragment key={v + '-' + i}><span>{m}</span><span>·</span></React.Fragment>
          )))}
        </div>
      </div>

      {/* CATEGORÍAS (la grilla Nike) */}
      <section className="seccion" style={{ paddingBottom: 40 }}>
        <div className="wrap">
          <p className="sec-kicker reveal">Comprá por categoría</p>
          <h2 className="sec-titulo reveal">¿Qué estás buscando?</h2>
          <div className="grid-categorias">
            {CATEGORIAS.map((c, i) => (
              <Link to={c.href} className="cat-tile reveal" key={c.titulo} style={{ transitionDelay: `${i * 70}ms` }}>
                <img src={c.foto} alt={c.titulo} loading="lazy" />
                <span className="cat-nombre">{c.titulo}</span>
                <span className="cat-flecha">Ver →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MÁS VENDIDOS */}
      <section className="seccion">
        <div className="wrap">
          <div className="sec-fila reveal">
            <div>
              <p className="sec-kicker">Los que vuelan</p>
              <h2 className="sec-titulo">Más vendidos</h2>
            </div>
            <Link to="/catalogo?orden=vendidos" className="btn-pill pill-claro">Ver todos →</Link>
          </div>
          <div className="grid-productos">
            {vendidos.map((p, i) => <CardProducto key={p.id} p={p} i={i} cfg={cfg} />)}
          </div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="wrap reveal">
        <Link to="/catalogo?promo=1" className="promo-banner">
          <div>
            <p className="promo-kicker">En promoción</p>
            <h3>Polarizados a $299.900</h3>
            <p className="promo-sub">El mercado los vende arriba de $450.000. Nosotros no. Original, con factura y garantía doble.</p>
          </div>
          <span className="btn-brush">Ver ofertas</span>
        </Link>
      </section>

      {/* LA CAJA FUERTE */}
      <section className="seccion vault">
        <div className="wrap">
          <p className="sec-kicker reveal">Solo por acá — jamás en MercadoLibre</p>
          <h2 className="sec-titulo reveal">La caja <span className="oro">fuerte</span></h2>
          <p className="sec-bajada reveal">Dior, Prada, Gucci, Louis Vuitton, Cartier, Saint Laurent. Las marcas que no se subastan: van directo, con garantía y factura a la vista.</p>
          <div className="grid-productos">
            {vault.map((p, i) => <CardProducto key={p.id} p={p} i={i} cfg={cfg} />)}
          </div>
        </div>
      </section>

      {/* RICH 001 — el lente girando */}
      <section className="rich3d">
        <Suspense fallback={null}><Gafas360 /></Suspense>
        <div className="rich3d-texto">
          <p className="sec-kicker reveal">Próximamente</p>
          <h2 className="sec-titulo reveal">RICH 001</h2>
          <p className="sec-bajada reveal" style={{ margin: '0 auto 30px' }}>La línea propia. Edición numerada, polarizado UV400, drop limitado. El rich estaba en el nombre.</p>
          <Newsletter3dCta cfg={cfg} />
        </div>
      </section>

      {/* POR QUÉ NOSOTROS */}
      <section className="seccion" id="por-que">
        <div className="wrap">
          <p className="sec-kicker reveal">Por qué nosotros</p>
          <h2 className="sec-titulo reveal">Lo que a otros les falta, acá sobra</h2>
          <div className="grid-confianza reveal">
            {CONFIANZA.map(([num, t, d]) => (
              <div className="conf-item" key={num}>
                <div className="conf-num">{num}</div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="seccion" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <p className="sec-kicker reveal">Las dudas de siempre</p>
          <h2 className="sec-titulo reveal">Preguntá tranquilo</h2>
          <div className="faq reveal">
            {FAQS.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <Newsletter />

      {/* CTA FINAL */}
      <section className="cta-final">
        <div className="cta-panel">
          <h2>El que quiere, <span>puede.</span></h2>
          <p className="tag-graffiti">y al que puede, se le nota</p>
          <div>
            <BotonWA cfg={cfg} className="btn-brush" texto="Hola, quiero mis lentes. ¿Qué tenés en stock?">Quiero mis lentes</BotonWA>
          </div>
        </div>
      </section>
    </main>
  );
}

function Newsletter3dCta({ cfg }) {
  return (
    <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
      <a href="#lista" className="btn-pill pill-claro" onClick={e => { e.preventDefault(); document.querySelector('.news')?.scrollIntoView({ behavior: 'smooth' }); }}>
        Avisame del drop
      </a>
    </div>
  );
}
