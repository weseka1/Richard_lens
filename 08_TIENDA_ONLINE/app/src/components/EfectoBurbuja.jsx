import { useEffect } from 'react';

/* El viaje de scroll: cada sección se INFLA como burbuja mientras se acerca al centro
 * de la pantalla y se desinfla al alejarse — continuo, ligado al scroll (con Lenis
 * queda como vidrio deslizándose). Sin librerías: rAF + getBoundingClientRect. */

const SELECTOR = '.grid-categorias, .grid-productos, .promo-banner, .grid-confianza, .pasos, .faq, .news-in, .ig-telefono, .cta-panel, .rich3d-texto, .seo-bloque';

export default function EfectoBurbuja() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let vivo = true;
    let elementos = [];
    const recolectar = () => { elementos = [...document.querySelectorAll(SELECTOR)]; };
    recolectar();
    const observer = new MutationObserver(recolectar);
    observer.observe(document.body, { childList: true, subtree: true });

    const frame = () => {
      if (!vivo) return;
      const vh = innerHeight;
      for (const el of elementos) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        const centro = r.top + r.height / 2;
        const distancia = Math.abs(centro - vh / 2) / (vh * 0.85);
        const t = Math.max(0, 1 - Math.min(1, distancia));          // 1 = en el centro
        const suave = t * t * (3 - 2 * t);                          // smoothstep
        const escala = 0.93 + 0.07 * suave;                         // se infla hasta 1
        el.style.transform = `scale(${escala})`;
        el.style.opacity = String(0.55 + 0.45 * suave);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return () => { vivo = false; observer.disconnect(); };
  }, []);
  return null;
}
