/*
 * Conector Supabase del server: la base es la FUENTE DE VERDAD y productos.json
 * queda como espejo local (la tienda/panel siguen leyendo igual → cero regresión).
 * Config: data/supabase.json { "url": "https://xxx.supabase.co", "service": "eyJ..." }
 * Sin config, el server sigue 100% local como siempre.
 */
const fs = require('fs');
const path = require('path');
const DATA = p => path.join(__dirname, 'data', p);

function cfg() {
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

/* escrituras espejo → Supabase (best effort: si falla, queda log y el local sigue) */
const seguro = fn => (...args) => fn(...args).catch(e => console.error('[supabase]', e.message));
module.exports = {
  activo,
  pullCatalogo,
  insertar: seguro((tabla, fila) => rest(tabla, 'POST', fila, 'resolution=merge-duplicates')),
  actualizar: seguro((tabla, id, campos, clave = 'id') => rest(`${tabla}?${clave}=eq.${encodeURIComponent(id)}`, 'PATCH', campos)),
  borrar: seguro((tabla, id, clave = 'id') => rest(`${tabla}?${clave}=eq.${encodeURIComponent(id)}`, 'DELETE'))
};
