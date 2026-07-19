import React, { useEffect, useRef } from 'react';

/* Collage estilo Alec: foto sticker + tags que se estampan uno a uno + $ flotando.
 * Parallax suave con el mouse. Cero WebGL: carga instantánea. */

const STICKERS = [
  { texto: '$', className: 'sticker', style: { top: '-7%', left: '-6%', fontSize: '3.4rem', color: 'var(--verde)', '--rot': '-12deg' }, delay: .55 },
  { texto: 'original, no cap', className: 'sticker', style: { bottom: '-4%', left: '4%', fontSize: '1.5rem', color: 'var(--rojo)', '--rot': '-5deg' }, delay: .75 },
  { texto: 'DROP 001', className: 'sticker sticker-chip', style: { top: '6%', right: '-5%', background: 'var(--oro-hi)', color: 'var(--tinta)', fontSize: '.85rem', '--rot': '7deg' }, delay: .95 },
  { texto: '👑', className: 'sticker', style: { bottom: '14%', right: '-7%', fontSize: '2.6rem', '--rot': '10deg' }, delay: 1.15 },
];

const BILLETES = [
  { left: '6%', size: '1.6rem', dur: '19s', delay: '0s' },
  { left: '22%', size: '2.4rem', dur: '25s', delay: '-9s' },
  { left: '47%', size: '1.3rem', dur: '17s', delay: '-4s' },
  { left: '68%', size: '2rem', dur: '23s', delay: '-14s' },
  { left: '88%', size: '1.5rem', dur: '20s', delay: '-7s' },
];

export function BilletesFondo() {
  return (
    <div className="billetes" aria-hidden="true">
      {BILLETES.map((b, i) => (
        <span key={i} className="billete" style={{ left: b.left, fontSize: b.size, animationDuration: b.dur, animationDelay: b.delay }}>$</span>
      ))}
    </div>
  );
}

export default function HeroCollage() {
  const ref = useRef(null);

  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return;
    const el = ref.current;
    if (!el) return;
    const move = e => {
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      el.style.transform = `rotate(3deg) translate(${x * 10}px, ${y * 7}px)`;
    };
    addEventListener('mousemove', move, { passive: true });
    return () => removeEventListener('mousemove', move);
  }, []);

  return (
    <div className="hero-foto" ref={ref}>
      <div className="foto-marco">
        <img src="/img/wayfarer-34.jpg" alt="Ray-Ban Wayfarer negro mate — stock real Richard Lens" fetchPriority="high" />
      </div>
      {STICKERS.map((s, i) => (
        <span key={i} className={s.className} style={{ ...s.style, animationDelay: s.delay + 's' }}>{s.texto}</span>
      ))}
    </div>
  );
}
