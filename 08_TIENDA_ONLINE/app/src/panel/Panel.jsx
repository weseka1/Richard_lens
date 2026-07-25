import React, { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { claveAdmin } from '../lib/api.js';
import Tablero from './Tablero.jsx';
import Productos from './Productos.jsx';
import Ventas from './Ventas.jsx';
import Consultas from './Consultas.jsx';
import ConfigView from './ConfigView.jsx';
import Meli from './Meli.jsx';

const LINKS = [
  ['', 'Tablero'],
  ['productos', 'Productos'],
  ['ventas', 'Ventas'],
  ['meli', 'MercadoLibre'],
  ['consultas', 'Consultas'],
  ['config', 'Config']
];

export default function Panel() {
  const [clave, setClave] = useState(claveAdmin());
  const guardarClave = v => {
    setClave(v);
    try { v ? localStorage.setItem('rl_admin_key', v) : localStorage.removeItem('rl_admin_key'); } catch {}
  };
  return (
    <div className="panel-root">
      <aside className="sidebar">
        <div className="side-logo"><b>RICH</b>ARD LENS<span>panel</span></div>
        <nav>
          {LINKS.map(([ruta, nombre]) => (
            <NavLink
              key={ruta}
              to={'/panel' + (ruta ? '/' + ruta : '')}
              end={ruta === ''}
              className={({ isActive }) => 'side-link' + (isActive ? ' activo' : '')}
            >{nombre}</NavLink>
          ))}
        </nav>
        {/* llave de admin: pegala una vez (la misma que pusiste en ADMIN_KEY en
            Render). Queda guardada en este navegador. Sin ADMIN_KEY no hace falta. */}
        <label className="side-clave">
          <span>🔑 Llave de admin</span>
          <input type="password" value={clave} placeholder="solo si activaste ADMIN_KEY"
            onChange={e => guardarClave(e.target.value.trim())} autoComplete="off" />
        </label>
        <a className="side-tienda" href="/" target="_blank" rel="noopener noreferrer">Ver la tienda →</a>
      </aside>
      <main>
        <Routes>
          <Route index element={<Tablero />} />
          <Route path="productos" element={<Productos />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="meli" element={<Meli />} />
          <Route path="consultas" element={<Consultas />} />
          <Route path="config" element={<ConfigView />} />
        </Routes>
      </main>
    </div>
  );
}
