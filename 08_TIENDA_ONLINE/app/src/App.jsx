import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import TiendaLayout from './components/TiendaLayout.jsx';
import Home from './pages/Home.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Producto from './pages/Producto.jsx';

// el panel se carga aparte: el cliente nunca baja ese código
const Panel = lazy(() => import('./panel/Panel.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<TiendaLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/producto/:id" element={<Producto />} />
      </Route>
      <Route
        path="/panel/*"
        element={
          <Suspense fallback={<div style={{ padding: 40, color: '#F2EDE3' }}>Cargando panel…</div>}>
            <Panel />
          </Suspense>
        }
      />
      <Route path="*" element={<TiendaLayout />}>
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
