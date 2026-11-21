"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#ff6a3d", "#ffb04a", "#c26bff", "#5b7bff", "#f5f5f5", "#7ee0ff", "#ff5f8f"];
const EVENT = "naman:confetti";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  life: number;
};

/** Fire a burst of confetti from a point on screen (defaults to the top centre). */
export function fireConfetti(x?: number, y?: number, count = 160) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { x, y, count } }));
}

/** Confetti across the whole page: bursts from several points plus a rain from the top. */
export function fireConfettiEverywhere() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { rain: true, count: w < 640 ? 220 : 420 } }));
  const points = [
    [0.15, 0.7],
    [0.85, 0.7],
    [0.5, 0.45],
    [0.3, 0.25],
    [0.7, 0.25],
  ];
  points.forEach(([px, py], i) =>
    window.setTimeout(() => fireConfetti(w * px, h * py, w < 640 ? 90 : 150), i * 180),
  );
}

export function ConfettiCanvas({ onLoad = false }: { onLoad?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let pieces: Piece[] = [];
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces = pieces.filter((p) => p.life > 0 && p.y < window.innerHeight + 40);
      for (const p of pieces) {
        p.vy = Math.min(p.vy + 0.18, 7);
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 40);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
        ctx.restore();
      }
      raf = pieces.length ? requestAnimationFrame(tick) : 0;
    };

    const burst = (e: Event) => {
      if (reduced) return;
      const d = (e as CustomEvent).detail ?? {};
      if (d.rain) {
        for (let i = 0; i < (d.count ?? 300); i++) {
          pieces.push({
            x: Math.random() * window.innerWidth,
            y: -20 - Math.random() * window.innerHeight * 0.8,
            vx: (Math.random() - 0.5) * 2,
            vy: 1 + Math.random() * 3,
            w: 6 + Math.random() * 6,
            h: 8 + Math.random() * 8,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.3,
            color: COLORS[(Math.random() * COLORS.length) | 0],
            life: 420 + Math.random() * 120,
          });
        }
        if (!raf) raf = requestAnimationFrame(tick);
        return;
      }
      const ox = d.x ?? window.innerWidth / 2;
      const oy = d.y ?? window.innerHeight * 0.25;
      const n = d.count ?? 160;
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 9;
        pieces.push({
          x: ox,
          y: oy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          life: 180 + Math.random() * 80,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener(EVENT, burst);
    const t = onLoad ? window.setTimeout(() => fireConfetti(undefined, undefined, 220), 700) : 0;

    return () => {
      window.clearTimeout(t);
      window.removeEventListener(EVENT, burst);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, [onLoad]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
    />
  );
}
