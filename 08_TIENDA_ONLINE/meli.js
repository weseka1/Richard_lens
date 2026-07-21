/*
 * Conector MercadoLibre (API oficial) — OAuth + publicar + preguntas + órdenes.
 * Config: Panel → MercadoLibre. Credenciales en data/meli.json (fuera de la tienda pública).
 * Reglas de negocio: SOLO productos canal ML+WEB (el lujo jamás), precio_ml > 0, con fotos.
 */
const fs = require('fs');
const path = require('path');

const DATA = p => path.join(__dirname, 'data', p);
const FOTOS_DIR = path.join(__dirname, '..', '07_CATALOGO', 'imagenes');
const API = 'https://api.mercadolibre.com';
/* MELI rechaza localhost: el callback tiene que ser un dominio público con HTTPS.
 * Sale de PUBLIC_URL (Render lo inyecta) o de dominio en config.json. */
const baseUrl = () => {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  try { return (JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'config.json'), 'utf8')).dominio || '').replace(/\/$/, ''); }
  catch { return ''; }
};
const REDIRECT_PATH = '/api/meli/callback';
const redirect = () => (baseUrl() || 'http://localhost:5250') + REDIRECT_PATH;

const supa = require('./supa.js');

/* Los tokens viven en Supabase, no en el disco: Render borra el disco en cada
 * deploy y se perdía la conexión. Cache en memoria para no pegarle a la base
 * en cada request. */
let tokensNube = null, tokensLeidos = false;
async function tokensDeLaNube() {
  if (tokensLeidos) return tokensNube;
  tokensLeidos = true;
  if (!supa.activo()) return null;
  try { tokensNube = await supa.secretoGet('meli_tokens'); }
  catch (e) { console.error('[meli] no pude leer tokens de la nube:', e.message); }
  return tokensNube;
}
function guardarTokens(t) {
  tokensNube = t; tokensLeidos = true;
  if (supa.activo()) supa.secretoSet('meli_tokens', t).catch(e => console.error('[meli] no pude guardar tokens:', e.message));
}

const leerArchivo = (a, fb) => { try { return JSON.parse(fs.readFileSync(DATA(a), 'utf8')); } catch { return fb; } };
/* En la nube meli.json no viaja (está gitignoreado): las credenciales entran
 * por variables de entorno y los tokens se guardan en el disco del servidor. */
const leer = (a, fb) => {
  const d = leerArchivo(a, fb);
  if (a !== 'meli.json') return d;
  const c = d && typeof d === 'object' ? d : {};
  return {
    ...c,
    app_id: c.app_id || process.env.MELI_APP_ID || '',
    secret: c.secret || process.env.MELI_SECRET || ''
  };
};
const guardar = (a, d) => fs.writeFileSync(DATA(a), JSON.stringify(d, null, 2), 'utf8');
const json = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};
const body = req => new Promise((ok, err) => {
  let b = '';
  req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); });
  req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { err(e); } });
});

// ---------- tokens ----------
/* Los busca en el disco (local) y si no, en la nube (Render). */
async function tokensActuales() {
  const cfg = leer('meli.json', {});
  return cfg.tokens || await tokensDeLaNube();
}

async function token() {
  const cfg = leer('meli.json', {});
  const tk = await tokensActuales();
  if (!tk) throw new Error('MELI no conectado');
  if (Date.now() < (tk.expira || 0) - 60000) return tk.access_token;
  const r = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token', client_id: cfg.app_id,
      client_secret: cfg.secret, refresh_token: tk.refresh_token
    })
  });
  if (!r.ok) throw new Error('No se pudo refrescar el token (' + r.status + ') — reconectá desde el panel');
  const t = await r.json();
  const nuevos = { access_token: t.access_token, refresh_token: t.refresh_token, user_id: t.user_id, expira: Date.now() + t.expires_in * 1000 };
  cfg.tokens = nuevos;
  guardar('meli.json', cfg);
  guardarTokens(nuevos);
  return t.access_token;
}

