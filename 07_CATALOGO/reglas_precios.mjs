// Reglas de precios RICHARD LENS (definidas por Juani 20-jul-2026: banda ARS $120.000–$550.000,
// competitivos contra el mercado relevado en ANALISIS_MERCADO.md).
//
// Benchmarks jul-2026: gafasonline RB $246-270k · MELI RB $280-530k · polarizados $450k+ ·
// lens.com.ar Wayfarer $369k. Estrategia: RB estándar ABAJO de gafasonline (volumen,
// "el original más barato"), polarizados muy abajo del mercado, collabs/LUX con margen entero.
//
// precio_ml lleva el sobreprecio para bancar la comisión MELI (20-30%). LUX jamás a MELI (ml: 0).

export function precioPara(marca, modelo, forma) {
  const m = (modelo || '').toLowerCase();

  if (marca === 'Louis Vuitton')
    return (m.includes('millonaire') || m.includes('millionaire') || m.includes('cyclone'))
      ? { web: 549900, ml: 0 }   // los íconos: tope de banda
      : { web: 499900, ml: 0 };
  if (marca === 'Cartier') return { web: 529900, ml: 0 };     // tope lujo junto a LV
  if (marca === 'Off-White') return { web: 449900, ml: 0 };   // hype collab
  if (marca === 'Dior' || marca === 'Prada' || marca === 'Gucci') return { web: 449900, ml: 0 };
  if (['Miu Miu', 'Celine', 'Tom Ford', 'Saint Laurent', 'Balenciaga', 'Fendi'].includes(marca))
    return { web: 429900, ml: 0 };
  if (marca === 'Versace' || marca === 'Dolce & Gabbana') return { web: 399900, ml: 0 };
  if (marca === 'Ray-Ban · Ferrari' || marca === 'Ray-Ban · A$AP Rocky')
    return { web: 329900, ml: 379900 };                       // collabs RB
  if (marca === 'Oakley') return { web: 219900, ml: 259900 }; // apenas abajo de RB
  if (marca === 'Oscar Wylee' || marca === 'Amore Fashion') return { web: 149900, ml: 179900 }; // entrada
  if (marca === 'RICH') return { web: 0, ml: 0 };             // línea propia: precio al lanzar el drop

  // Ray-Ban por línea
  if (forma === 'armazón recetado') return { web: 169900, ml: 199900 };
  if (m.includes('polarizado')) return { web: 299900, ml: 349900 };       // mercado: $450k+
  if (/espejad|rareprint|fleck|double bridge|blaze|folding|carbon|titanio/.test(m))
    return { web: 249900, ml: 289900 };                       // terminaciones especiales
  return { web: 229900, ml: 269900 };                         // clásico: abajo de gafasonline ($246k)
}
