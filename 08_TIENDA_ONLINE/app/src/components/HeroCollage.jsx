import React, { useState } from 'react';
import RichAvatar from './RichAvatar.jsx';

/* Lado derecho del hero: el modelo RICH con los lentes puestos.
 * Si existe /img/rich-hero.png (foto/render IA del personaje, fondo transparente o recortado),
 * la usa. Si no, cae al avatar NFT vectorial. Soltar la imagen en app/public/img/ y rebuild. */

const STICKERS = [
  { texto: 'DROP 001', className: 'sticker sticker-chip', style: { top: '2%', right: '0%', background: 'var(--amarillo)', color: 'var(--tinta)', fontSize: '.9rem', '--rot': '7deg' }, delay: .5 },
  { texto: 'original, no cap', className: 'sticker', style: { bottom: '6%', left: '-4%', fontSize: '1.5rem', color: 'var(--tinta)', '--rot': '-6deg' }, delay: .75 },
  { texto: '$', className: 'sticker', style: { top: '10%', left: '2%', fontSize: '3.2rem', color: 'var(--tinta)', '--rot': '-12deg' }, delay: 1 },
];

export default function HeroCollage() {
  const [hayFoto, setHayFoto] = useState(true);

  return (
    <div className="hero-avatar">
      {hayFoto ? (
        <img
          src="/img/rich-hero.png"
          alt="RICH con los lentes puestos"
          className="hero-modelo"
          onError={() => setHayFoto(false)}
        />
      ) : (
        <RichAvatar />
      )}
      {STICKERS.map((s, i) => (
        <span key={i} className={s.className} style={{ ...s.style, animationDelay: s.delay + 's' }}>{s.texto}</span>
      ))}
    </div>
  );
}
