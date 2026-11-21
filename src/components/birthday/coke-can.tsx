"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll path for the can, as page progress keyframes.
 * x is relative to half the viewport width (-1 = left edge, 1 = right edge),
 * y relative to half the viewport height. Kept to the sides so it never sits behind body text.
 */
const PATH = [
  { x: 0.74, y: 0.05, s: 1.0, tilt: -0.32 }, // hero, right of the headline
  { x: -0.76, y: -0.05, s: 0.95, tilt: 0.3 }, // the birthday boy
  { x: 0.78, y: 0.1, s: 0.9, tilt: -0.25 }, // memories
  { x: -0.78, y: 0, s: 0.95, tilt: 0.28 }, // wishes
  { x: 0.76, y: -0.05, s: 0.95, tilt: -0.3 }, // note
  { x: 0.62, y: -0.08, s: 1.15, tilt: -0.12 }, // the question, beside the buttons
];

export function CokeCan() {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
      camera.position.set(0, 0, 5);

      // rim lights in the page's ember / ion colours
      const ember = new THREE.DirectionalLight(0xff6a3d, 2.2);
      ember.position.set(-3, 2, 1.5);
      const ion = new THREE.DirectionalLight(0x5b7bff, 2.4);
      ion.position.set(3, -1, 1);
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(0, 3, 4);
      scene.add(ember, ion, key, new THREE.AmbientLight(0xffffff, 0.35));

      const pivot = new THREE.Group();
      scene.add(pivot);

      const gltf = await new GLTFLoader().loadAsync("/models/diet-coke.glb");
      if (disposed) return;
      const can = gltf.scene;
      can.traverse((o) => {
        const m = (o as import("three").Mesh).material as import("three").MeshStandardMaterial | undefined;
        if (m && "metalness" in m) {
          m.metalness = 0.45;
          m.roughness = 0.32;
          m.envMapIntensity = 1.1;
        }
      });
      pivot.add(can);

      // ---- sizing ----
      const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      let halfW = halfH;
      let mobile = false;
      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        halfW = halfH * camera.aspect;
        mobile = w < 768;
      };
      resize();
      window.addEventListener("resize", resize);

      // ---- scroll-driven state ----
      const state = { ...PATH[0] };
      const tl = gsap.timeline({ paused: true, defaults: { ease: "sine.inOut", duration: 1 } });
      PATH.slice(1).forEach((k) => tl.to(state, { ...k }));
      const st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: 0,
        end: "max",
        scrub: reduced ? false : 1.2,
        animation: tl,
      });

      let spin = 0;
      let last = performance.now();
      let raf = 0;
      const render = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!reduced) spin += dt * 0.45;
        const p = st.progress;
        const scale = state.s * (mobile ? 0.62 : 1);
        // on phones push it further out so text stays readable
        const xRel = mobile ? Math.sign(state.x) * Math.min(1.05, Math.abs(state.x) + 0.32) : state.x;
        pivot.position.set(xRel * halfW, state.y * halfH + Math.sin(now / 1400) * 0.04, 0);
        pivot.scale.setScalar(scale);
        pivot.rotation.set(0.12 + Math.sin(now / 2100) * 0.05, spin + p * Math.PI * 6, state.tilt);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);
      gsap.to(el, { autoAlpha: 1, duration: 1.4, ease: "power2.out", delay: 0.6 });

      const onVis = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) {
          last = performance.now();
          raf = requestAnimationFrame(render);
        }
      };
      document.addEventListener("visibilitychange", onVis);

      cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener("resize", resize);
        st.kill();
        tl.kill();
        scene.traverse((o) => {
          const mesh = o as import("three").Mesh;
          mesh.geometry?.dispose();
          const mat = mesh.material as import("three").MeshStandardMaterial | undefined;
          mat?.map?.dispose();
          mat?.dispose?.();
        });
        scene.environment?.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch((err) => {
      // WebGL unavailable or model failed: the page works fine without the can.
      if (process.env.NODE_ENV !== "production") console.warn("[CokeCan]", err);
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="pointer-events-none invisible fixed inset-0 z-0 opacity-0 max-md:!opacity-60"
    />
  );
}
