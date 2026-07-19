# RICHARD LENS — Plan operativo multicanal

> 4 canales, 1 sistema: MercadoLibre (caja rápida) + Tienda web (marca y margen)
> + WhatsApp (cierre) + Instagram (deseo). Todo alimenta al mismo stock y al mismo CRM.

---

## 0. Modelo de negocio (aprendido de Tomy Lens + etapa Richard v1)

Tres líneas de producto, cada una con su canal (costos reales jul-2026, blue ~$1.500):

| Línea | Costo | Canal | Precio | Ganancia/par |
|---|---|---|---|---|
| **Ray-Ban** | USD 50–65 ($75–97k) | MELI + web + WA | $324.999–$349.999 | $147–188k en MELI · $199–235k por web |
| **LUX** (Prada, Gucci, Versace, Cartier...) | ~USD 110 ($165k) | **SOLO web/WA/IG — jamás MELI** | $549.999–$699.999 según modelo | **$330–465k por par** |
| **RICH line** (marca propia, fase 2) | bajo | Web + ads | $70–120k | margen 3-5x, cero riesgo de marca |

Por qué LUX no va a MELI (y eso es una feature, no una limitación):
1. Las casas de lujo son las más agresivas denunciando en marketplaces — riesgo de cuenta.
2. En la web propia no hay comisión ~30%: el margen queda entero.
3. **La exclusividad ES el marketing**: "la línea LUX no la buscás en MercadoLibre,
   la pedís acá" — encaja perfecto con el branding new-rich y el cierre por WhatsApp
   (ticket alto argentino se cierra conversando).

Tomy Lens factura SIN vender ninguna marca conocida: marca propia, envío gratis,
3 cuotas, copy de estatus. Nosotros hacemos eso + el imán Ray-Ban + la línea LUX que ellos no tienen.

## 1. MercadoLibre — la caja

- **Qué se publica**: SOLO Ray-Ban (es lo que la gente busca ahí). La línea LUX no pisa ML jamás (riesgo de denuncia + margen que no se regala). La RICH line tampoco al arranque (no tiene búsqueda, se canibaliza margen con comisión).
- **Publicaciones**: título = Modelo + Código + Original (ej: "Anteojos Ray-Ban Wayfarer RB2140 Negro Mate Originales"). Premium con cuotas sin interés en tickets altos.
- **Fotos**: fondo negro estudio consistente (pipeline IA de assets si faltan fotos reales) + foto real en mano/estuche para confianza.
- **Regla de oro**: solo originales con comprobante. ML baja publicaciones de réplicas por denuncia de marca y te mata la cuenta. Si un modelo no es original, va a la RICH line con nombre propio y listo.
- **Cada venta de ML → WhatsApp**: tarjeta en el paquete con QR al WhatsApp + IG ("tu próximo par sin comisión de por medio: seguinos y escribinos").

## 2. Tienda web — la marca y el margen

- **Plataforma**: Tienda Nube (igual que Tomy Lens; ya conocemos el stack de la época v1 — carpeta `Logo richard lens/Fotos tienda nube/`). Después evaluamos web custom cinematográfica como la demo.
- **La demo cine** (`02_DEMO_WEB/index.html`) es la cara del relanzamiento: se usa como landing de campaña y para redes, la Tienda Nube es el carrito atrás.
- **Ofertas ancla**: envío gratis a todo el país + 3 cuotas sin interés (estándar del rubro, Tomy lo confirma — sin eso no jugás).
- **Drops**: la RICH line sale por drops numerados con stock visible ("Drop 001 — quedan 12"). Escasez real, no inventada.

## 3. WhatsApp — donde se cierra

- Número comercial dedicado (no el personal), WhatsApp Business con catálogo cargado.
- **Respuestas rápidas**: precio+stock / cuotas / envíos / garantía / cambios.
- **Flujo**: DM o click de ad → WA → foto real del par en mano + precio + link de pago (ML o Tienda Nube según canal) → seguimiento a las 24h si no cerró.
- **Post-venta**: foto del paquete al despachar + pedido de reseña/story taggeando. Cada cliente con lentes puestos (ojos tapados) = contenido para la grilla.
- Más adelante: bot Claude tipo Delfina para primera respuesta 24/7 (molde ya probado en WESEKA).

## 4. Instagram — la máquina de deseo

- **Grilla** (estética del branding kit): rotación producto impecable / tag rich / social proof.
- **Formatos que ya sabemos que funcionan**: reels con hook + producto en pantalla (pipeline HTML→MP4 de WSK_INSTAGRAM sirve acá), sorteos express (ya los hacía Richard v1 — el flyer del Día del Padre es el molde), unboxing del packaging negro+oro.
- **Bio**: "El rich estaba en el nombre. 👑 Ray-Ban originales + RICH line · 3 cuotas · envío gratis" + link a la landing.
- **Ads Meta** (cuando haya rodaje): SOLO producto RICH line o fotos propias sin logos de terceros en el creativo (regla Baires: nunca marcas/logos en ads). Destino: WhatsApp (CTWA, molde Whynot).

## 5. Sistema (lo que WESEKA monta atrás)

- **Stock único**: una planilla/DB madre (Sheet-as-DB al arranque) sincronizada a mano ML + TN; si escala, panel tipo Bochile/IAGRO.
- **CRM**: cada contacto de WA e IG entra a un pipeline (molde wsk_ del Panel Interno).
- **n8n**: avisos de venta, seguimiento post-venta, alertas de stock bajo.
- **Métricas semanales**: ventas por canal, margen por línea, CAC de ads, tasa de cierre WA.

## 6. Roadmap de lanzamiento

| Semana | Hito |
|---|---|
| 1 | Branding v2 aplicado (logo intervenido, portadas IG, packaging encargado). Fotos/renders de los 10 modelos top del Drive. |
| 2 | ML: 10 publicaciones pro. WhatsApp Business configurado. Landing demo pulida y online. |
| 3 | IG relanzado con la grilla nueva + sorteo express de relanzamiento (molde v1, estética v2). |
| 4 | Tienda Nube activa con RICH line Drop 001. Primera pauta CTWA chica. |

## 7. Pendientes que dependen de Juani

- [ ] **Drive del catálogo Ray-Ban**: compartir con "cualquiera con el enlace" (hoy está restringido, no pude entrar).
- [ ] Confirmar proveedor/stock actual: qué modelos originales hay HOY y a qué costo.
- [ ] Número de WhatsApp comercial para Richard Lens.
- [ ] Usuario IG: ¿se recupera la cuenta vieja de Richard Lens o arrancamos de cero?
- [ ] Presupuesto inicial de pauta.
