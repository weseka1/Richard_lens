import React, { useState, useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { estadoAuth, whoami, login, crearCuenta, setClaveAdmin } from '../lib/api.js';
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

/* Portón de entrada: si el server tiene ADMIN_KEY activo, exige cuenta.
 * - Sin cuenta creada → formulario "crear cuenta" (autoriza con la llave maestra).
 * - Con cuenta → login usuario + contraseña.
 * - Sin ADMIN_KEY → pasa directo (modo blando). */
function Login({ onEntrar }) {
  const [modo, setModo] = useState('cargando'); // cargando | login | crear
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [maestra, setMaestra] = useState('');
  const [err, setErr] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      const est = await estadoAuth();
      if (!est.authOn) return onEntrar('admin');        // auth apagada → entra
      const u = await whoami();
      if (u) return onEntrar(u);                          // token válido → entra
      setModo(est.existe ? 'login' : 'crear');
    })();
  }, []);

  async function submit(e) {
    e.preventDefault(); setErr(''); setEnviando(true);
    try {
      const j = modo === 'crear' ? await crearCuenta(usuario, password, maestra) : await login(usuario, password);
      onEntrar(j.usuario);
    } catch (ex) { setErr(ex.message); setEnviando(false); }
  }

  if (modo === 'cargando') return <div className="login-fondo"><div className="login-caja"><p className="ayuda">Cargando…</p></div></div>;

  return (
    <div className="login-fondo">
      <form className="login-caja" onSubmit={submit}>
        <div className="login-logo"><b>RICHARD</b> LENS<span>panel</span></div>
        <h2>{modo === 'crear' ? 'Creá tu cuenta' : 'Iniciar sesión'}</h2>
        {modo === 'crear' && (
          <p className="ayuda">Primera vez. Elegí tu usuario y contraseña. Para autorizar, pegá la <b>llave maestra</b> (la que pusiste en ADMIN_KEY en Render).</p>
        )}
        <label>Usuario
          <input value={usuario} onChange={e => setUsuario(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label>Contraseña
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} />
        </label>
        {modo === 'crear' && (
          <label>Llave maestra (ADMIN_KEY)
            <input type="password" value={maestra} onChange={e => setMaestra(e.target.value)} />
          </label>
        )}
        {err && <p className="login-err">{err}</p>}
        <button className="btn-oro" type="submit" disabled={enviando}>
          {enviando ? 'Un segundo…' : (modo === 'crear' ? 'Crear cuenta y entrar' : 'Entrar')}
        </button>
      </form>
    </div>
  );
}

export default function Panel() {
  const [usuario, setUsuario] = useState(null);
  if (!usuario) return <Login onEntrar={setUsuario} />;

  const salir = () => { setClaveAdmin(''); setUsuario(null); };

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
        <div className="side-sesion">
          <span className="side-user">👤 {usuario}</span>
          <button className="side-salir" onClick={salir}>Cerrar sesión</button>
        </div>
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
