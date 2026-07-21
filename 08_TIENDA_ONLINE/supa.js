/*
 * Conector Supabase del server: la base es la FUENTE DE VERDAD y productos.json
 * queda como espejo local (la tienda/panel siguen leyendo igual → cero regresión).
 * Config: data/supabase.json { "url": "https://xxx.supabase.co", "service": "eyJ..." }
 * Sin config, el server sigue 100% local como siempre.
 */
const fs = require('fs');
const path = require('path');
const DATA = p => path.join(__dirname, 'data', p);

/* En la nube el archivo no existe (está gitignoreado a propósito): ahí las
 * credenciales llegan por variables de entorno. En local sigue el archivo. */
function cfg() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    return { url: process.env.SUPABASE_URL, service: process.env.SUPABASE_KEY, clave: process.env.SUPABASE_CLAVE || '' };
  }
  try { return JSON.parse(fs.readFileSync(DATA('supabase.json'), 'utf8')); } catch { return null; }
}
const activo = () => { const c = cfg(); return !!(c && c.url && c.service); };

async function rest(ruta, metodo = 'GET', datos, prefer) {
  const c = cfg();
  const r = await fetch(`${c.url}/rest/v1/${ruta}`, {
    method: metodo,
    headers: {
      apikey: c.service, Authorization: `Bearer ${c.service}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: datos ? JSON.stringify(datos) : undefined
  });
  if (!r.ok) throw new Error(`Supabase ${ruta} → ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

/* baja el catálogo entero y reescribe el espejo productos.json (misma forma que siempre) */
async function pullCatalogo() {
  const filas = await rest('rl_productos?select=*,rl_variantes(*)&order=id');
  const productos = filas.map(({ rl_variantes, creado, actualizado, ...p }) => ({
    ...p,
    variantes: (rl_variantes || []).map(({ producto_id, actualizado, ...v }) => v)
  }));
  fs.writeFileSync(DATA('productos.json'), JSON.stringify(productos, null, 2), 'utf8');
  return productos.length;
}

/* escrituras espejo → Supabase (best effort: si falla, queda log y el local sigue).
 * Las de administración van por RPC con clave secreta (SECURITY DEFINER en la base). */
const seguro = fn => (...args) => fn(...args).catch(e => console.error('[supabase]', e.message));
const rpc = (fn, args) => rest(`rpc/${fn}`, 'POST', { ...args, clave: cfg().clave });
module.exports = {
  activo,
  pullCatalogo,
  insertar: seguro((tabla, fila) => rest(tabla, 'POST', fila, 'resolution=merge-duplicates')),
  actualizarProducto: seguro((id, campos) => rpc('rl_admin_update_producto', { p_id: id, campos })),
  upsertProductos: seguro(filas => rpc('rl_admin_upsert_productos', { filas })),
  upsertVariantes: seguro(filas => rpc('rl_admin_upsert_variantes', { filas })),
  borrarProducto: seguro(id => rpc('rl_admin_delete_producto', { p_id: id })),
  pedidoUpdate: seguro((localId, campos) => rpc('rl_admin_pedido_update', { p_local: localId, campos })),
  pedidoDelete: seguro(localId => rpc('rl_admin_pedido_delete', { p_local: localId })),
  /* secretos que tienen que sobrevivir al deploy: el disco de Render es
   * efímero y cada redeploy borraba los tokens de MELI. Van sin `seguro`
   * porque acá sí necesitamos enterarnos si fallan. */
  secretoGet: nombre => rpc('rl_admin_secreto_get', { p_nombre: nombre }),
  secretoSet: (nombre, valor) => rpc('rl_admin_secreto_set', { p_nombre: nombre, p_valor: valor })
};
