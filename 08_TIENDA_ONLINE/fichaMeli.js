/* Ficha técnica de MercadoLibre para la categoría MLA417128 (Anteojos de Sol).
 *
 * MELI puntúa la "calidad" de la publicación por atributos completos, y con
 * calidad baja te muestra último aunque tengas el mejor precio. Pero solo cuenta
 * los valores que están en SU lista: si le mandás "Acetato" donde espera
 * "Plástico", lo descarta en silencio y la ficha queda igual de pobre.
 *
 * Por eso acá está el vocabulario real de la categoría, traducido desde cómo
 * nombramos las cosas nosotros. Verificado contra
 * GET /categories/MLA417128/attributes.
 */

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/* La paleta cerrada de MELI. Lo que no entra acá, no se manda. */
const COLORES = {
  negro: 'Negro', carey: 'Marrón', havana: 'Marrón', tortoise: 'Marrón',
  marron: 'Marrón', 'marron claro': 'Marrón claro', 'marron oscuro': 'Marrón oscuro',
  chocolate: 'Chocolate', bordo: 'Bordó', borgona: 'Bordó',
  dorado: 'Dorado', oro: 'Dorado', gold: 'Dorado', bronce: 'Dorado oscuro',
  plateado: 'Plateado', plata: 'Plateado', silver: 'Plateado',
  gunmetal: 'Gris oscuro', grafito: 'Gris oscuro', gris: 'Gris',
  blanco: 'Blanco', crema: 'Crema', beige: 'Beige', nude: 'Nude',
  azul: 'Azul', 'azul claro': 'Azul claro', 'azul oscuro': 'Azul oscuro',
  'azul marino': 'Azul marino', celeste: 'Celeste', cian: 'Cian', turquesa: 'Turquesa',
  verde: 'Verde', 'verde claro': 'Verde claro', 'verde oscuro': 'Verde oscuro',
  'verde lima': 'Verde lima', caqui: 'Caqui',
  rojo: 'Rojo', coral: 'Coral', naranja: 'Naranja', 'naranja oscuro': 'Naranja oscuro',
  amarillo: 'Amarillo', ocre: 'Ocre', terracota: 'Terracota',
  rosa: 'Rosa', 'rosa claro': 'Rosa claro', fucsia: 'Fucsia',
  violeta: 'Violeta', lila: 'Lila', lavanda: 'Lavanda',
};

/* Palabras que describen el acabado, no el color: hay que sacarlas antes de
 * buscar en la paleta ("marron degrade" → "marron"). */
const ACABADOS = /\b(degrade|degradado|liso|espejad[oa]|espejo|polarizad[oa]|fotocromatic[oa]|mate|brillante|transparente|marmolado|translucid[oa])\b/g;

