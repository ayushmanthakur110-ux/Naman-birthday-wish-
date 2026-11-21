"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

/**
 * The birthday video that plays when Chammu says "Yes".
 * Re-encoded from the HDR HEVC export to SDR H.264 (1080×1920, 30 fps, ~5 MB) so every browser can play it.
 */
const VIDEO_SRC = "/video/birthday-surprise.mp4";
const POSTER_SRC = "/video/birthday-surprise-poster.jpg";

export type SurpriseVideoHandle = {
  /** Start downloading the video ahead of time. */
  preload(): void;
  /** Open full screen and play with sound, from the start. Call from a click handler. */
  play(): void;
};

/**
 * Full-screen self-hosted video with no visible player UI at all
 * (no `controls`, no picture-in-picture, no cast button, no context menu).
 * Playback starts inside the "Yes" click, so browsers allow it with sound.
 */
export const SurpriseVideo = forwardRef<SurpriseVideoHandle, { onClose?: () => void }>(function SurpriseVideo(
  { onClose },
  ref,
) {
  const overlay = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const closing = useRef(false);
  const [open, setOpen] = useState(false);
  // portal target: rendered on <body> so no transformed/clipped ancestor can trap the full-screen layer
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  useEffect(() => setPortal(document.body), []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const v = video.current;
    const finish = () => {
      v?.pause();
      if (v) v.volume = 1;
      closing.current = false;
      setOpen(false);
      onClose?.();
    };
    if (!overlay.current) return finish();
    // fade picture and sound out together
    if (v) gsap.to(v, { volume: 0, duration: 0.5 });
    gsap.to(overlay.current, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut", onComplete: finish });
  }, [onClose]);

  useImperativeHandle(ref, () => ({
    preload: () => {
      const v = video.current;
      if (v && v.preload !== "auto") {
        v.preload = "auto";
        v.load();
      }
    },
    play: () => {
      const v = video.current;
      if (!v) return;
      closing.current = false;
      setOpen(true);
      if (overlay.current) {
        gsap.killTweensOf(overlay.current);
        gsap.fromTo(overlay.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
      }
      gsap.killTweensOf(v);
      v.currentTime = 0;
      v.muted = false;
      v.volume = 1;
      // called synchronously inside the click → allowed with sound in every major browser
      v.play().catch(() => {
        // only under very strict browser settings: keep playing (muted) rather than freeze — no prompt
        v.muted = true;
        v.play().catch(() => {});
      });
    },
  }));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!portal) return null;

  return createPortal(
    <div
      ref={overlay}
      role="dialog"
      aria-modal={open}
      aria-label="Birthday video for Chammu"
      aria-hidden={!open}
      className="invisible fixed inset-0 z-[70] grid place-items-center bg-black/90 opacity-0 backdrop-blur-md"
    >
      <div className="relative aspect-[9/16] h-[min(88svh,calc(92vw*16/9))] overflow-hidden rounded-[20px] bg-black shadow-[var(--shadow-token-3)]">
        <video
          ref={video}
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          preload="none"
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
          onEnded={close}
          onContextMenu={(e) => e.preventDefault()}
          className="pointer-events-none h-full w-full object-cover select-none"
        />
      </div>
    </div>,
    portal,
  );
});
