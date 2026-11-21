"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";

/** The birthday Short that plays when Chammu says "Yes". */
const VIDEO_ID = "tZdfzED9tRg";

/* ---------- minimal YouTube IFrame API types ---------- */
type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(s: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(v: number): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      host?: string;
      videoId: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, string | number>;
      events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
    },
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
  return apiPromise;
}

const PLAYING = 1;
const ENDED = 0;

export type SurpriseVideoHandle = {
  /** Warm the player up ahead of time (paused, off-screen). */
  preload(): void;
  /** Open full screen and play with sound, from the start. Call from a click handler. */
  play(): void;
};

/**
 * Full-screen YouTube Short with no visible YouTube UI:
 * controls off, a transparent shield on top (no hover / tap → no title bar or play/pause),
 * a slight zoom that crops YouTube's edge branding, and it closes itself just before the end screen.
 */
export const SurpriseVideo = forwardRef<SurpriseVideoHandle, { onClose?: () => void }>(function SurpriseVideo(
  { onClose },
  ref,
) {
  const overlay = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const ready = useRef<Promise<YTPlayer> | null>(null);
  const watch = useRef(0);
  /** true only once the current playback has really started (guards against a stale "ended" on replay) */
  const armed = useRef(false);
  const [open, setOpen] = useState(false);
  /** true once the video is really playing with sound; until then taps go straight to the player */
  const [live, setLive] = useState(false);
  const nudge = useRef(0);
  /** true once frames are actually moving; until then a black cover hides YouTube's thumbnail + Shorts play icon */
  const [playing, setPlaying] = useState(false);
  // portal target: rendered on <body> so no transformed/clipped ancestor can trap the full-screen layer
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  useEffect(() => setPortal(document.body), []);

  const closing = useRef(false);
  const close = useCallback(
    () => {
      if (closing.current) return;
      closing.current = true;
      armed.current = false;
      window.clearInterval(watch.current);
      window.clearInterval(nudge.current);
      const p = player.current;
      const finish = () => {
        // only touch the player once the layer is fully invisible,
        // so YouTube's pause flash is never seen
        p?.stopVideo();
        p?.setVolume(100);
        closing.current = false;
        setOpen(false);
        onClose?.();
      };
      if (!overlay.current) return finish();
      const vol = { v: 100 };
      gsap.to(vol, { v: 0, duration: 0.5, onUpdate: () => p?.setVolume(vol.v) });
      gsap.to(overlay.current, { autoAlpha: 0, duration: 0.5, ease: "power2.inOut", onComplete: finish });
    },
    [onClose],
  );

  const ensurePlayer = useCallback(() => {
    ready.current ??= loadYouTubeApi().then(
      (YT) =>
        new Promise<YTPlayer>((resolve) => {
          const host = document.createElement("div");
          mount.current!.appendChild(host);
          const p = new YT.Player(host, {
            host: "https://www.youtube-nocookie.com",
            videoId: VIDEO_ID,
            width: "100%",
            height: "100%",
            playerVars: {
              controls: 0,
              disablekb: 1,
              fs: 0,
              rel: 0,
              iv_load_policy: 3,
              playsinline: 1,
              cc_load_policy: 0,
              modestbranding: 1,
              mute: 0, // sound on by default; nothing plays until "Yes" is clicked
              autoplay: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: () => resolve(p),
              onStateChange: (e) => {
                if (e.data === PLAYING && p.getCurrentTime() < 1) armed.current = true;
                if (e.data === PLAYING) setPlaying(true);
                if (e.data === ENDED && armed.current) close();
              },
            },
          });
          player.current = p;
        }),
    );
    return ready.current;
  }, [close]);


  const startPlayback = useCallback(
    (p: YTPlayer) => {
      armed.current = false;
      p.seekTo(0, true);
      p.unMute();
      p.setVolume(100);
      p.playVideo();
      // Sound is always ON — the video is never muted and there is no "tap for sound" prompt.
      // Keep nudging the player (unmuted) until it is really playing with sound.
      const BUFFERING = 3;
      const started = Date.now();
      setLive(false);
      setPlaying(false);
      window.clearInterval(nudge.current);
      nudge.current = window.setInterval(() => {
        const state = p.getPlayerState();
        if (state === PLAYING) {
          if (p.isMuted()) {
            p.unMute();
            p.setVolume(100);
          } else {
            window.clearInterval(nudge.current);
            setLive(true);
            return;
          }
        } else if (state !== BUFFERING) {
          p.unMute();
          p.playVideo();
        }
        if (Date.now() - started > 20000) window.clearInterval(nudge.current);
      }, 250);
      // leave a beat before YouTube's end screen can appear
      window.clearInterval(watch.current);
      watch.current = window.setInterval(() => {
        const d = p.getDuration();
        const t = p.getCurrentTime();
        if (!armed.current && p.getPlayerState() === PLAYING && t < 1) armed.current = true;
        if (armed.current && d > 0 && t >= d - 0.35) close();
      }, 150);
    },
    [close],
  );

  useImperativeHandle(ref, () => ({
    preload: () => void ensurePlayer(),
    play: () => {
      setOpen(true);
      if (overlay.current) {
        gsap.fromTo(overlay.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
      }
      if (player.current && ready.current) {
        // player already warm: call synchronously inside the click for the best autoplay-with-sound chance
        startPlayback(player.current);
      } else {
        ensurePlayer().then(startPlayback);
      }
    },
  }));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(
    () => () => {
      window.clearInterval(watch.current);
      window.clearInterval(nudge.current);
      player.current?.destroy();
    },
    [],
  );

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
      <div
        className="relative aspect-[9/16] h-[min(88svh,calc(92vw*16/9))] overflow-hidden rounded-[20px] bg-black shadow-[var(--shadow-token-3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* zoomed slightly so YouTube's edge branding falls outside the rounded frame */}
        <div ref={mount} className="absolute inset-0 origin-center scale-[1.22] [&_iframe]:h-full [&_iframe]:w-full" />
        {/* transparent shield: once playing, the player never gets hover/taps, so it never shows its UI.
            Until then it lets taps through, so a phone that blocked the start can begin (with sound) on a tap. */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-10 bg-transparent ${live ? "" : "pointer-events-none"}`}
        />
        {/* cover: hides YouTube's thumbnail, Shorts logo and play button until the video is really playing.
            pointer-events-none, so if a phone blocked the start, a tap still reaches the player underneath. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black transition-opacity duration-300 ${
            playing ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="size-8 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
        </div>
      </div>
    </div>,
    portal,
  );
});