function aColorMeli(txt) {
  const limpio = norm(txt).replace(ACABADOS, ' ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!limpio) return null;
  if (COLORES[limpio]) return COLORES[limpio];
  // "negro dorado" o "carey dorado": el primer color es el que manda
  for (const palabra of limpio.split(' ')) if (COLORES[palabra]) return COLORES[palabra];
  return null;
}

function tratamiento(txt) {
  const c = norm(txt);
  const espejo = /espejad|espejo/.test(c), degrade = /degrade/.test(c);
  if (espejo && degrade) return 'Espejada/Degradada';
  if (espejo) return 'Espejada';
  if (degrade) return 'Degradé';
  return 'Clásica';
}

/* "Standard (51-21-140)" es nomenclatura de óptica: ancho de lente, puente y
 * varilla en mm. Es justo lo que MELI pide, y ya lo teníamos escrito. */
function medidas(talle) {
  const m = /\((\d{2})\s*[-–]\s*(\d{2})(?:\s*[-–]\s*(\d{2,3}))?\s*\)/.exec(String(talle || ''));
  return m ? { ancho: +m[1], puente: +m[2], varilla: m[3] ? +m[3] : null } : null;
}

const FORMAS = {
  aviador: 'Ovalada', cats: 'Ovalada', ovalado: 'Ovalada',
  redondo: 'Redonda', round: 'Redonda',
  wayfarer: 'Rectangular', clubmaster: 'Rectangular', cuadrado: 'Rectangular',
  rectangular: 'Rectangular', deportivo: 'Rectangular',
};

/* Nombres de línea reales del fabricante: estos sí le sirven al comprador y
 * los busca por nombre. "lujo" o "collab" son etiquetas nuestras de catálogo —
 * publicarlas como línea es ruido en la ficha, así que no van a ningún lado. */
const LINEAS = { clubmaster: 'Clubmaster', wayfarer: 'Wayfarer', blaze: 'Blaze', 'bio-based': 'Bio-Based', highstreet: 'Highstreet' };

function ficha(producto) {
  const attrs = [];
  const poner = (id, v) => { if (v != null && v !== '') attrs.push({ id, value_name: String(v) }); };

  const variantes = producto.variantes || [];
  const marca = String(producto.marca || '').split(' · ')[0].trim();

  // la primera variante que tenga un color de verdad ("Color" es un placeholder)
  const v = variantes.find(x => aColorMeli(x.color)) || variantes[0] || {};
  const [armazonTxt, lenteTxt] = String(v.color || producto.color || '').split('/');

  poner('BRAND', marca);
  poner('MODEL', producto.modelo);
  poner('DETAILED_MODEL', [marca, producto.modelo].filter(Boolean).join(' '));
  poner('GENDER', /mujer|femen/i.test(producto.genero) ? 'Mujer'
    : /hombre|masc/i.test(producto.genero) ? 'Hombre' : 'Sin género');

  const armazon = aColorMeli(armazonTxt);
  poner('FRAME_COLOR', armazon);
  poner('TEMPLE_COLOR', armazon);
  poner('COLOR', armazon);
  // sin dato propio, la lente sigue al armazón solo en los casos sin ambigüedad
  poner('LENS_COLOR', aColorMeli(lenteTxt) || (/negro|carey|marron|gris/.test(norm(armazonTxt)) ? armazon : null));

  const mat = norm(producto.material);
  poner('FRAME_MATERIAL', /^metal|titan|acero|alumin/.test(mat) ? 'Metal' : 'Plástico');
  poner('LENS_MATERIAL', 'Policarbonato');
  poner('LENS_TREATMENT', tratamiento(v.color));
  if (/espejad|espejo/.test(norm(v.color))) poner('DESIGN', 'Espejo');

  const polarizada = /polariz/i.test(`${producto.modelo} ${v.color} ${producto.cristal || ''}`);
  poner('WITH_POLARIZED_LENS', polarizada ? 'Sí' : 'No');
  poner('WITH_UV_PROTECTION', 'Sí');

  const f = norm(producto.forma);
  poner('LINE', LINEAS[f]);
  poner('FRAME_SHAPE', FORMAS[f]);
  /* Un montón de modelos de lujo llevan la forma en el nombre ("Ski Rectangle",
   * "Sleek Square", "Signature Round", "Cat Eye Acetate"): es dato del
   * fabricante, no una suposición nuestra. */
  if (!attrs.some(a => a.id === 'FRAME_SHAPE')) {
    const t = norm(`${producto.modelo} ${producto.forma || ''}`);
    const deducida = /round|redond|circle/.test(t) ? 'Redonda'
      : /rectang|square|cuadrad|d.?frame|shield|wayfar|club|mask/.test(t) ? 'Rectangular'
      : /cat.?eye|oval|aviator|aviad|pilot|butterfly|mariposa/.test(t) ? 'Ovalada'
      : null;
    poner('FRAME_SHAPE', deducida);
  }

  // el talle puede estar en cualquier variante, no siempre en la primera
  const med = medidas(v.talle) || medidas(variantes.find(x => medidas(x.talle))?.talle);
  poner('SIZE', 'Standard');
  if (med) {
    poner('LENS_WIDTH', `${med.ancho} mm`);
    poner('BRIDGE_LENGTH', `${med.puente} mm`);
    if (med.varilla) poner('TEMPLE_LENGTH', `${med.varilla} mm`);
  }

  // sin código de barras hay que declarar el motivo o la ficha queda incompleta
  poner('EMPTY_GTIN_REASON', 'El producto no tiene código registrado');
  poner('VALUE_ADDED_TAX', '21 %');

  return attrs;
}

/* Cruza el título de una publicación contra el catálogo.
 *
 * No sirve buscar el modelo como texto exacto: MELI corta el título en 60
 * caracteres, así que "Fs Fendi Sky Round" sale como "Fs Sky Round" y
 * "My Monogram Soft Cat Eye Sunglasses" pierde el final. Por eso se compara
 * palabra por palabra y alcanza con que esté la mayoría.
 */
function cruzar(titulo, productos) {
  const palabras = new Set(norm(titulo).split(/\s+/).filter(Boolean));
  const compactoTitulo = norm(titulo).replace(/\s+/g, '');
  let mejor = null, mejorPuntaje = 0;

  for (const p of productos) {
    if (!p.modelo) continue;
    const marca = norm(String(p.marca || '').split(' · ')[0]).split(/\s+/).filter(Boolean);
    if (!marca.every(m => palabras.has(m))) continue;

    const tokens = norm(p.modelo).split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    let aciertos = tokens.filter(t => palabras.has(t)).length;

    /* Algunos modelos traen la marca pegada ("Big Fendigraphy"), y el título
     * la separa para no repetirla ("Fendi Big Graphy"). Sacándole la marca al
     * modelo, lo que queda sí aparece pegado en el título. */
    if (aciertos < tokens.length) {
      const sinMarca = tokens.map(t => marca.reduce((s, m) => s.replace(m, ''), t)).join('');
      if (sinMarca.length >= 5 && compactoTitulo.includes(sinMarca)) aciertos = tokens.length;
    }

    // exigimos mayoría del modelo para no confundir "SL001" con "SL011"
    if (aciertos / tokens.length < 0.6) continue;

    // ante empate gana el modelo más específico (más palabras reconocidas)
    const puntaje = aciertos + aciertos / tokens.length;
    if (puntaje > mejorPuntaje) { mejorPuntaje = puntaje; mejor = p; }
  }
  return mejor;
}

module.exports = { ficha, cruzar, aColorMeli, medidas, tratamiento };
