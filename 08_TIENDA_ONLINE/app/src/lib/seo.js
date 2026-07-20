/* seo.js — metas dinámicas + JSON-LD por página (Google renderiza JS: esto alcanza
 * para indexar bien cada producto y categoría una vez deployado en dominio real). */

export function setSeo({ titulo, descripcion, jsonld }) {
  if (titulo) document.title = titulo;
  if (descripcion) {
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
    m.content = descripcion;
  }
  let s = document.getElementById('jsonld');
  if (jsonld) {
    if (!s) { s = document.createElement('script'); s.id = 'jsonld'; s.type = 'application/ld+json'; document.head.appendChild(s); }
    s.textContent = JSON.stringify(jsonld);
  } else if (s) s.remove();
}

export function jsonldProducto(p, cfg) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Anteojos ${p.marca} ${p.modelo}`,
    brand: { '@type': 'Brand', name: p.marca.split(' · ')[0] },
    description: p.descripcion,
    sku: p.codigo,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ARS',
      price: p.precio_web || undefined,
      availability: p.estado === 'disponible' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition'
    }
  };
}

export const jsonldNegocio = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Richard Lens & Co.',
  description: 'Eyewear house argentina: anteojos de sol y armazones 100% originales — Ray-Ban, Dior, Prada, Louis Vuitton, Cartier — con garantía doble y envíos a todo el país.',
  currenciesAccepted: 'ARS',
  paymentAccepted: 'Tarjeta de crédito, transferencia',
  areaServed: 'AR'
};
