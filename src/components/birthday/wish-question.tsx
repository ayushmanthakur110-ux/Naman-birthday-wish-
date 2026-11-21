"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Heart, Volume2 } from "lucide-react";

import { fireConfettiEverywhere } from "./confetti";
import { SurpriseVideo, type SurpriseVideoHandle } from "./surprise-video";

const NO_TAUNTS = [
  "Nope, that button is shy.",
  "It really doesn't want to be pressed.",
  "Try the other one 😄",
  "Chammu, be honest…",
];

export function WishQuestion() {
  const arenaRef = useRef<HTMLDivElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);
  const video = useRef<SurpriseVideoHandle>(null);
  const [state, setState] = useState<"idle" | "loading" | "yes">("idle");
  const [dodges, setDodges] = useState(0);

  // warm the video player up once the question is close to the screen
  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          video.current?.preload();
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /** Move the No button somewhere inside the arena, away from the pointer. */
  const dodge = (px?: number, py?: number) => {
    const arena = arenaRef.current;
    const btn = noRef.current;
    if (!arena || !btn) return;
    const a = arena.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    const cur = { x: Number(gsap.getProperty(btn, "x")), y: Number(gsap.getProperty(btn, "y")) };
    // the button's untransformed origin inside the arena
    const ox = b.left - cur.x - a.left;
    const oy = b.top - cur.y - a.top;
    const pointerX = (px ?? b.left + b.width / 2) - a.left;
    const pointerY = (py ?? b.top + b.height / 2) - a.top;

    let tx = 0;
    let ty = 0;
    for (let i = 0; i < 24; i++) {
      const nx = Math.random() * (a.width - b.width);
      const ny = Math.random() * (a.height - b.height);
      tx = nx;
      ty = ny;
      const d = Math.hypot(nx + b.width / 2 - pointerX, ny + b.height / 2 - pointerY);
      if (d > Math.min(220, a.width / 2.2)) break;
    }
    gsap.to(btn, { x: tx - ox, y: ty - oy, rotation: gsap.utils.random(-12, 12), duration: 0.35, ease: "power3.out" });
    setDodges((n) => n + 1);
  };

  const sayYes = () => {
    setState("loading");
    // the surprise video starts straight away (inside the click, for autoplay with sound)
    video.current?.play();
    setState("yes");
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div
        ref={arenaRef}
        className="relative mt-12 flex h-64 w-full max-w-xl items-center justify-center gap-4 sm:h-72"
      >
        <button
          type="button"
          onClick={sayYes}
          data-loading={state === "loading"}
          aria-describedby="wish-status"
          className="btn btn-primary relative z-10 min-w-32 px-8 text-base"
        >
          <Heart className="size-4" aria-hidden="true" />
          {state === "yes" ? "Yes, again!" : "Yes"}
        </button>
        <button
          ref={noRef}
          type="button"
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") dodge(e.clientX, e.clientY);
          }}
          onPointerDown={(e) => {
            // touch / pen: hop away before the tap can land
            if (e.pointerType !== "mouse") {
              e.preventDefault();
              dodge(e.clientX, e.clientY);
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            dodge();
          }}
          aria-describedby="wish-status"
          className="btn btn-ghost relative z-10 min-w-32 px-8 text-base touch-none"
        >
          No
        </button>
      </div>

      <div id="wish-status" aria-live="polite" className="min-h-16 text-[15.49px] text-text-secondary">
        {state === "yes" ? (
          <p className="text-2xl font-light text-text-primary sm:text-3xl">
            Yay! Happy birthday, <span className="text-gradient-era font-normal">Chammu</span>. Welcome to your new era.
          </p>
        ) : dodges > 0 ? (
          <p>{NO_TAUNTS[(dodges - 1) % NO_TAUNTS.length]}</p>
        ) : (
          <p className="inline-flex items-center gap-2">
            <Volume2 className="size-4" aria-hidden="true" /> Sound on for the best answer.
          </p>
        )}
      </div>
      <SurpriseVideo
        ref={video}
        onClose={() => {
          // confetti lands the moment the video fades away
          fireConfettiEverywhere();
          window.setTimeout(fireConfettiEverywhere, 1400);
        }}
      />
    </div>
  );
}
