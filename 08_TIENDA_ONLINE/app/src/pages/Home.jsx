import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { track } from '../lib/api.js';
import { useProductos, useReveals } from '../lib/hooks.js';
import { useCfg, BotonWA } from '../components/TiendaLayout.jsx';
import CardProducto from '../components/CardProducto.jsx';
import HeroCollage, { BilletesFondo } from '../components/HeroCollage.jsx';

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
      {/* HERO COLLAGE */}
      <section className="hero">
        <BilletesFondo />
        <div className="wrap hero-grid">
          <div>
            <p className="hero-kicker">Anteojos 100% originales · Envíos a todo el país</p>
            <h1>SE TE NOTA<br />LO <span className="relleno-verde">RICH</span>
              <span className="tag-graffiti t-rojo" style={{ fontSize: '.24em', verticalAlign: 'super', marginLeft: '.3em' }}>desde el nombre</span>
            </h1>
            <p className="hero-sub">Ray-Ban y Oakley con entrega inmediata. Prada, Gucci, Louis Vuitton, Balenciaga y Fendi directo a tu puerta — sin vidriera, sin verso, con garantía de autenticidad doble.</p>
            <div className="hero-ctas">
              <Link to="/catalogo" className="btn btn-oro">Ver el catálogo</Link>
              <BotonWA cfg={cfg} className="btn btn-linea" texto="Hola, quiero ver modelos y precios.">Escribir por WhatsApp</BotonWA>
            </div>
          </div>
          <HeroCollage />
        </div>
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
