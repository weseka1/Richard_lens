import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { linkWA, track } from '../lib/api.js';
import { useConfig } from '../lib/hooks.js';
import ChatRich from './ChatRich.jsx';
import CartDrawer from './CartDrawer.jsx';
import { useCarrito } from '../lib/carrito.js';
import Lenis from 'lenis';
import PopupSuscripcion from './PopupSuscripcion.jsx';

const ConfigContext = createContext(null);
export const useCfg = () => useContext(ConfigContext);

/* Las columnas del menú de catálogo. Se usan dos veces: en escritorio dentro
 * del mega desplegable, en celular como acordeón adentro del menú. */
const COLUMNAS_MENU = (
  <>
    <div className="mega-col">
      <b>Destacados</b>
      <Link to="/catalogo?orden=vendidos">Más vendidos</Link>
      <Link to="/catalogo?promo=1">En promoción</Link>
      <Link to="/catalogo?estado=disponible">Stock inmediato</Link>
      <Link to="/catalogo">Ver todo</Link>
    </div>
    <div className="mega-col">
      <b>Ray-Ban</b>
      <Link to="/catalogo?marca=Ray-Ban">Toda la línea</Link>
      <Link to="/catalogo?marca=Ray-Ban%20·%20Ferrari">Ferrari Edition</Link>
      <Link to="/catalogo?marca=Ray-Ban%20·%20A%24AP%20Rocky">A$AP Rocky</Link>
      <Link to="/catalogo?marca=Oakley">Oakley</Link>
    </div>
    <div className="mega-col">
      <b>La Caja Fuerte</b>
      <Link to="/catalogo?marca=Louis%20Vuitton">Louis Vuitton</Link>
      <Link to="/catalogo?marca=Dior">Dior</Link>
      <Link to="/catalogo?marca=Gucci">Gucci</Link>
      <Link to="/catalogo?marca=Prada">Prada</Link>
      <Link to="/catalogo?marca=Fendi">Fendi</Link>
      <Link to="/catalogo?marca=Off-White">Off-White</Link>
      <Link to="/catalogo?marca=Saint%20Laurent">Saint Laurent</Link>
      <Link to="/catalogo?canal=WEB">Todo el lujo</Link>
    </div>
    <div className="mega-col">
      <b>Más lujo</b>
      <Link to="/catalogo?marca=Versace">Versace</Link>
      <Link to="/catalogo?marca=Balenciaga">Balenciaga</Link>
      <Link to="/catalogo?marca=Celine">Celine</Link>
      <Link to="/catalogo?marca=Tom%20Ford">Tom Ford</Link>
      <Link to="/catalogo?marca=Cartier">Cartier</Link>
      <Link to="/catalogo?marca=Dolce%20%26%20Gabbana">Dolce &amp; Gabbana</Link>
      <Link to="/catalogo?marca=Miu%20Miu">Miu Miu</Link>
    </div>
    <div className="mega-col">
      <b>Colecciones</b>
      <Link to="/catalogo?genero=hombre">Gafas Hombre</Link>
      <Link to="/catalogo?genero=mujer">Gafas Mujer</Link>
      <Link to="/catalogo?forma=armazón recetado">Armazones recetados</Link>
      <Link to="/catalogo?forma=collab">Collabs</Link>
    </div>
  </>
);

