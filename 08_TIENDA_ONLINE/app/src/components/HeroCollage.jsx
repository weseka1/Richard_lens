import React from 'react';
import RichAvatar from './RichAvatar.jsx';

/* El lado derecho del hero: RICH modelando los lentes + stickers estampados. */

const STICKERS = [
  { texto: 'DROP 001', className: 'sticker sticker-chip', style: { top: '2%', right: '0%', background: 'var(--amarillo)', color: 'var(--tinta)', fontSize: '.9rem', '--rot': '7deg' }, delay: .5 },
  { texto: 'original, no cap', className: 'sticker', style: { bottom: '6%', left: '-4%', fontSize: '1.5rem', color: 'var(--tinta)', '--rot': '-6deg' }, delay: .75 },
  { texto: '$', className: 'sticker', style: { top: '10%', left: '2%', fontSize: '3.2rem', color: 'var(--tinta)', '--rot': '-12deg' }, delay: 1 },
];

export default function HeroCollage() {
  return (
    <div className="hero-avatar">
      <RichAvatar />
      {STICKERS.map((s, i) => (
        <span key={i} className={s.className} style={{ ...s.style, animationDelay: s.delay + 's' }}>{s.texto}</span>
      ))}
    </div>
  );
}
