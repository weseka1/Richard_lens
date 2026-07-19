# RICHARD LENS — Tienda + Panel. Cómo lanzar (5 minutos)

## Arrancar

```
cd "08_TIENDA_ONLINE"
node server.js
```

- **Tienda** → http://localhost:5250
- **Panel** → http://localhost:5250/panel

Cero dependencias: no hay `npm install`, no hay base de datos que configurar. Todo vive en `data/*.json`.

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
| Server + API + IA | `server.js` (Node puro, puerto 5250) |
| Catálogo, config, ventas, eventos | `data/*.json` (editables a mano si hace falta) |
| Tienda | `public/` — HTML por página + módulos en `public/js/` (`base` común, `card` NFT, `efectos3d` Three.js, `chat` RICH) |
| Panel | `panel/` — `index.html` + `app.js` + `panel.css` |
| Fotos de producto | `../07_CATALOGO/imagenes/<id-producto>/` (servidas en `/fotos/...`) |

Reglas del código: sin frameworks, sin build, sin dependencias. Cada página es un módulo que importa lo común de `base.js`. Para agregar una página nueva: HTML en `public/` + módulo en `public/js/`.
