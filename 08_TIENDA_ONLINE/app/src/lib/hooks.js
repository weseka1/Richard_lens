import { useEffect, useState } from 'react';
import { getConfig, getProductos } from './api.js';

export function useConfig() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => { getConfig().then(setCfg); }, []);
  return cfg;
}

export function useProductos() {
  const [productos, setProductos] = useState(null);
  useEffect(() => { getProductos().then(setProductos); }, []);
  return productos;
}

/* revela .reveal y .card cuando entran al viewport; re-observa cuando cambia `dep` */
export function useReveals(dep) {
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll('.reveal:not(.visible), .card:not(.visible)').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}
