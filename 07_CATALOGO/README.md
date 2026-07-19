# Catálogo — cómo cargar el stock

## El flujo (3 comandos y está en todas partes)

```
1. Completar STOCK.csv  (una fila por modelo — ver columnas abajo)
2. node scraper/scrape_imagenes.mjs        → baja fotos a imagenes/<codigo>/
3. node build_catalogo.mjs                 → genera el catálogo de la web (02_DEMO_WEB/catalogo.js)
```

Después: fotos elegidas → publicaciones ML (manual por ahora) + web ya queda actualizada sola.

## Columnas de STOCK.csv (separador `;` — abre bien en Excel argentino)

| Columna | Qué va |
|---|---|
| modelo | Nombre comercial ("Wayfarer Negro Mate") |
| marca | Ray-Ban / Gucci / Prada / RICH |
| codigo | SKU real (RB2140 622) — es la carpeta de fotos |
| color / cristal | Lo que se ve |
| cantidad | Stock real (0 = no se publica pero queda cargado) |
| costo_usd | Lo que pagamos |
| precio_ml / precio_web | En pesos. **Los define Juani.** 0 = "Consultar" |
| canal | `ML+WEB` o `WEB` (LUX siempre WEB) |
| foto_query | Búsqueda para el scraper (marca + código + descripción en inglés) |

## Reglas

- LUX (Gucci/Prada/etc) → canal WEB siempre. Jamás MELI.
- Las fotos scrapeadas sirven para ML y web. Para ADS de Meta usar SOLO fotos propias.
- El scraper baja hasta 6 candidatas por modelo → elegir a mano las 3 mejores por carpeta
  (borrar las malas; las que quedan son las que usa todo lo demás).
