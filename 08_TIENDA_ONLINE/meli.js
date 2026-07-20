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
const REDIRECT = 'http://localhost:5250/api/meli/callback';

const leer = (a, fb) => { try { return JSON.parse(fs.readFileSync(DATA(a), 'utf8')); } catch { return fb; } };
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
async function token() {
  const cfg = leer('meli.json', {});
  if (!cfg.tokens) throw new Error('MELI no conectado');
  if (Date.now() < (cfg.tokens.expira || 0) - 60000) return cfg.tokens.access_token;
  const r = await fetch(`${API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token', client_id: cfg.app_id,
      client_secret: cfg.secret, refresh_token: cfg.tokens.refresh_token
    })
  });
  if (!r.ok) throw new Error('No se pudo refrescar el token (' + r.status + ') — reconectá desde el panel');
  const t = await r.json();
  cfg.tokens = { access_token: t.access_token, refresh_token: t.refresh_token, user_id: t.user_id, expira: Date.now() + t.expires_in * 1000 };
  guardar('meli.json', cfg);
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
  if (!r.ok) throw new Error(out.message || `MELI ${ruta} → ${r.status}`);
  return out;
}

// ---------- publicar ----------
async function subirFotos(fotoCodigo) {
  const dir = path.join(FOTOS_DIR, fotoCodigo);
  let files = [];
  try { files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort().slice(0, 4); } catch {}
  const ids = [];
  const t = await token();
  for (const f of files) {
    const buf = fs.readFileSync(path.join(dir, f));
    const fd = new FormData();
    fd.append('file', new Blob([buf]), f);
    const r = await fetch(`${API}/pictures/items/upload`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${t}` }, body: fd
    });
    if (r.ok) { const j = await r.json(); ids.push({ id: j.id }); }
  }
  return ids;
}

async function publicar(producto, cfgTienda) {
  if (producto.canal === 'WEB') throw new Error('Producto solo-web (lujo): jamás va a MELI');
  if (!producto.precio_ml) throw new Error('Sin precio MELI cargado');

  const pictures = await subirFotos(producto.foto_codigo);
  if (!pictures.length) throw new Error('Sin fotos locales para subir');

  const q = `${producto.marca} ${producto.modelo} anteojos de sol`;
  const disc = await api(`/sites/MLA/domain_discovery/search?q=${encodeURIComponent(q)}&limit=1`);
  const category_id = disc[0]?.category_id;
  if (!category_id) throw new Error('No se pudo predecir la categoría');

  const titulo = `Anteojos ${producto.marca.replace(' · ', ' ')} ${producto.modelo} Originales`.slice(0, 60);
  const stockReal = Math.max(1, producto.stock || 1);

  const item = await api('/items', 'POST', {
    title: titulo,
    category_id,
    price: producto.precio_ml,
    currency_id: 'ARS',
    available_quantity: Math.min(stockReal, 5),
    buying_mode: 'buy_it_now',
    listing_type_id: 'gold_special',
    condition: 'new',
    pictures,
    attributes: [
      { id: 'BRAND', value_name: producto.marca.split(' · ')[0] },
      { id: 'MODEL', value_name: producto.modelo },
      { id: 'GENDER', value_name: 'Sin género' }
    ]
  });

  const variantesTxt = (producto.variantes || []).filter(v => v.stock === 'STOCK' || v.stock === 'POCO STOCK')
    .map(v => `• ${v.color} (${v.codigo}) — talle ${v.talle}`).join('\n');
  await api(`/items/${item.id}/description`, 'POST', {
    plain_text:
`${producto.marca} ${producto.modelo} — 100% ORIGINAL con garantía.

COLORES DISPONIBLES (consultanos por el tuyo):
${variantesTxt || producto.color}

LO QUE RECIBÍS: anteojos originales + estuche + paño + papelería de la marca. Grabados verificables.
GARANTÍA DE AUTENTICIDAD: si no es original, te devolvemos el doble.
ENVÍO: a todo el país, asegurado, despacho en 24-48 h.
CUOTAS: ${cfgTienda.cuotas || 6} sin recargo con tarjeta.

RICHARD LENS — Se te nota lo rich.`
  });

  return { id: item.id, permalink: item.permalink };
}

// ---------- handler ----------
async function handler(req, res, urlObj) {
  const p = urlObj.pathname;
  const cfg = leer('meli.json', {});

  try {
    if (p === '/api/meli/estado') {
      let user = null;
      if (cfg.tokens) { try { user = (await api('/users/me')).nickname; } catch {} }
      return json(res, 200, { configurada: !!cfg.app_id, conectada: !!cfg.tokens && !!user, user });
    }

    if (p === '/api/meli/config' && req.method === 'POST') {
      const b = await body(req);
      guardar('meli.json', { ...cfg, app_id: (b.app_id || '').trim(), secret: (b.secret || '').trim() });
      return json(res, 200, { ok: true });
    }

    if (p === '/api/meli/conectar') {
      if (!cfg.app_id) return json(res, 400, { error: 'Primero cargá App ID y Secret' });
      const u = `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${cfg.app_id}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
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
          client_secret: cfg.secret, code, redirect_uri: REDIRECT
        })
      });
      const t = await r.json();
      if (!r.ok) return json(res, 400, { error: 'OAuth falló', detalle: t });
      cfg.tokens = { access_token: t.access_token, refresh_token: t.refresh_token, user_id: t.user_id, expira: Date.now() + t.expires_in * 1000 };
      guardar('meli.json', cfg);
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
      const { id } = await body(req);
      const productos = leer('productos.json', []);
      const producto = productos.find(x => x.id === id);
      if (!producto) return json(res, 404, { error: 'producto no existe' });
      if (producto.meli_item_id) return json(res, 400, { error: 'Ya publicado: ' + producto.meli_permalink });
      const cfgTienda = leer('config.json', {});
      const r = await publicar(producto, cfgTienda);
      producto.meli_item_id = r.id;
      producto.meli_permalink = r.permalink;
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