/* ¿estamos en el layout de celular? el mega se comporta distinto */
function useEsCelular() {
  const [es, setEs] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(max-width: 860px)').matches);
  useEffect(() => {
    const mq = matchMedia('(max-width: 860px)');
    const cambio = e => setEs(e.matches);
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, []);
  return es;
}

function BotonWA({ cfg, texto, className, children }) {
  if (!cfg) return null;
  return (
    <a
      className={className}
      href={linkWA(cfg, texto)}
      target="_blank" rel="noopener noreferrer"
      onClick={() => track('whatsapp_click', location.pathname + ' → ' + (texto || 'general'))}
    >{children}</a>
  );
}
export { BotonWA };

export default function TiendaLayout() {
  const cfg = useConfig();
  const [menu, setMenu] = useState(false);
  const [chat, setChat] = useState(false);
  const [carrito, setCarrito] = useState(false);
  const [mega, setMega] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const buscar = e => { e.preventDefault(); if (q.trim()) { nav('/catalogo?q=' + encodeURIComponent(q.trim())); setQ(''); } };
  const { cantidad } = useCarrito();
  const loc = useLocation();

  useEffect(() => { if (cantidad > 0) setCarrito(true); }, [cantidad]);

  useEffect(() => { window.scrollTo(0, 0); setMenu(false); setMega(false); }, [loc.pathname, loc.search]);

  /* scroll cinematográfico (el pulso wsk) */
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let id;
    const raf = t => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, []);

  /* el menú móvil cuelga del header: si el alto cambia (ticker, notch, zoom)
   * el desplegable tiene que seguirlo, si no se monta sobre el contenido */
  const esCelular = useEsCelular();
  const headerRef = useRef(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const medir = () => document.documentElement.style.setProperty('--alto-header', el.offsetHeight + 'px');
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    addEventListener('resize', medir);
    return () => { ro.disconnect(); removeEventListener('resize', medir); };
  }, []);

  // al navegar, el menú se cierra solo
  useEffect(() => { setMenu(false); setMega(false); }, [loc.pathname, loc.search]);

  return (
    <ConfigContext.Provider value={cfg}>
      <PopupSuscripcion />
      <header ref={headerRef}>
        <div className="anuncio" aria-hidden="true">
          <div className="anuncio-in">
            {[0, 1].map(v => (
              <span key={v}>ENVÍO GRATIS A TODO EL PAÍS<i>●</i> 100% ORIGINALES CON GARANTÍA DOBLE<i>●</i> PROBADOR VIRTUAL — PROBÁTELAS CON TU SELFIE<i>●</i> CUOTAS + DESCUENTO POR TRANSFERENCIA<i>●</i></span>
            ))}
          </div>
        </div>
        <div className="header-bar">
        <div className="header-in">
          <Link to="/" className="logo-text" aria-label="Richard Lens">
            RICHARD LENS<span style={{ color: 'var(--oro)', fontSize: '.72em', letterSpacing: '.2em', marginLeft: 8, alignSelf: 'center' }}>&amp; CO.</span>
          </Link>
          <button className="menu-btn" aria-label="Menú" onClick={() => setMenu(m => !m)}>☰</button>
          <nav className={menu ? 'abierta' : ''}>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'activa' : ''}>Inicio</NavLink>
            <div className="mega-wrap">
              <button className={'nav-boton' + (mega ? ' activa' : '')} onClick={() => setMega(m => !m)}>
                Catálogo <span className="nav-flecha" aria-hidden="true">{mega ? '−' : '+'}</span>
              </button>
              {/* En escritorio el mega va al body (si no, el blur del header lo
                * ancla mal). En celular NO se puede portalear: tiene que
                * desplegarse dentro del menú, como un acordeón. */}
              {mega && esCelular && <div className="mega-acordeon">{COLUMNAS_MENU}</div>}
              {mega && !esCelular && createPortal(<div className="mega-overlay" onClick={() => setMega(false)} />, document.body)}
              {mega && !esCelular && createPortal(
                <div className="mega abierta" onClick={() => setMega(false)}>{COLUMNAS_MENU}</div>,
                document.body
              )}
            </div>
            <Link to="/catalogo?canal=WEB">La Caja Fuerte</Link>
            <a href="/#por-que">Por qué nosotros</a>
            <form className="buscador-head" onSubmit={buscar}>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar modelo…" aria-label="Buscar" />
            </form>
            <BotonWA cfg={cfg} className="btn-wa-mini">WhatsApp</BotonWA>
            <button className="btn-cart-head" onClick={() => setCarrito(true)}>
              CARRITO ({cantidad})
            </button>
          </nav>
        </div>
        </div>
      </header>

      <CartDrawer cfg={cfg} abierto={carrito} onCerrar={() => setCarrito(false)} />

      <Outlet />

      {cfg && (
        <footer>
          <div className="wrap footer-in">
            <div>
              <div className="logo-text" style={{ marginBottom: 8 }}>
                RICHARD LENS<span style={{ color: 'var(--oro)', fontSize: '.72em', letterSpacing: '.2em', marginLeft: 8, alignSelf: 'center' }}>&amp; CO.</span>
              </div>
              <p>Anteojos 100% originales · Envíos a todo el país<br />{cfg.textos.garantia}</p>
            </div>
            <div className="footer-links">
              <Link to="/catalogo">Catálogo</Link>
              <a href={`https://instagram.com/${cfg.instagram}`} target="_blank" rel="noopener noreferrer">Instagram</a>
              <BotonWA cfg={cfg}>WhatsApp {cfg.whatsapp_display}</BotonWA>
            </div>
          </div>
        </footer>
      )}

      <div className="fab-stack">
        <button className="fab fab-rich" title="Hablar con RICH (IA)" onClick={() => setChat(true)}>R</button>
        <BotonWA cfg={cfg} className="fab fab-wa">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5a.6.6 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1 2.7 11.4 11.4 0 0 0 4.4 3.9 15 15 0 0 0 1.5.5 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.7-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.2-.2-.4-.3Z" /></svg>
        </BotonWA>
      </div>

      {cfg && <ChatRich cfg={cfg} abierto={chat} onCerrar={() => setChat(false)} />}
    </ConfigContext.Provider>
  );
}
