"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** 0 → 1 scroll progress through the hero; written by GSAP ScrollTrigger. */
  progress: React.RefObject<number>;
  className?: string;
};

const EMBER = [255, 106, 61];
const FLARE = [194, 107, 255];
const ION = [91, 123, 255];

function mix(a: number[], b: number[], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Luminous ring of ember-to-ion particles that breathes, and opens up as you scroll. */
export function ParticleRing({ progress, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;

    const count = window.innerWidth < 640 ? 900 : 1800;
    const parts = Array.from({ length: count }, () => {
      const a = Math.random() * Math.PI * 2;
      const band = (Math.random() - 0.5) * 2;
      const y = (Math.sin(a) + 1) / 2; // 0 top → 1 bottom
      const rgb = y < 0.5 ? mix(EMBER, FLARE, y * 2) : mix(FLARE, ION, (y - 0.5) * 2);
      return {
        a,
        band: band * band * Math.sign(band),
        speed: 0.0006 + Math.random() * 0.0018,
        phase: Math.random() * Math.PI * 2,
        size: 0.5 + Math.random() * 1.6,
        rgb: `${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0}`,
        alpha: 0.25 + Math.random() * 0.6,
      };
    });

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
    };
    resize();

    let raf = 0;
    let running = true;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const p = Math.min(1, Math.max(0, progress.current ?? 0));
      const cx = w / 2;
      const cy = h * 0.42;
      // phones: a wider ring that frames the copy instead of crossing it
      const base = (w < 640 ? w * 0.66 : Math.min(w, h) * 0.36) * (1 + p * 0.9);
      const thick = base * (0.09 + p * 0.25);

      // fade previous frame → soft trails, keeping the canvas transparent so the 3D can shows through
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = reduced ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const fade = 1 - p * 0.85;
      for (const q of parts) {
        const a = q.a + t * q.speed * 60 * (1 + p * 2);
        const wobble =
          Math.sin(a * 5 + t * 0.9 + q.phase) * 0.06 +
          Math.sin(a * 9 - t * 1.3) * 0.035 +
          Math.sin(a * 2 + t * 0.4) * 0.05;
        const r = base * (1 + wobble) + q.band * thick;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * (0.96 + p * 0.1);
        ctx.fillStyle = `rgba(${q.rgb},${q.alpha * fade})`;
        ctx.beginPath();
        ctx.arc(x, y, q.size, 0, Math.PI * 2);
        ctx.fill();
      }
      if (running && !reduced) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(([e]) => {
      const vis = e.isIntersecting && !document.hidden;
      if (vis && !running) {
        running = true;
        raf = requestAnimationFrame(draw);
      } else if (!vis) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [progress]);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
