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

/* Revela .reveal y .card cuando entran al viewport; re-observa cuando cambia `dep`.
 *
 * El efecto es decorativo, así que NUNCA puede dejar contenido ilegible: los
 * elementos nacen desenfocados y si el observador no llega a dispararse
 * (viewport raro, scroll suave, cambio de página, celular lento) quedaban
 * borrosos para siempre. Por eso el temporizador de seguridad. */
export function useReveals(dep) {
  useEffect(() => {
    const mostrar = el => { el.classList.add('visible'); };
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { mostrar(e.target); io.unobserve(e.target); }
    }), { threshold: 0.05, rootMargin: '120px 0px' });

    const pendientes = () => document.querySelectorAll('.reveal:not(.visible), .card:not(.visible)');

    // dos pasadas: una ya y otra en el frame siguiente, porque las imágenes
    // del catálogo cambian el layout después del primer render
    const observar = () => pendientes().forEach(el => io.observe(el));
    observar();
    const raf = requestAnimationFrame(observar);

    // red de seguridad: pase lo que pase, a los 900 ms se ve todo
    const red = setTimeout(() => pendientes().forEach(mostrar), 900);

    return () => { io.disconnect(); clearTimeout(red); cancelAnimationFrame(raf); };
  }, [dep]);
}
