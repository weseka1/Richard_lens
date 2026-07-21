import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { track, api } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto from '../components/CardProducto.jsx';
import HeroCine from '../components/HeroCine.jsx';

const MARCAS = ['RAY-BAN', 'OAKLEY', 'PRADA', 'GUCCI', 'DIOR', 'LOUIS VUITTON', 'CARTIER', 'SAINT LAURENT', 'BALENCIAGA', 'FENDI', 'VERSACE', 'CELINE', 'TOM FORD', 'MIU MIU', 'OFF-WHITE'];

/* la lógica Nike: categorías arriba, lo que queremos vender primero */
/* tiles = AVATARES editoriales en estudio gris (mismo sistema que cat-hombre).
 * Soltar cat-mujer.jpg / cat-vendidos.jpg / cat-promo.jpg en app/public/img/ y entran solos;
 * mientras falten, cae al recorte de producto. */
const CATEGORIAS = [
  { titulo: 'Gafas Hombre', href: '/catalogo?genero=hombre', foto: '/img/cat-hombre.jpg', fallback: '/img/tryon/wayfarer-classic-2140.png' },
  { titulo: 'Gafas Mujer', href: '/catalogo?genero=mujer', foto: '/img/cat-mujer-estudio.jpg', fallback: '/img/cat-mujer.jpg' },
  { titulo: 'Más Vendidos', href: '/catalogo?orden=vendidos', foto: '/img/cat-vendidos.jpg', fallback: '/img/tryon/aviador-espejado-3025.png' },
  { titulo: 'En Promoción', href: '/catalogo?promo=1', foto: '/img/cat-promo.jpg', fallback: '/img/tryon/wayfarer-espejado-2140.png' }
];

function TileCategoria({ c, i }) {
  const [src, setSrc] = useState(c.foto);
  return (
    <Link to={c.href} className={'cat-tile reveal' + (src.includes('/tryon/') ? ' tile-producto' : '')} style={{ transitionDelay: `${i * 70}ms` }}>
      <img src={src} alt={c.titulo} loading="lazy" onError={() => src !== c.fallback && setSrc(c.fallback)} />
      <span className="cat-nombre">{c.titulo}</span>
      <span className="cat-flecha">Ver →</span>
    </Link>
  );
}

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
      {/* HERO: video real si existe /img/hero.mp4, si no producto flotante */}
      <HeroCine drop={drop} cfg={cfg} />

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
            {CATEGORIAS.map((c, i) => <TileCategoria key={c.titulo} c={c} i={i} />)}
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
          <div className="beneficios reveal">
            <span>🚚 Envío gratis a todo el país</span>
            <span>💳 {cfg?.cuotas || 6} cuotas con tarjeta</span>
            <span>⚡ {cfg?.descuento_transferencia || 10}% off por transferencia</span>
            <span>🛡️ Garantía doble de autenticidad</span>
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

      {/* RICH 001 — la línea propia. Slot de video épico: soltar rich001.mp4 en app/public/img/ */}
      <section className="rich3d">
        <VideoRich />
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

      {/* INSTAGRAM: el reel en un teléfono, click → perfil */}
      <section className="seccion" style={{ paddingBottom: 40 }}>
        <div className="wrap ig-in">
          <div className="reveal">
            <p className="sec-kicker">@{cfg?.instagram || 'richardlens.ar'}</p>
            <h2 className="sec-titulo">La casa, en movimiento.</h2>
            <p className="sec-bajada" style={{ marginBottom: 26 }}>Drops, llegadas y el detrás de escena, todos los días en Instagram.</p>
            <a className="btn-brush" href={`https://instagram.com/${cfg?.instagram || 'richardlens.ar'}`} target="_blank" rel="noopener noreferrer">Seguir en Instagram</a>
          </div>
          <a
            className="ig-telefono reveal"
            href={`https://instagram.com/${cfg?.instagram || 'richardlens.ar'}`}
            target="_blank" rel="noopener noreferrer"
            aria-label="Abrir el Instagram de Richard Lens"
          >
            <div className="ig-chrome">
              <img src="/img/logo-drip.png" alt="" className="ig-avatar" />
              <div>
                <b>{cfg?.instagram || 'richardlens.ar'}</b>
                <span>Eyewear House · Argentina</span>
              </div>
              <em>Seguir</em>
            </div>
            <video src="/img/ig.mp4" autoPlay muted loop playsInline />
            <div className="ig-pie">
              <div className="ig-acciones">
                <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-9.5-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.5 12c-2 4.1-9.5 9-9.5 9Z" /></svg>
                <svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2-5.6A8.5 8.5 0 1 1 21 11.5Z" /></svg>
                <svg viewBox="0 0 24 24"><path d="M22 3 2 10.5l7 2.5M22 3l-5.5 18L12 13M22 3 12 13" /></svg>
                <svg viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}><path d="M6 3h12v18l-6-4.5L6 21V3Z" /></svg>
              </div>
              <p className="ig-caption"><b>{cfg?.instagram || 'richardlens.ar'}</b> Dobles en el club. Los ojos, cubiertos. 🎾</p>
            </div>
          </a>
        </div>
      </section>

      {/* NEWSLETTER */}
      <Newsletter />

      {/* CONTENIDO SEO */}
      <section className="seccion" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="wrap seo-bloque">
          <h2>Anteojos de sol originales en Argentina</h2>
          <p>Richard Lens &amp; Co. es una eyewear house argentina especializada en anteojos de sol y armazones recetados 100% originales: Ray-Ban Wayfarer, Aviator, Clubmaster y Erika con entrega inmediata, y lentes de sol de lujo Dior, Prada, Gucci, Louis Vuitton, Cartier, Saint Laurent, Fendi, Versace, Balenciaga, Celine, Miu Miu y Off-White a pedido. Todos nuestros lentes incluyen estuche, paño y papelería original, con grabados verificables y garantía doble de autenticidad: si no es original, devolvemos el doble.</p>
          <p>Comprá gafas de sol online con envío asegurado a todo el país — Buenos Aires, Córdoba, Rosario, Mendoza, Bahía Blanca y cada rincón de Argentina — con cuotas sin recargo y descuento por transferencia. ¿Buscás anteojos Ray-Ban originales baratos, lentes polarizados o gafas de lujo? Escribinos por WhatsApp y recibí precio y stock en minutos.</p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-final">
        <div className="cta-panel">
          <h2>Richard Lens <span>&amp; Co.</span></h2>
          <p className="tag-graffiti" style={{ fontStyle: 'normal', fontFamily: 'var(--texto)', fontSize: '.78rem', letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gris-label)' }}>Buenos Aires · Madrid · Miami · Milano</p>
          <div>
            <BotonWA cfg={cfg} className="btn-brush" texto="Hola, quiero mis lentes. ¿Qué tenés en stock?">Hablar con la casa</BotonWA>
          </div>
        </div>
      </section>
    </main>
  );
}

function VideoRich() {
  const [hay, setHay] = useState(true);
  if (!hay) return null;
  return (
    <>
      <video
        src="/img/rich001.mp4" autoPlay muted loop playsInline
        onError={() => setHay(false)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .5 }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 55% at 50% 45%, transparent 20%, rgba(11,11,12,.88) 100%)' }} />
    </>
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
