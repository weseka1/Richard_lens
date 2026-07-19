import React, { useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { track } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto from '../components/CardProducto.jsx';

// three.js pesa ~600KB: entra lazy, la tienda carga primero y el 3D aparece después
const Gafas3D = lazy(() => import('../components/Gafas3D.jsx'));

const MARCAS = ['RAY-BAN', 'OAKLEY', 'PRADA', 'GUCCI', 'LOUIS VUITTON', 'BALENCIAGA', 'FENDI', 'VERSACE', 'DOLCE & GABBANA'];

const FAQS = [
  ['¿Cómo sé que no es réplica?', 'Antes de pagar te mostramos los grabados del cristal y la varilla, el estuche, el paño y la factura. Y si igual dudás: garantía doble — no es original, te devolvemos el doble. Ninguna réplica puede prometer eso.'],
  ['¿Por qué las marcas de lujo no tienen precio publicado?', 'Porque el stock de Prada, Gucci o LV se mueve rápido y el precio depende del modelo y del dólar. Por WhatsApp tenés precio real del día en minutos, no un número viejo que después "aumentó".'],
  ['¿Hacen envíos al interior?', 'A todo el país, asegurado y con seguimiento. Despachamos en 24-48 h por Andreani u OCA. Llega igual a CABA que a un pueblo de 2.000 habitantes.'],
  ['¿Puedo pagar en cuotas?', 'Sí, con tarjeta. Y si pagás por transferencia tenés descuento directo. Te pasamos las dos opciones por WhatsApp y elegís.'],
  ['¿Y si no me queda bien?', 'Tenés 30 días para cambiarlo. Coordinás el cambio por el mismo WhatsApp donde compraste — sin formularios ni llamaditas.']
];

const CONFIANZA = [
  ['01', 'Garantía doble de autenticidad', 'Si algo de lo que te vendimos no es original, te devolvemos el doble de lo que pagaste. Así de seguros estamos.'],
  ['02', 'Todo a la vista antes de pagar', 'Grabados, estuche, paño y factura. Te mandamos video del par exacto que te llevás, no fotos de catálogo.'],
  ['03', 'Envíos asegurados a todo el país', 'Despacho en 24-48 h con seguimiento. De Ushuaia a La Quiaca, llega igual de protegido.'],
  ['04', 'Cambios sin drama', '30 días para cambiar. El lente te tiene que gustar de verdad, si no, no sirve — ni a vos ni a nosotros.']
];

const PASOS = [
  ['Elegí tu par', 'Mirá el catálogo o preguntale a RICH, nuestro asistente. Si no está, lo conseguimos a pedido.'],
  ['Escribinos por WhatsApp', 'Precio, stock, cuotas y video del par en mano. Respondemos en minutos, no en días.'],
  ['Lo recibís donde estés', 'Pagás como te quede cómodo (cuotas o transferencia con descuento) y va asegurado hasta tu puerta.']
];

export default function Home() {
  const cfg = useCfg();
  const productos = useProductos();
  useReveals(productos);
  useEffect(() => { track('visita', 'home'); }, []);

  const drops = (productos || []).filter(p => p.canal !== 'WEB' && p.estado !== 'proximamente').slice(0, 4);
  const vault = (productos || []).filter(p => p.canal === 'WEB').slice(0, 8);

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <Suspense fallback={null}><Gafas3D /></Suspense>
        <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
          <p className="hero-kicker">Anteojos 100% originales · Envíos a todo el país</p>
          <h1>SE TE NOTA<br />LO <span className="oro">RICH</span>
            <span className="tag-graffiti" style={{ fontSize: '.25em', verticalAlign: 'super', marginLeft: '.3em' }}>desde el nombre</span>
          </h1>
          <p className="hero-sub">Ray-Ban y Oakley con entrega inmediata. Prada, Gucci, Louis Vuitton, Balenciaga y Fendi directo a tu puerta — sin vidriera, sin verso, con garantía de autenticidad doble.</p>
          <div className="hero-ctas">
            <Link to="/catalogo" className="btn btn-oro">Ver el catálogo</Link>
            <BotonWA cfg={cfg} className="btn btn-linea" texto="Hola, quiero ver modelos y precios.">Escribir por WhatsApp</BotonWA>
          </div>
        </div>
        <svg className="drip" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 L1440,0 L1440,18 C1380,18 1370,55 1340,55 C1310,55 1315,18 1260,18 C1180,18 1190,72 1150,72 C1110,72 1120,18 1040,18 C940,18 950,48 905,48 C860,48 870,18 760,18 C660,18 670,85 620,85 C570,85 580,18 470,18 C390,18 400,40 350,40 C300,40 310,18 210,18 C140,18 150,60 110,60 C70,60 80,18 0,18 Z" fill="#D4AF37" opacity=".9" />
        </svg>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-in">
          {[0, 1].map(v => MARCAS.map((m, i) => (
            <React.Fragment key={v + '-' + i}>
              <span>{['PRADA', 'LOUIS VUITTON', 'FENDI'].includes(m) ? <b>{m}</b> : m}</span>
              <span>✦</span>
            </React.Fragment>
          )))}
        </div>
      </div>

      {/* DROPS */}
      <section className="seccion">
        <div className="wrap">
          <p className="sec-kicker reveal">Entrega inmediata</p>
          <h2 className="sec-titulo reveal">Los drops de ahora</h2>
          <p className="sec-bajada reveal">Stock real, foto real, entrega ya. Cuando dice que quedan pocos, quedan pocos.</p>
          <div className="grid-productos">
            {drops.map((p, i) => <CardProducto key={p.id} p={p} i={i} cfg={cfg} />)}
          </div>
        </div>
      </section>

      {/* CAJA FUERTE */}
      <section className="seccion vault">
        <div className="wrap">
          <p className="sec-kicker reveal">Solo por acá — jamás en MercadoLibre</p>
          <h2 className="sec-titulo reveal">La caja <span className="oro">fuerte</span></h2>
          <p className="sec-bajada reveal">Las marcas que no se subastan: van directo. Prada, Gucci, LV, Balenciaga, Fendi, Versace y D&G a pedido, con garantía y factura a la vista. El precio se habla por WhatsApp, como corresponde.</p>
          <div className="grid-productos">
            {vault.map((p, i) => <CardProducto key={p.id} p={p} i={i} cfg={cfg} />)}
          </div>
        </div>
      </section>

      {/* POR QUÉ NOSOTROS */}
      <section className="seccion" id="por-que">
        <div className="wrap">
          <p className="sec-kicker reveal">Por qué nosotros</p>
          <h2 className="sec-titulo reveal">Lo que a otros les falta,<br />acá sobra</h2>
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

      {/* CÓMO COMPRAR */}
      <section className="seccion">
        <div className="wrap">
          <p className="sec-kicker reveal">Cómo comprar</p>
          <h2 className="sec-titulo reveal">Tres pasos, cero vueltas</h2>
          <div className="pasos reveal">
            {PASOS.map(([t, d]) => (
              <div className="paso" key={t}><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="seccion">
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

      {/* CTA FINAL */}
      <section className="cta-final">
        <h2>EL QUE QUIERE,<br /><span style={{ color: 'var(--oro)' }}>PUEDE.</span></h2>
        <p className="tag-graffiti">y al que puede, se le nota</p>
        <div>
          <BotonWA cfg={cfg} className="btn btn-oro" texto="Hola, quiero mis lentes. ¿Qué tenés en stock?">Quiero mis lentes</BotonWA>
        </div>
      </section>
    </main>
  );
}
