# RICHARD LENS — Tienda + Panel. Cómo lanzar (5 minutos)

## Arrancar (producción local)

```
cd "08_TIENDA_ONLINE"
node server.js
```

- **Tienda** → http://localhost:5250
- **Panel** → http://localhost:5250/panel

El server es Node puro sin dependencias y sirve el build de React ya compilado en `dist/` (viene commiteado: clonás y corre). Los datos viven en `data/*.json` — sin base de datos que configurar.

## Desarrollar (tocar la web)

```
cd "08_TIENDA_ONLINE"
node server.js            # terminal 1: la API en :5250
cd app && npm install     # solo la primera vez
npm run dev               # terminal 2: Vite con hot-reload en :5173
```

Editás componentes en `app/src/` y ves los cambios al instante. Cuando esté listo:
`npm run build` → regenera `dist/` → `node server.js` sirve la versión nueva.

## El stock REAL (proveedor sun-bh, dropshipping)

El catálogo de la tienda YA está cargado con el stock real del proveedor (506 modelos, ~1.900
SKUs de anteojos con variantes de color/talle/estado). Cuando el proveedor actualice:

1. Bajar el export de stock de sun-bh.com (login de Juani) → `.xlsx`
2. Convertirlo a `07_CATALOGO/proveedor_stock.csv` (columnas: modelo;codigo;color;sku;talle;stock;categoria;producto)
3. `node 07_CATALOGO/importar_proveedor.mjs` → regenera la tienda SIN pisar precios/destacados que ya hayas tocado

Los PDFs del catálogo visual del proveedor quedan en `07_CATALOGO/` (RAY BAN, 789, ÚLTIMOS INGRESOS).
La indumentaria (TNF/UNIQ, 267 SKUs) y relojes del proveedor quedaron FUERA de la tienda — es de gafas.

## Lo único que falta conectar (en orden)

1. **Tu WhatsApp comercial** → Panel → Config → campo WhatsApp (hoy apunta al de WESEKA como placeholder). Guardar y listo, todos los botones de la tienda apuntan ahí.
2. **Stock real** → completá `07_CATALOGO/STOCK.csv` (una fila por modelo, separador `;`) → Panel → Productos → "Importar STOCK.csv". Los precios los ajustás ahí mismo (precio 0 = "Consultar por WhatsApp", que también es una estrategia válida para cerrar en el chat).
3. **Fotos** → `node 07_CATALOGO/scraper/scrape_imagenes.mjs` baja candidatas por modelo a `07_CATALOGO/imagenes/<codigo>/`. Borrá las malas; la tienda las levanta sola (la carpeta se llama igual que el id del producto).
4. **IA con Claude** (opcional, sin esto el asistente igual responde con el cerebro local):
   ```
   $env:ANTHROPIC_API_KEY = "sk-ant-..."
   node server.js
   ```
5. **Verla desde el celu** (misma wifi): `$env:HOST = "0.0.0.0"; node server.js` y entrá a `http://<IP-de-la-PC>:5250`.

## Shopify (cuando quieras, sin apuro)

1. Abrí prueba en shopify.com (3 días gratis, después ~USD 1 el primer mes).
2. Panel → Productos → **"Exportar a Shopify"** → baja `richardlens_shopify.csv`.
3. En Shopify: Products → Import → subís el CSV. Precios y stock viajan solos; los productos sin precio entran como borrador.
4. Tema recomendado: **Dawn** (gratis) en modo oscuro — colores del branding: fondo `#0E0D0B`, texto `#F2EDE3`, acento `#D4AF37`.

> Alternativa $0 fijo mientras tanto: **Tienda Nube plan Inicial** ($0/mes, 2% por venta) o directamente esta web + WhatsApp, que ya funciona hoy.

## MercadoLibre

- Solo Ray-Ban / Oakley (**jamás LUX** — riesgo de denuncia + se pierde el margen).
- Publicaciones listas para copiar/pegar en `03_MERCADOLIBRE/PUBLICACIONES.md`.
- SIEMPRE con papel de compra del distribuidor archivado (defensa PPPI).

## Mapa técnico (para tocar sin miedo)

| Qué | Dónde |
|---|---|
| Server + API + IA (sin dependencias) | `server.js` (puerto 5250, sirve `dist/` con fallback SPA) |
| Catálogo, config, ventas, eventos | `data/*.json` (editables a mano si hace falta) |
| App React (Vite) | `app/src/` — `pages/` (Home, Catalogo, Producto), `components/` (TiendaLayout, CardProducto NFT, Gafas3D, ChatRich), `panel/` (Tablero, Productos, Ventas, Consultas, Config), `lib/` (api + hooks), `styles/` |
| Build compilado (lo que sirve el server) | `dist/` — se regenera con `cd app && npm run build` |
| Fotos de producto | `../07_CATALOGO/imagenes/<id-producto>/` (servidas en `/fotos/...`) |

Reglas del código: React + Vite, rutas con react-router, el panel entra como chunk lazy aparte (el cliente nunca lo baja) igual que Three.js. Para una página nueva: componente en `app/src/pages/` + ruta en `App.jsx`.