async function api(ruta, metodo = 'GET', datos) {
  const t = await token();
  const r = await fetch(API + ruta, {
    method: metodo,
    headers: { 'Authorization': `Bearer ${t}`, ...(datos ? { 'Content-Type': 'application/json' } : {}) },
    body: datos ? JSON.stringify(datos) : undefined
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) {
    // MELI manda el detalle real en cause[]: sin esto solo se ve
    // "Validation error" y no hay forma de saber qué campo falló
    const causas = (out.cause || []).map(c => c.message || c.code || JSON.stringify(c)).join(' | ');
    throw new Error(`${out.message || r.status}${causas ? ' → ' + causas : ''}`);
  }
  return out;
}

// ---------- publicar ----------
const STOCK_VIVO = v => v.stock === 'STOCK' || v.stock === 'POCO STOCK';
const TOPE_STOCK = 5;   // conservador a propósito: una cancelación por falta de
                        // stock te funde la reputación, y somos dropshipping

/* Devuelve las fotos usables ordenadas: la portada (00_) primero.
 * Descarta las que la auditoría marcó como ajenas al modelo. */
function fotosDe(fotoCodigo) {
  const original = path.join(FOTOS_DIR, fotoCodigo);
  // preparar_fotos_meli.mjs deja acá las versiones 1200x1200 sobre blanco,
  // que son las que habilitan el zoom de MELI. Si no existen, van las crudas.
  const listas = path.join(original, 'meli');
  const dir = fs.existsSync(listas) ? listas : original;
  let files = [];
  try {
    files = fs.readdirSync(dir)
      .filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('_'))
      .sort();
  } catch {}
  let mapa = {};
  try { mapa = JSON.parse(fs.readFileSync(path.join(original, 'fotos.json'), 'utf8')); } catch {}
  // el mapa color→foto usa los nombres originales; acá los archivos pueden
  // haber pasado de .png a .jpg, así que comparamos por nombre sin extensión
  const sinExt = n => n.replace(/\.[^.]+$/, '');
  const mapaNorm = {};
  for (const [k, v] of Object.entries(mapa)) mapaNorm[sinExt(k)] = v;
  return { dir, files: files.slice(0, 12), mapa: mapaNorm, sinExt };
}

/* Sube cada archivo y devuelve archivo → picture_id, para poder asignarle
 * a cada variante de color SUS fotos (MELI lo permite: defines_picture). */
