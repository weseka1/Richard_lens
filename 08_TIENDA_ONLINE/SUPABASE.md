# Richard Lens — Backend en Supabase

**Regla de oro:** Supabase es la **fuente de verdad**. El server mantiene espejos
locales (`data/*.json`, `07_CATALOGO/imagenes/`) por rendimiento y para funcionar
sin conexión, pero el dato que manda vive en Supabase. Por eso **todo lo que se
edita desde el panel persiste** aunque Render borre el disco en cada deploy.

Proyecto: `jkkytzgmhzzngnntkfbr` · credenciales por env (`SUPABASE_URL`,
`SUPABASE_KEY` = anon, `SUPABASE_CLAVE` = secreto de los RPC admin) o `data/supabase.json`.

## Seguridad
La `anon key` vive **solo en el server** (el cliente habla con `/api/*`, nunca con
Supabase directo). Las escrituras de administración van por funciones **SECURITY
DEFINER** que exigen la `clave` secreta. Así la anon key es inofensiva aunque se filtre.

## Tablas (`public`)
| Tabla | Qué guarda |
|---|---|
| `rl_productos` | Catálogo. Columnas clave: `fotos` (jsonb, array ordenado de URLs — la 1ª es portada), `foto_colores` (jsonb, mapa archivo→color), `fotos_ok` (bool) |
| `rl_variantes` | Combinaciones color/talle/stock por producto |
| `rl_pedidos` | Ventas (web + MELI) |
| `rl_suscriptores` | Emails del newsletter |
| `rl_eventos` | Analítica (visitas, clicks WhatsApp) |
| `rl_secretos` | `nombre`→`valor` jsonb. Guarda los **tokens de MELI** y la **config de la tienda** (`config`) |

## Storage
Bucket público **`richardlens`** — las fotos subidas desde el panel van a
`richardlens/<foto_codigo>/<archivo>`. Lectura pública; escritura de la anon acotada
a este bucket por políticas RLS. Persiste (a diferencia del disco de Render).

## RPC de administración (todos exigen `clave`)
- `rl_admin_upsert_productos(filas)` · `rl_admin_update_producto(p_id, campos)` · `rl_admin_delete_producto(p_id)`
- `rl_admin_upsert_variantes(filas)`
- `rl_admin_set_fotos(p_id, p_fotos)` — orden/lista de fotos
- `rl_admin_set_foto_colores(p_id, p_colores)` — mapa foto→color
- `rl_admin_pedido_update / _delete`
- `rl_admin_secreto_get / _set(p_nombre, p_valor)` — tokens MELI + config

## Qué es gestionable desde el panel (sin tocar código)
Productos (alta/edición/baja), variantes (color/talle/stock), **fotos** (subir,
quitar y **arrastrar para reordenar**, portada), colores por foto, **config**
(cuotas, envíos, descuentos, textos de confianza, WhatsApp, metas), pedidos.
Todo escribe en Supabase y se refleja en la web (el espejo se re-sincroniza al
arrancar y cada 5 min; las ediciones se ven al instante por el espejo local).

## Migración lazy (fotos)
Un producto sin `fotos` cargado usa el escaneo del directorio (`07_CATALOGO/imagenes`,
alfabético) como siempre. La primera vez que lo editás en el panel, se pobla `fotos`
en Supabase y a partir de ahí manda esa lista. Cero backfill, cero regresión.
