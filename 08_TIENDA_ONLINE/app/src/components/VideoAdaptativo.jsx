import React, { useEffect, useRef, useState } from 'react';

/* Un video que se adapta al dispositivo.
 *
 * El hero pesaba 23 MB en 2560px: en datos móviles no cargaba nunca y el
 * usuario veía un hueco. Acá se elige la versión liviana en pantallas chicas
 * (o cuando el navegador avisa que la conexión es lenta) y va con poster,
 * así se ve algo desde el primer instante mientras el video baja.
 *
 * iOS además exige muted + playsInline para reproducir sin gesto del usuario,
 * y a veces ignora el autoplay: por eso se fuerza play() cuando puede.
 */
export default function VideoAdaptativo({ src, movil, poster, className, style, onError, ...resto }) {
  const [fuente, setFuente] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const angosto = window.matchMedia('(max-width: 900px)').matches;
    const con = navigator.connection;
    const lenta = con && (con.saveData || /2g|3g/i.test(con.effectiveType || ''));
    setFuente(movil && (angosto || lenta) ? movil : src);
  }, [src, movil]);

  useEffect(() => {
    const v = ref.current;
    if (!v || !fuente) return;
    // Safari en iOS a veces ignora el autoplay del markup
    const intentar = () => v.play?.().catch(() => {});
    v.addEventListener('loadeddata', intentar);
    intentar();
    return () => v.removeEventListener('loadeddata', intentar);
  }, [fuente]);

  if (!fuente) return poster ? <img src={poster} alt="" className={className} style={style} /> : null;

  return (
    <video
      ref={ref}
      src={fuente}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      className={className}
      style={style}
      onError={onError}
      {...resto}
    />
  );
}