async function subirFotos(dir, files) {
  const t = await token();
  const ids = {};
  for (const f of files) {
    const buf = fs.readFileSync(path.join(dir, f));
    const fd = new FormData();
    fd.append('file', new Blob([buf]), f);
    const r = await fetch(`${API}/pictures/items/upload`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${t}` }, body: fd
    });
    if (r.ok) { const j = await r.json(); ids[f] = j.id; }
  }
  return ids;
}

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function armarTitulo(producto, sufijo = '') {
  const marca = producto.marca.split(' · ')[0];
  const base = `Anteojos De Sol ${marca} ${producto.modelo}`;
  const full = sufijo ? `${base} ${sufijo}` : `${base} Originales`;
  return full.length <= 60 ? full : base.slice(0, 60);
}

/**
 * Publica en MELI con VARIANTES reales de color: el comprador elige el color
 * dentro de la publicación en vez de preguntarlo. Es lo que pide la política
 * (una publicación = un producto) y además convierte mucho mejor.
 *
 * opciones: { precio, titulo, stockMax, listing }
 */
async function publicar(producto, cfgTienda, opciones = {}) {
  if (producto.canal === 'WEB') throw new Error('Producto solo-web (lujo): jamás va a MELI');
  if (!producto.fotos_ok) throw new Error('Fotos sin revisar — marcalas en el panel antes de publicar');

  const precio = Number(opciones.precio || producto.precio_ml);
  if (!precio) throw new Error('Sin precio MELI cargado');

  const { dir, files, mapa, sinExt } = fotosDe(producto.foto_codigo);
  if (!files.length) throw new Error('Sin fotos locales para subir');

  const disc = await api(`/sites/MLA/domain_discovery/search?q=${encodeURIComponent(`${producto.marca} ${producto.modelo} anteojos de sol`)}&limit=1`);
  const category_id = disc[0]?.category_id || 'MLA417128';   // Anteojos de Sol

  const subidas = await subirFotos(dir, files);
  const pictures = files.filter(f => subidas[f]).map(f => ({ id: subidas[f] }));
  if (!pictures.length) throw new Error('MELI rechazó todas las fotos');

  const base = {
    title: opciones.titulo || armarTitulo(producto),
    category_id,
    currency_id: 'ARS',
    buying_mode: 'buy_it_now',
    listing_type_id: opciones.listing || 'gold_special',
    condition: 'new',
    pictures,
    attributes: [
      { id: 'BRAND', value_name: producto.marca.split(' · ')[0] },
      { id: 'MODEL', value_name: producto.modelo },
      { id: 'GENDER', value_name: 'Sin género' }
    ],
    sale_terms: [
      { id: 'WARRANTY_TYPE', value_name: 'Garantía del vendedor' },
      { id: 'WARRANTY_TIME', value_name: '30 días' }
    ],
    shipping: { mode: 'me2', local_pick_up: false }
  };

  /* Una variante por color, PERO solo con los colores que tienen foto propia.
   * MELI rechaza la publicación si dos variantes comparten la misma foto
   * (COLOR es defines_picture), y además mostrarle al comprador un color con
   * la foto de otro es pedir un reclamo. Los colores sin foto no se publican. */
  const tope = Number(opciones.stockMax || TOPE_STOCK);
  const usadas = new Set();
  const conFoto = [];
  for (const v of (producto.variantes || []).filter(STOCK_VIVO)) {
    if (conFoto.some(x => x.color === v.color)) continue;
    const suyas = files
      .filter(f => norm(mapa[sinExt(f)]) === norm(v.color))
      .map(f => subidas[f])
      .filter(id => id && !usadas.has(id));
    if (!suyas.length) continue;
    suyas.forEach(id => usadas.add(id));
    conFoto.push({ color: v.color, sku: v.sku, stock: v.stock, fotos: suyas });
  }

  if (conFoto.length > 1) {
    base.variations = conFoto.map(c => ({
      attribute_combinations: [{ id: 'COLOR', value_name: c.color }],
      available_quantity: Math.min(c.stock === 'POCO STOCK' ? 2 : tope, tope),
      price: precio,
      picture_ids: c.fotos,
      attributes: c.sku ? [{ id: 'SELLER_SKU', value_name: String(c.sku) }] : []
    }));
  } else {
    // un solo color con fotos: publicación simple, sin variantes
    base.price = precio;
    base.available_quantity = Math.min(Math.max(1, producto.stock || 1), tope);
    const solo = conFoto[0];
    if (solo) base.attributes.push({ id: 'COLOR', value_name: solo.color });
  }

  const item = await api('/items', 'POST', base);

  await api(`/items/${item.id}/description`, 'POST', {
    plain_text:
`${producto.marca.split(' · ')[0]} ${producto.modelo} — 100% ORIGINAL

QUÉ RECIBÍS
Anteojos originales con estuche rígido, paño de microfibra y papelería
de la marca. Grabados de fábrica en cristal y varilla, verificables.

PROTECCIÓN
Cristales con filtro UV400.

GARANTÍA
30 días de garantía del vendedor. Si el producto no es original,
te devolvemos el doble de lo que pagaste.

CAMBIOS
Si no te queda cómodo, lo cambiás dentro de los 30 días.

ENVÍO
A todo el país con seguimiento. Te pasamos el código apenas despachamos.

${colores.length > 1 ? 'Elegí tu color arriba, en las opciones de la publicación.' : ''}

RICHARD LENS & CO. — Eyewear House`.replace(/\n{3,}/g, '\n\n')
  });

  return { id: item.id, permalink: item.permalink, variantes: colores.length };
}

// ---------- inteligencia de mercado ----------
/* Radiografía de la competencia para un modelo: dónde está el piso real del
 * mercado, dónde la mediana, y quiénes venden de verdad (no el que publicó
 * caro y nunca vendió). Con esto se arman los escalones de precio. */
async function mercado(q, limite = 50) {
  const r = await api(`/sites/MLA/search?q=${encodeURIComponent(q)}&limit=${limite}`);
  const items = (r.results || []).filter(i => i.price > 0);
  if (!items.length) return { q, total: 0, items: [] };

  const precios = items.map(i => i.price).sort((a, b) => a - b);
  const pct = p => precios[Math.min(precios.length - 1, Math.floor(precios.length * p))];

  // los que efectivamente mueven mercadería mandan más que los que solo publican
  const vendedores = [...items].sort((a, b) => (b.sold_quantity || 0) - (a.sold_quantity || 0)).slice(0, 10);
  const conVentas = items.filter(i => (i.sold_quantity || 0) > 0);
  const preciosQueVenden = conVentas.map(i => i.price).sort((a, b) => a - b);

  return {
    q,
    total: r.paging?.total || items.length,
    analizados: items.length,
    precio: {
      min: precios[0],
      p25: pct(0.25),
      mediana: pct(0.5),
      p75: pct(0.75),
      max: precios[precios.length - 1]
    },
    // el precio al que se vende de verdad, que es el que importa
    medianaQueVende: preciosQueVenden.length
      ? preciosQueVenden[Math.floor(preciosQueVenden.length / 2)]
      : null,
    conVentas: conVentas.length,
    envioGratisPct: Math.round(items.filter(i => i.shipping?.free_shipping).length * 100 / items.length),
    fullPct: Math.round(items.filter(i => i.shipping?.logistic_type === 'fulfillment').length * 100 / items.length),
    top: vendedores.map(i => ({
      titulo: i.title,
      precio: i.price,
      vendidos: i.sold_quantity || 0,
      envioGratis: !!i.shipping?.free_shipping,
      link: i.permalink
    }))
  };
}

// ---------- handler ----------
async function handler(req, res, urlObj) {
  const p = urlObj.pathname;
  const cfg = leer('meli.json', {});

  try {
    if (p === '/api/meli/estado') {
      let user = null;
      const tk = await tokensActuales();
      if (tk) { try { user = (await api('/users/me')).nickname; } catch {} }
      return json(res, 200, { configurada: !!cfg.app_id, conectada: !!tk && !!user, user });
    }

    if (p === '/api/meli/config' && req.method === 'POST') {
      const b = await body(req);
      guardar('meli.json', { ...cfg, app_id: (b.app_id || '').trim(), secret: (b.secret || '').trim() });
      return json(res, 200, { ok: true });
    }

    if (p === '/api/meli/mercado') {
      const q = urlObj.searchParams.get('q');
      if (!q) return json(res, 400, { error: 'falta q' });
      try { return json(res, 200, await mercado(q, Number(urlObj.searchParams.get('limit')) || 50)); }
      catch (e) { return json(res, 500, { error: e.message }); }
    }

    /* Las publicaciones que YA existen en la cuenta, con sus métricas.
     * Una pausada que ya vendió vale oro: conserva ranking, preguntas y
     * reputación. Reactivarla vende mucho antes que publicar de cero. */
    if (p === '/api/meli/mis-items') {
      const me = await api('/users/me');
      const ids = new Set();
      const porEstado = {};
      // "all" no es un status válido en MELI: hay que pedir cada uno.
      // Sin parámetro sólo devuelve las activas, y las pausadas son justo
      // las que nos interesan rescatar.
      for (const st of ['', 'active', 'paused', 'closed', 'under_review', 'inactive']) {
        let offset = 0;
        for (;;) {
          let r;
          try { r = await api(`/users/${me.id}/items/search?limit=100&offset=${offset}${st ? '&status=' + st : ''}`); }
          catch { break; }
          const res_ = r.results || [];
          res_.forEach(x => ids.add(x));
          porEstado[st || 'default'] = r.paging?.total ?? res_.length;
          offset += 100;
          if (res_.length < 100 || offset >= (r.paging?.total || 0) || offset >= 500) break;
        }
      }
      if (!ids.size) return json(res, 200, { total: 0, items: [], diagnostico: { usuario: me.nickname, user_id: me.id, porEstado } });

      const listaIds = [...ids];
      const items = [];
      for (let i = 0; i < listaIds.length; i += 20) {
        const lote = await api(`/items?ids=${listaIds.slice(i, i + 20).join(',')}`);
        for (const x of lote) {
          const b = x.body || {};
          items.push({
            id: b.id, titulo: b.title, precio: b.price, estado: b.status,
            subestado: (b.sub_status || []).join(','),
            vendidos: b.sold_quantity || 0, stock: b.available_quantity || 0,
            visitas: null, categoria: b.category_id, listing: b.listing_type_id,
            fotos: (b.pictures || []).length, permalink: b.permalink,
            salud: b.health, creado: b.date_created
          });
        }
      }
      // visitas de los últimos 30 días, en un solo pedido
      try {
        const v = await api(`/items/visits?ids=${items.map(i => i.id).join(',')}&date_from=${new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)}&date_to=${new Date().toISOString().slice(0, 10)}`);
        for (const it of items) if (v[it.id] != null) it.visitas = v[it.id];
      } catch {}

      items.sort((a, b) => (b.vendidos - a.vendidos) || ((b.visitas || 0) - (a.visitas || 0)));
      return json(res, 200, { total: items.length, items, diagnostico: { usuario: me.nickname, user_id: me.id, porEstado } });
    }

    /* Reactiva una publicación pausada y le corrige precio y stock. */
    if (p === '/api/meli/reactivar' && req.method === 'POST') {
      const { id, precio, stock } = await body(req);
      if (!id) return json(res, 400, { error: 'falta id' });
      const cambios = { status: 'active' };
      if (precio) cambios.price = Number(precio);
      if (stock != null) cambios.available_quantity = Number(stock);
      const r = await api(`/items/${id}`, 'PUT', cambios);
      return json(res, 200, { ok: true, id: r.id, estado: r.status, precio: r.price, permalink: r.permalink });
    }

    if (p === '/api/meli/conectar') {
      if (!cfg.app_id) return json(res, 400, { error: 'Primero cargá App ID y Secret' });
      // el devcenter nuevo de MELI exige los scopes explícitos en la URL:
      // sin offline_access no hay refresh token y el permiso se cae a las 6 h
      const u = 'https://auth.mercadolibre.com.ar/authorization?response_type=code'
        + `&client_id=${cfg.app_id}`
        + `&redirect_uri=${encodeURIComponent(redirect())}`
        + `&scope=${encodeURIComponent('offline_access read write')}`;
      res.writeHead(302, { Location: u });
      return res.end();
    }

    if (p === '/api/meli/callback') {
      const code = urlObj.searchParams.get('code');
      const r = await fetch(`${API}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code', client_id: cfg.app_id,
          client_secret: cfg.secret, code, redirect_uri: redirect()
        })
      });
      const t = await r.json();
      if (!r.ok) return json(res, 400, { error: 'OAuth falló', detalle: t });
      cfg.tokens = { access_token: t.access_token, refresh_token: t.refresh_token, user_id: t.user_id, expira: Date.now() + t.expires_in * 1000 };
      guardar('meli.json', cfg);
      guardarTokens(cfg.tokens);   // que sobrevivan al próximo deploy
      res.writeHead(302, { Location: '/panel/meli' });
      return res.end();
    }

    if (p === '/api/meli/publicables') {
      const productos = leer('productos.json', []);
      const carpetas = fs.existsSync(FOTOS_DIR) ? fs.readdirSync(FOTOS_DIR) : [];
      return json(res, 200, productos
        .filter(x => x.canal === 'ML+WEB' && x.precio_ml > 0 && x.estado === 'disponible')
        .map(x => ({
          id: x.id, marca: x.marca, modelo: x.modelo, precio_ml: x.precio_ml, stock: x.stock,
          fotos: carpetas.includes(x.foto_codigo),
          publicado: x.meli_item_id || null, permalink: x.meli_permalink || null
        }))
        .sort((a, b) => (b.fotos - a.fotos) || (b.stock - a.stock)));
    }

    if (p === '/api/meli/publicar' && req.method === 'POST') {
      const { id, precio, titulo, stockMax, listing } = await body(req);
      const productos = leer('productos.json', []);
      const producto = productos.find(x => x.id === id);
      if (!producto) return json(res, 404, { error: 'producto no existe' });

      /* un producto puede tener VARIAS publicaciones (los escalones de precio).
       * Lo que no puede repetirse es el mismo título: eso sí es un duplicado. */
      producto.meli_items = producto.meli_items || [];
      const tit = titulo || armarTitulo(producto);
      if (producto.meli_items.some(x => x.titulo === tit))
        return json(res, 400, { error: 'Ya existe una publicación con ese título' });

      const cfgTienda = leer('config.json', {});
      const r = await publicar(producto, cfgTienda, { precio, titulo: tit, stockMax, listing });
      producto.meli_items.push({ id: r.id, permalink: r.permalink, titulo: tit, precio: precio || producto.precio_ml });
      producto.meli_item_id = producto.meli_item_id || r.id;      // compatibilidad
      producto.meli_permalink = producto.meli_permalink || r.permalink;
      guardar('productos.json', productos);
      return json(res, 200, { ok: true, ...r });
    }

    if (p === '/api/meli/preguntas') {
      const me = await api('/users/me');
      const qs = await api(`/questions/search?seller_id=${me.id}&status=UNANSWERED&sort_fields=date_created&sort_types=DESC&limit=25&api_version=4`);
      const preguntas = [];
      for (const q of (qs.questions || [])) {
        let titulo = '';
        try { titulo = (await api(`/items/${q.item_id}?attributes=title`)).title; } catch {}
        preguntas.push({ id: q.id, texto: q.text, item: titulo, fecha: q.date_created });
      }
      return json(res, 200, preguntas);
    }

    if (p === '/api/meli/responder' && req.method === 'POST') {
      const { question_id, texto } = await body(req);
      await api('/answers', 'POST', { question_id, text: texto });
      return json(res, 200, { ok: true });
    }

    if (p === '/api/meli/ordenes') {
      const me = await api('/users/me');
      const os = await api(`/orders/search?seller=${me.id}&sort=date_desc&limit=20`);
      return json(res, 200, (os.results || []).map(o => ({
        id: o.id,
        fecha: o.date_created,
        total: o.total_amount,
        estado: o.status,
        item: o.order_items?.[0]?.item?.title || '',
        cantidad: o.order_items?.reduce((a, x) => a + x.quantity, 0) || 1,
        comprador: o.buyer?.nickname || ''
      })));
    }

    if (p === '/api/meli/importar-orden' && req.method === 'POST') {
      const b = await body(req);
      const pedidos = leer('pedidos.json', []);
      if (pedidos.some(x => x.meli_order_id === b.id)) return json(res, 400, { error: 'Ya importada' });
      pedidos.unshift({
        id: 'P' + Date.now(), meli_order_id: b.id, fecha: b.fecha || new Date().toISOString(),
        producto: b.item, cantidad: b.cantidad || 1, monto: b.total, canal: 'meli',
        cliente: b.comprador, estado: 'pagado'
      });
      guardar('pedidos.json', pedidos);
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: 'ruta MELI desconocida' });
  } catch (e) {
    return json(res, 500, { error: String(e.message || e) });
  }
}

module.exports = { handler };
