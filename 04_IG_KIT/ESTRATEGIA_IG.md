# Instagram — Relanzamiento Richard Lens

## Perfil

- Handle: **@richardlens** (o recuperar el viejo si existe — decidir HOY).
- Nombre visible: `Richard Lens 👑 Anteojos` (el nombre indexa en búsqueda).
- **Bio**:
```
El rich estaba en el nombre.
Ray-Ban originales + RICH line propia
3 cuotas sin interés · envío gratis a todo el país
👇 Pedí el catálogo
```
- Link: WhatsApp (wa.me) hasta que la landing esté deployada; después la landing.
- Cuenta **Business** desde el día 1 (métricas + luego API de publicación vía n8n, molde WSK).

## La grilla (regla 1-1-1, del branding kit)

Rotación de a 3: **producto impecable → tag/actitud rich → social proof** (cliente
con lentes puestos, ojos nunca visibles). Todo negro+oro, grano, una pieza = una idea.

## Piezas listas en esta carpeta (generadas HTML→PNG)

| Archivo | Formato | Uso |
|---|---|---|
| `ig_post_01_relanzamiento.png` | 1080×1350 | Post 1 — el anuncio |
| `ig_post_02_wayfarer.png` | 1080×1350 | Post 2 — producto real |
| `ig_post_03_tag.png` | 1080×1350 | Post 3 — actitud/manifiesto |
| `ig_story_relanzamiento.png` | 1080×1920 | Story día 1 |
| `cover_drops.png` … `cover_labanda.png` | 1080×1920 | 5 portadas de destacadas |
| `logo_v2_drip.png` | 2000×2000 transparente | Foto de perfil + usos varios |

Además: las fotos del pack (`Mesa de trabajo 3-5.jpg` feed, `7-9.jpg` stories) son
contenido directo — publicables tal cual.

## Calendario semana 1 (lanzamiento lunes)

| Día | Pieza | Caption |
|---|---|---|
| **Lun 09:00** | Post 1 relanzamiento | "Volvimos. Y esta vez no venimos a susurrar. El rich estaba en el nombre desde el principio — ahora se nota. Ray-Ban originales + RICH line propia. 3 cuotas, envío gratis a todo el país. #SeTeNotaLoRich" |
| Lun 12:00 | Story relanzamiento + sticker link WA | — |
| **Mar** | Post 2 Wayfarer (foto real) | "Wayfarer negro mate. El que te imaginás. Ese. Original, con estuche, paño y garantía. 3 cuotas sin interés. Pedilo por WhatsApp — te mandamos foto real de TU par antes de pagar." |
| Mié | Story: lateral "Hand Made in Italy" + texto "se lee, se verifica" | — |
| **Jue** | Post 3 tag | "Acá no se ven los ojos. Se ven los lentes. Bienvenido a la banda. #SeTeNotaLoRich" |
| Vie | Story: encuesta "¿Wayfarer o Aviator?" (mide demanda del próximo drop) | — |
| **Sáb** | Repost pack: foto par (Mesa 3) | "Fin de semana. Que se note." |
| Dom | Story: adelanto "El lunes pasa algo" (teaser sorteo semana 2) | — |

## Semana 2 — Sorteo Express de relanzamiento (el molde v1 que ya funcionaba)

Premio: 1 Wayfarer negro mate. Mecánica: seguir + comentar arrobando a uno + story.
Pieza con la estética nueva (negro+oro+drip). Anunciar lunes, cerrar viernes.
Objetivo: primera base de seguidores calientes para la RICH line Drop 001.

## Reglas de contenido

- Fotos de producto propias SIEMPRE (jamás assets oficiales de Ray-Ban bajados de la web — riesgo de reporte).
- Ads Meta (cuando arranquen): SOLO RICH line o fotos propias sin logos de terceros visibles en el creativo (regla Baires). Destino CTWA (molde Whynot).
- Un tag grafiti por pieza máximo. El caos es condimento.
- Nada de tics IA en captions: cortos, con dato, cierre con acción.

## Carruseles (19-jul)

Dos carruseles 1080×1350, 5 slides c/u. HTML en `_src/carrusel*.html`, PNG en esta
carpeta (`carrusel1_s1.png` … `carrusel2_s5.png`). Render: `_src/render_carruseles.mjs`
(misma máquina CDP que `render.mjs`).

**Carrusel 1 — "La caja fuerte"** (marcas de lujo por encargo: Prada, Gucci, LV,
Balenciaga, Fendi, Versace, D&G). Objetivo: posicionar el canal directo como EL lugar
donde conseguir lujo original fuera de Meli; sembrar consultas por DM/WA.

> Caption: "Lo que no está en MercadoLibre, está acá. Prada, Gucci, Louis Vuitton y
> la banda entera — originales, con grabados, estuche y factura a la vista antes de
> pagar. Si no es original, devolvemos el doble. Decinos cuál buscás por WhatsApp.
> #SeTeNotaLoRich"

**Carrusel 2 — "Drop Ray-Ban"** (Wayfarer con stock inmediato). Objetivo: convertir
el stock en ventas YA — urgencia real de drop limitado + cuotas + envío.

> Caption: "Drop 001 abierto. El Wayfarer que te imaginás, con factura, estuche y
> grabados. 3 cuotas, envío asegurado a todo el país, despachado en 24-48 h. Los de
> entrega inmediata vuelan: escribinos por WhatsApp y es tuyo. #SeTeNotaLoRich"
