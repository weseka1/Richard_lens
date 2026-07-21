/*
 * RICHARD LENS — server local de la tienda multimarca + panel.
 * Cero dependencias: node server.js y ya está.
 *
 *   Tienda  → http://localhost:5250
 *   Panel   → http://localhost:5250/panel
 *
 * IA: con ANTHROPIC_API_KEY en el entorno responde Claude (Haiku).
 *     Sin key responde el cerebro local (FAQ + catálogo). Nunca se cae.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const meli = require('./meli.js');
const supa = require('./supa.js');

const ROOT = __dirname;
const DATA = p => path.join(ROOT, 'data', p);
const FOTOS_DIR = path.join(ROOT, '..', '07_CATALOGO', 'imagenes');
const STOCK_CSV = path.join(ROOT, '..', '07_CATALOGO', 'STOCK.csv');

const PORT = process.env.PORT || 5250;
const HOST = process.env.HOST || '127.0.0.1'; // subir a 0.0.0.0 solo si querés verla desde el cel en la misma wifi

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon'
};

// ---------- helpers de datos ----------
function leer(archivo, fallback) {
  try { return JSON.parse(fs.readFileSync(DATA(archivo), 'utf8')); }
  catch { return fallback; }
}
function guardar(archivo, datos) {
  fs.writeFileSync(DATA(archivo), JSON.stringify(datos, null, 2), 'utf8');
}
function slug(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function publico(p) { // lo que ve la tienda: sin costos
  const { costo_usd, ...resto } = p;
  return resto;
}
function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 12e6) req.destroy(); }); // 12MB: fotos del panel en base64
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); } });
  });
}

// ---------- sync desde STOCK.csv (el flujo de carga de Juani) ----------
function syncCsv() {
  if (!fs.existsSync(STOCK_CSV)) return { ok: false, error: 'No existe STOCK.csv' };
  const lineas = fs.readFileSync(STOCK_CSV, 'utf8').trim().split(/\r?\n/).slice(1);
  const productos = leer('productos.json', []);
  let nuevos = 0, actualizados = 0;
  for (const linea of lineas) {
    const c = linea.split(';').map(x => x.trim());
    if (c.length < 10 || /ejemplo/i.test(c[0])) continue;
    const [modelo, marca, codigo, color, cristal, cantidad, costo_usd, precio_ml, precio_web, canal] = c;
    const id = slug(codigo);
    const existente = productos.find(p => p.id === id);
    const base = {
      modelo, marca, codigo, color, cristal,
      stock: parseInt(cantidad) || 0,
      costo_usd: parseFloat(costo_usd) || 0,
      precio_ml: parseInt(precio_ml) || 0,
      precio_web: parseInt(precio_web) || 0,
      canal: canal || 'WEB',
      foto_codigo: id
    };
    if (existente) { Object.assign(existente, base); actualizados++; }
    else {
      productos.push({
        id, ...base, forma: 'cuadrado', material: 'acetato', genero: 'unisex',
        estado: base.stock > 0 ? 'disponible' : 'a_pedido',
        destacado: false, descripcion: `${marca} ${modelo}. Original, con garantía.`
      });
      nuevos++;
    }
  }
  guardar('productos.json', productos);
  return { ok: true, nuevos, actualizados, total: productos.length };
}

// ---------- cerebro local del asistente ----------
function cerebroLocal(mensaje, cfg, productos) {
  const m = mensaje.toLowerCase();
  const wa = `wa.me/${cfg.whatsapp}`;
  const enStock = productos.filter(p => p.estado === 'disponible');
  const palabras = m.replace(/[¿?¡!.,]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const busca = productos.filter(p => {
    const txt = (p.marca + ' ' + p.modelo + ' ' + p.codigo).toLowerCase();
    return palabras.some(w => txt.includes(w));
  });
  if (/precio|cu[aá]nto|sale|valor|cuota/.test(m))
    return `Los precios se pasan por WhatsApp según modelo y forma de pago (hay ${cfg.cuotas} cuotas y ${cfg.descuento_transferencia}% off por transferencia). Escribinos y en minutos tenés precio y stock: ${wa}`;
  if (/original|truch|r[eé]plica|falso|aut[eé]ntic/.test(m))
    return `Todo lo que vendemos es 100% original. ${cfg.textos.garantia} Te mostramos grabados, estuche y factura antes de comprar.`;
  if (/env[ií]o|llega|interior|mandan|correo/.test(m))
    return `${cfg.textos.envios} Llegamos a todo el país, se despacha en 24-48 h con seguimiento.`;
  if (/cambio|devoluci[oó]n|no me queda|talle/.test(m))
    return cfg.textos.cambios + ' Coordinás el cambio directo por WhatsApp.';
  if (/marca|qu[eé] ten[eé]s|cat[aá]logo|modelos/.test(m)) {
    const marcas = [...new Set(productos.map(p => p.marca))].join(', ');
    return `Trabajamos ${marcas}. Ray-Ban y Oakley con entrega inmediata o a pedido; las marcas de lujo van solo por acá y WhatsApp, no las vas a ver en MercadoLibre.`;
  }
  if (busca.length && m.length > 3) {
    const p = busca[0];
    return `Tenemos ${p.marca} ${p.modelo} (${p.color}, cristal ${p.cristal}). ${p.estado === 'disponible' ? 'Hay stock.' : 'Entra a pedido, demora poco.'} Precio y reserva por WhatsApp: ${wa}`;
  }
  return `Te leo. Para precio, stock o reservar, lo más rápido es WhatsApp: ${wa} — respondemos al toque. ${enStock.length ? `Ahora mismo hay ${enStock.length} modelos con entrega inmediata.` : ''}`;
}

// ---------- asistente con Claude ----------
async function cerebroClaude(mensaje, historial, cfg, productos) {
  // con 500+ modelos el catálogo completo no entra: van los disponibles más fuertes + resumen
  const disponibles = productos.filter(p => p.estado === 'disponible')
    .sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 80);
  const catalogo = disponibles.map(p =>
    `${p.marca} ${p.modelo} — ${p.variantes?.length || 1} variantes, ${p.stock || 0} con stock${p.precio_web ? ' $' + p.precio_web.toLocaleString('es-AR') : ', precio por WhatsApp'}`
  ).join('\n') + `\n(+${productos.length - disponibles.length} modelos más en la web: si preguntan por uno que no está acá, deriva a WhatsApp)`;
  const system = `Sos RICH, el asistente de RICHARD LENS, tienda argentina de anteojos 100% originales (Ray-Ban, Oakley y marcas de lujo: Prada, Gucci, D&G, Louis Vuitton, Balenciaga, Fendi, Versace).
Hablás en argentino, canchero pero vendedor profesional: frases cortas, cero verso, cero emojis en cadena.
Reglas: (1) El cierre SIEMPRE es por WhatsApp ${cfg.whatsapp_display} — invitá a escribir para precio/stock/reserva. (2) Nunca inventes precios ni stock que no estén en el catálogo. (3) Si preguntan si es original: garantía de autenticidad, se muestran grabados, estuche y factura. (4) Envíos asegurados a todo el país. (5) Cuotas: ${cfg.cuotas}. Transferencia: ${cfg.descuento_transferencia}% off. (6) Respuestas de 1 a 3 frases.
CATÁLOGO ACTUAL:\n${catalogo}`;
  const mensajes = [...(historial || []).slice(-6), { role: 'user', content: mensaje }];
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({ model: leer('config.json', {}).ia?.modelo || 'claude-haiku-4-5-20251001', max_tokens: 300, system, messages: mensajes })
  });
  if (!r.ok) throw new Error('API ' + r.status);
  const data = await r.json();
  return data.content?.[0]?.text || '';
}

// ---------- rutas ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;

  try {
    // ---- API ----
    if (p.startsWith('/api/meli/')) return meli.handler(req, res, url);
    if (p.startsWith('/api/')) {
      const cfg = leer('config.json', {});
      const productos = leer('productos.json', []);

      if (p === '/api/config' && req.method === 'GET') return json(res, 200, cfg);
      if (p === '/api/config' && req.method === 'POST') {
        const b = await body(req); guardar('config.json', { ...cfg, ...b });
        return json(res, 200, { ok: true });
      }

      if (p === '/api/productos' && req.method === 'GET')
        return json(res, 200, productos.filter(x => x.estado !== 'pausado').map(publico));
      if (p === '/api/admin/productos' && req.method === 'GET')
        return json(res, 200, productos);
      if (p === '/api/productos' && req.method === 'POST') {
        const b = await body(req);
        b.id = b.id || slug(b.codigo || b.modelo || String(Date.now()));
        b.foto_codigo = b.foto_codigo || b.id;
        productos.push(b); guardar('productos.json', productos);
        return json(res, 200, { ok: true, id: b.id });
      }
      const mProd = p.match(/^\/api\/productos\/([\w-]+)$/);
      if (mProd && req.method === 'PUT') {
        const i = productos.findIndex(x => x.id === mProd[1]);
        if (i < 0) return json(res, 404, { error: 'no existe' });
        const cambios = await body(req);
        productos[i] = { ...productos[i], ...cambios, id: mProd[1] };
        guardar('productos.json', productos);
        if (supa.activo()) {
          const { variantes, ...campos } = cambios;
          if (Object.keys(campos).length) supa.actualizarProducto(mProd[1], campos);
          // variantes editadas a mano en el panel también suben a la nube
          if (Array.isArray(variantes) && variantes.length)
            supa.upsertVariantes(variantes.map(v => ({ ...v, producto_id: mProd[1] })));
        }
        return json(res, 200, { ok: true });
      }
      if (mProd && req.method === 'DELETE') {
        guardar('productos.json', productos.filter(x => x.id !== mProd[1]));
        if (supa.activo()) supa.borrarProducto(mProd[1]);
        return json(res, 200, { ok: true });
      }

      const mFotos = p.match(/^\/api\/fotos\/([\w-]+)$/);
      if (mFotos) {
        const dir = path.join(FOTOS_DIR, mFotos[1]);
        let files = [];
        try { files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('_')).sort(); } catch {}
        return json(res, 200, files.map(f => `/fotos/${mFotos[1]}/${f}`));
      }
      // subir foto desde el panel (base64) → 07_CATALOGO/imagenes/<codigo>/
      const mSubir = p.match(/^\/api\/fotos-subir\/([\w-]+)$/);
      if (mSubir && req.method === 'POST') {
        const { base64, ext } = await body(req);
        if (!base64) return json(res, 400, { error: 'falta base64' });
        const dir = path.join(FOTOS_DIR, mSubir[1]);
        fs.mkdirSync(dir, { recursive: true });
        const existentes = fs.readdirSync(dir).filter(f => /^\d\d\./.test(f)).length;
        const nombre = String(existentes + 1).padStart(2, '0') + '.' + (ext || 'jpg').replace(/[^a-z]/gi, '').toLowerCase();
        fs.writeFileSync(path.join(dir, nombre), Buffer.from(base64.replace(/^data:[^,]+,/, ''), 'base64'));
        return json(res, 200, { ok: true, archivo: nombre });
      }
      // ocultar foto (renombra con _descartada_, la web deja de mostrarla)
      const mBorrarF = p.match(/^\/api\/fotos-borrar\/([\w-]+)$/);
      if (mBorrarF && req.method === 'POST') {
        const { archivo } = await body(req);
        const origen = path.join(FOTOS_DIR, mBorrarF[1], (archivo || '').replace(/[\\/]/g, ''));
        if (!fs.existsSync(origen)) return json(res, 404, { error: 'no existe' });
        fs.renameSync(origen, path.join(FOTOS_DIR, mBorrarF[1], '_descartada_' + path.basename(origen)));
        return json(res, 200, { ok: true });
      }

      // asignar color a una foto DESDE EL PANEL (escribe fotos.json — mismo formato que la auditoría IA)
      const mColorF = p.match(/^\/api\/fotos-color\/([\w-]+)$/);
      if (mColorF && req.method === 'POST') {
        const { archivo, color } = await body(req);
        const ruta = path.join(FOTOS_DIR, mColorF[1], 'fotos.json');
        let mapa = {};
        try { mapa = JSON.parse(fs.readFileSync(ruta, 'utf8')); } catch {}
        if (color) mapa[archivo] = color; else delete mapa[archivo];
        fs.writeFileSync(ruta, JSON.stringify(mapa, null, 2), 'utf8');
        return json(res, 200, { ok: true });
      }

      // elegir PORTADA desde el panel: la foto pasa a llamarse 00_xxx y queda primera
      // (la web ordena alfabéticamente). Le saca el prefijo a la portada anterior.
      const mPortada = p.match(/^\/api\/fotos-portada\/([\w-]+)$/);
      if (mPortada && req.method === 'POST') {
        const { archivo } = await body(req);
        const dir = path.join(FOTOS_DIR, mPortada[1]);
        const limpio = (archivo || '').replace(/[\\/]/g, '');
        if (!limpio || !fs.existsSync(path.join(dir, limpio))) return json(res, 404, { error: 'no existe' });
        const rutaMapa = path.join(dir, 'fotos.json');
        let mapa = {};
        try { mapa = JSON.parse(fs.readFileSync(rutaMapa, 'utf8')); } catch {}
        const renombrar = (de, a) => {
          if (de === a) return;
          fs.renameSync(path.join(dir, de), path.join(dir, a));
          if (Object.prototype.hasOwnProperty.call(mapa, de)) { mapa[a] = mapa[de]; delete mapa[de]; }
        };
        // destronar a la portada actual
        for (const f of fs.readdirSync(dir)) {
          if (/^00[_.]/.test(f) && f !== limpio) renombrar(f, f.replace(/^00[_.]/, ''));
        }
        if (!/^00_/.test(limpio)) renombrar(limpio, '00_' + limpio.replace(/^00[_.]/, ''));
        fs.writeFileSync(rutaMapa, JSON.stringify(mapa, null, 2), 'utf8');
        return json(res, 200, { ok: true });
      }

      // mapa foto→color de variante (lo escribe la auditoría IA como fotos.json en cada carpeta)
      const mMapa = p.match(/^\/api\/fotos-mapa\/([\w-]+)$/);
      if (mMapa) {
        try { return json(res, 200, JSON.parse(fs.readFileSync(path.join(FOTOS_DIR, mMapa[1], 'fotos.json'), 'utf8'))); }
        catch { return json(res, 200, {}); }
      }

      if (p === '/api/pedidos' && req.method === 'GET') return json(res, 200, leer('pedidos.json', []));
      if (p === '/api/pedidos' && req.method === 'POST') {
        const pedidos = leer('pedidos.json', []);
        const b = await body(req);
        const nuevo = { id: 'P' + Date.now(), fecha: new Date().toISOString(), estado: 'nuevo', ...b };
        pedidos.unshift(nuevo);
        guardar('pedidos.json', pedidos);
        if (supa.activo()) supa.insertar('rl_pedidos', { producto: nuevo.producto, cantidad: nuevo.cantidad, monto: nuevo.monto, canal: nuevo.canal, cliente: nuevo.cliente, estado: nuevo.estado, detalle: { local_id: nuevo.id } });
        return json(res, 200, { ok: true });
      }
      const mPed = p.match(/^\/api\/pedidos\/([\w-]+)$/);
      if (mPed && req.method === 'PUT') {
        const pedidos = leer('pedidos.json', []);
        const i = pedidos.findIndex(x => x.id === mPed[1]);
        if (i < 0) return json(res, 404, { error: 'no existe' });
        const cambios = await body(req);
        pedidos[i] = { ...pedidos[i], ...cambios, id: mPed[1] };
        guardar('pedidos.json', pedidos);
        if (supa.activo()) supa.pedidoUpdate(mPed[1], cambios);
        return json(res, 200, { ok: true });
      }
      if (mPed && req.method === 'DELETE') {
        guardar('pedidos.json', leer('pedidos.json', []).filter(x => x.id !== mPed[1]));
        if (supa.activo()) supa.pedidoDelete(mPed[1]);
        return json(res, 200, { ok: true });
      }

      // newsletter: captura de mails para automatizar después (n8n / email marketing)
      if (p === '/api/suscriptores' && req.method === 'POST') {
        const { email } = await body(req);
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { error: 'email inválido' });
        const subs = leer('suscriptores.json', []);
        if (!subs.some(s => s.email === email.toLowerCase())) {
          subs.unshift({ email: email.toLowerCase(), fecha: new Date().toISOString(), origen: 'web' });
          guardar('suscriptores.json', subs);
          if (supa.activo()) supa.insertar('rl_suscriptores', { email: email.toLowerCase(), origen: 'web' });
        }
        return json(res, 200, { ok: true });
      }
      if (p === '/api/suscriptores' && req.method === 'GET')
        return json(res, 200, leer('suscriptores.json', []));

      if (p === '/api/eventos' && req.method === 'POST') {
        const eventos = leer('eventos.json', []);
        const b = await body(req);
        eventos.unshift({ fecha: new Date().toISOString(), ...b });
        guardar('eventos.json', eventos.slice(0, 5000));
        return json(res, 200, { ok: true });
      }
      if (p === '/api/eventos' && req.method === 'GET')
        return json(res, 200, leer('eventos.json', []).slice(0, 300));

      if (p === '/api/stats') {
        const pedidos = leer('pedidos.json', []);
        const eventos = leer('eventos.json', []);
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const dia = (d, n) => { const x = new Date(d); x.setDate(x.getDate() - n); return x; };
        const entregados = pedidos.filter(x => ['pagado', 'enviado', 'entregado'].includes(x.estado));
        const paresPorDia = [];
        for (let i = 6; i >= 0; i--) {
          const d0 = dia(hoy, i), d1 = dia(hoy, i - 1);
          const delDia = entregados.filter(x => { const f = new Date(x.fecha); return f >= d0 && f < d1; });
          paresPorDia.push({
            dia: d0.toLocaleDateString('es-AR', { weekday: 'short' }),
            pares: delDia.reduce((a, x) => a + (parseInt(x.cantidad) || 1), 0),
            plata: delDia.reduce((a, x) => a + (parseInt(x.monto) || 0), 0)
          });
        }
        const factHoy = paresPorDia[paresPorDia.length - 1].plata;
        // extras de comando: mes, ticket, canal, funnel del día y productos calientes
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const delMes = entregados.filter(x => new Date(x.fecha) >= inicioMes);
        const factMes = delMes.reduce((a, x) => a + (parseInt(x.monto) || 0), 0);
        const paresMes = delMes.reduce((a, x) => a + (parseInt(x.cantidad) || 1), 0);
        const porCanal = {};
        for (const x of entregados) porCanal[x.canal || 'web'] = (porCanal[x.canal || 'web'] || 0) + (parseInt(x.monto) || 0);
        const esHoy = f => new Date(f) >= hoy;
        const visitasHoy = eventos.filter(x => x.tipo === 'visita' && esHoy(x.fecha)).length +
          eventos.filter(x => x.tipo === 'visita_producto' && esHoy(x.fecha)).length;
        const carritosHoy = eventos.filter(x => x.tipo === 'carrito_agregar' && esHoy(x.fecha)).length;
        const calor = {};
        for (const e of eventos) {
          if (e.tipo === 'visita_producto') (calor[e.detalle] = calor[e.detalle] || { vistas: 0, carrito: 0 }).vistas++;
          if (e.tipo === 'carrito_agregar') (calor[e.detalle] = calor[e.detalle] || { vistas: 0, carrito: 0 }).carrito++;
        }
        const top = Object.entries(calor)
          .map(([k, v]) => {
            const prod = productos.find(x => x.id === k);
            return { nombre: prod ? `${prod.marca} ${prod.modelo}` : k, ...v };
          })
          .sort((a, b) => (b.carrito * 3 + b.vistas) - (a.carrito * 3 + a.vistas)).slice(0, 5);

        return json(res, 200, {
          productos: productos.length,
          en_stock: productos.filter(x => x.estado === 'disponible').length,
          stock_total: productos.reduce((a, x) => a + (x.stock || 0), 0),
          pedidos_total: pedidos.length,
          pedidos_nuevos: pedidos.filter(x => x.estado === 'nuevo').length,
          pares_7dias: paresPorDia.reduce((a, x) => a + x.pares, 0),
          pares_por_dia: paresPorDia,
          facturacion_hoy: factHoy,
          facturacion_7dias: paresPorDia.reduce((a, x) => a + x.plata, 0),
          facturacion_mes: factMes,
          pares_mes: paresMes,
          ticket_promedio: entregados.length ? Math.round(entregados.reduce((a, x) => a + (parseInt(x.monto) || 0), 0) / entregados.length) : 0,
          suscriptores: leer('suscriptores.json', []).length,
          visitas_hoy: visitasHoy,
          carritos_hoy: carritosHoy,
          por_canal: porCanal,
          top_productos: top,
          nube: supa.activo(),
          meta_dia: cfg.meta_pares_dia || 4,
          meta_facturacion_dia: cfg.meta_facturacion_dia || 500000,
          clicks_whatsapp: eventos.filter(x => x.tipo === 'whatsapp_click').length,
          consultas_ia: eventos.filter(x => x.tipo === 'ia_consulta').length
        });
      }

      if (p === '/api/sync-csv' && req.method === 'POST') return json(res, 200, syncCsv());

      // sube el espejo local COMPLETO a Supabase (usar tras importar_proveedor / asignar_precios)
      if (p === '/api/push-nube' && req.method === 'POST') {
        if (!supa.activo()) return json(res, 400, { error: 'Supabase no configurado' });
        const todos = leer('productos.json', []);
        const filasP = [...new Map(todos.map(({ variantes, ...x }) => [x.id, x])).values()];
        const filasV = [...new Map(todos.flatMap(x => (x.variantes || []).map(v => [String(v.sku), { sku: String(v.sku), producto_id: x.id, codigo: v.codigo, color: v.color, talle: v.talle, stock: v.stock }]))).values()];
        for (let i = 0; i < filasP.length; i += 500) await supa.upsertProductos(filasP.slice(i, i + 500));
        for (let i = 0; i < filasV.length; i += 500) await supa.upsertVariantes(filasV.slice(i, i + 500));
        return json(res, 200, { ok: true, productos: filasP.length, variantes: filasV.length });
      }

      // export listo para importar en Shopify (Products > Import)
      if (p === '/api/export-shopify.csv') {
        const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        const filas = [['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price', 'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service', 'Status'].join(',')];
        for (const x of productos.filter(x => x.estado !== 'pausado')) {
          filas.push([
            esc(x.id), esc(`${x.marca} ${x.modelo}`), esc(`<p>${x.descripcion || ''}</p><p>Color: ${x.color}. Cristal: ${x.cristal}. 100% original con garantía.</p>`),
            esc(x.marca), esc('Anteojos de sol'), esc(`${x.marca},${x.forma},${x.canal === 'WEB' ? 'lux' : 'stock'}`),
            'TRUE', esc('Title'), esc('Default Title'), esc(x.codigo),
            x.precio_web || 0, x.stock || 0, esc('deny'), esc('manual'),
            esc(x.estado === 'disponible' ? 'active' : 'draft')
          ].join(','));
        }
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="richardlens_shopify.csv"' });
        return res.end('﻿' + filas.join('\n'));
      }

      if (p === '/api/ia' && req.method === 'POST') {
        const { mensaje, historial } = await body(req);
        if (!mensaje) return json(res, 400, { error: 'falta mensaje' });
        const eventos = leer('eventos.json', []);
        eventos.unshift({ fecha: new Date().toISOString(), tipo: 'ia_consulta', detalle: mensaje.slice(0, 200) });
        guardar('eventos.json', eventos.slice(0, 5000));
        if (process.env.ANTHROPIC_API_KEY) {
          try {
            const r = await cerebroClaude(mensaje, historial, cfg, productos.map(publico));
            return json(res, 200, { respuesta: r, fuente: 'claude' });
          } catch (e) { /* cae al cerebro local */ }
        }
        return json(res, 200, { respuesta: cerebroLocal(mensaje, cfg, productos.map(publico)), fuente: 'local' });
      }

      return json(res, 404, { error: 'ruta desconocida' });
    }

    // ---- SEO: sitemap + robots (el dominio real se setea en config.dominio al deployar) ----
    if (p === '/sitemap.xml') {
      const cfg = leer('config.json', {});
      const base = cfg.dominio || 'http://localhost:5250';
      const productos = leer('productos.json', []).filter(x => x.estado !== 'pausado');
      const urls = [
        `${base}/`, `${base}/catalogo`,
        `${base}/catalogo?orden=vendidos`, `${base}/catalogo?promo=1`,
        ...productos.map(x => `${base}/producto/${x.id}`)
      ];
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      return res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls.map(u => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc></url>`).join('\n') + '\n</urlset>');
    }
    if (p === '/robots.txt') {
      const cfg = leer('config.json', {});
      const base = cfg.dominio || 'http://localhost:5250';
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(`User-agent: *\nAllow: /\nDisallow: /panel\nDisallow: /api/\nSitemap: ${base}/sitemap.xml\n`);
    }

    // ---- fotos del catálogo (07_CATALOGO/imagenes) ----
    if (p.startsWith('/fotos/')) {
      const rel = p.replace('/fotos/', '').split('/').filter(x => x && x !== '..');
      const file = path.join(FOTOS_DIR, ...rel);
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
        return fs.createReadStream(file).pipe(res);
      }
      res.writeHead(404); return res.end();
    }

    // ---- app React (dist/ del build de Vite) con fallback SPA ----
    const DIST = path.join(ROOT, 'dist');
    const rel = p.split('/').filter(x => x && x !== '..');
    let file = path.join(DIST, ...rel);
    if (!path.extname(file) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      file = path.join(DIST, 'index.html'); // rutas de la SPA (/catalogo, /producto/x, /panel...)
    }
    if (fs.existsSync(file)) {
      const cache = /\/assets\//.test(p) ? 'max-age=31536000, immutable' : 'no-cache';
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': cache });
      return fs.createReadStream(file).pipe(res);
    }
    res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1 style="font-family:sans-serif;color:#F2EDE3;background:#0E0D0B;padding:40px">Falta el build: corré <code>cd app && npm run build</code></h1>');
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, HOST, () => {
  if (supa.activo()) {
    supa.pullCatalogo().then(n => console.log(`  Supabase: catálogo sincronizado (${n} productos)`)).catch(e => console.error('  Supabase pull:', e.message));
    setInterval(() => supa.pullCatalogo().catch(() => {}), 5 * 60 * 1000);
  }
  console.log(`\n  RICHARD LENS corriendo:`);
  console.log(`  Tienda → http://localhost:${PORT}`);
  console.log(`  Panel  → http://localhost:${PORT}/panel`);
  console.log(`  IA     → ${process.env.ANTHROPIC_API_KEY ? 'Claude (' + (leer('config.json', {}).ia?.modelo || 'haiku') + ')' : 'cerebro local (sin ANTHROPIC_API_KEY)'}\n`);
});
