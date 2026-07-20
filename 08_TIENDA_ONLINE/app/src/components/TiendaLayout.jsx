import React, { createContext, useContext, useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { linkWA, track } from '../lib/api.js';
import { useConfig } from '../lib/hooks.js';
import ChatRich from './ChatRich.jsx';
import CartDrawer from './CartDrawer.jsx';
import { useCarrito } from '../lib/carrito.js';
import Lenis from 'lenis';
import IntroGraffiti from './IntroGraffiti.jsx';
import FondoDoodles from './FondoDoodles.jsx';

const ConfigContext = createContext(null);
export const useCfg = () => useContext(ConfigContext);

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
  const { cantidad } = useCarrito();
  const loc = useLocation();

  useEffect(() => { if (cantidad > 0) setCarrito(true); }, [cantidad]);

  useEffect(() => { window.scrollTo(0, 0); setMenu(false); }, [loc.pathname]);

  /* scroll cinematográfico (el pulso wsk) */
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let id;
    const raf = t => { lenis.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis.destroy(); };
  }, []);

  return (
    <ConfigContext.Provider value={cfg}>
      <IntroGraffiti />
      <FondoDoodles />
      <header>
        <div className="anuncio" aria-hidden="true">
          <div className="anuncio-in">
            {[0, 1].map(v => (
              <span key={v}>ENVÍO GRATIS A TODO EL PAÍS<i>●</i> 100% ORIGINALES CON GARANTÍA DOBLE<i>●</i> DROP 001 ABIERTO<i>●</i> CUOTAS + DESCUENTO POR TRANSFERENCIA<i>●</i></span>
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
            <NavLink to="/catalogo" className={({ isActive }) => isActive ? 'activa' : ''}>Catálogo</NavLink>
            <Link to="/catalogo?canal=WEB">La Caja Fuerte</Link>
            <a href="/#por-que">Por qué nosotros</a>
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
