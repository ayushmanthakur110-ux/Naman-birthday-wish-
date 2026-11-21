"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { ArrowDown, ArrowRight, ChevronDown, Sparkles } from "lucide-react";

import { CokeCan } from "./coke-can";
import { ConfettiCanvas } from "./confetti";
import { ParticleRing } from "./particle-ring";
import { WishQuestion } from "./wish-question";

import boat from "../../../public/naman/boat.jpg";
import club from "../../../public/naman/club.jpg";
import dp from "../../../public/naman/dp.jpg";
import hero from "../../../public/naman/hero-cutout.webp";
import kurta from "../../../public/naman/kurta.jpg";
import party from "../../../public/naman/party.jpg";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const INSTAGRAM = "https://www.instagram.com/kr_naman21/";

const facts = [
  { tag: "जन्म", title: "Born on 21 November", body: "The day the family got its loudest laugh." },
  { tag: "कर्म", title: "Engineering", body: "Builds things, fixes things, explains things — whether you asked or not." },
  { tag: "धर्म", title: "Sanatan", body: "Mahakal, Mahadev, Radhe Radhe. Never misses a darshan." },
  { tag: "देश", title: "Proud to be an Indian", body: "Tiranga in the bio, tiranga in the heart." },
];

const memories = [
  { src: party, title: "Cheers to you, bhai", meta: "The smile that runs the party", alt: "Naman smiling and raising a glass at a party" },
  { src: club, title: "Main character energy", meta: "The stage was always yours", alt: "Naman posing in front of a DJ stage in a white polo" },
  { src: kurta, title: "Radhe Radhe", meta: "Blue kurta, best smile", alt: "Naman smiling in a blue kurta next to a golden peacock feather sculpture" },
  { src: boat, title: "Ghat mornings", meta: "Boat ride, scarf on, grin on", alt: "Selfie of Naman smiling on a boat, wearing glasses and a checked scarf" },
];

const wishes = [
  { title: "Good health", body: "Strong, rested, and back at the gym (eventually). Every day of this year should feel lighter." },
  { title: "Great work", body: "Code that compiles on the first try, bugs that fix themselves, and an engineering year you're proud of." },
  { title: "New places", body: "More Jaipur nights, more temple mornings, more road trips with the people you love." },
  { title: "Blessings", body: "Mahadev's hand on every step you take, and Radhe Rani's smile on every plan you make." },
  { title: "Us, always", body: "The family — loud, together, and cheering for you. That part never changes." },
];

export function BirthdayExperience() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const show = (targets: gsap.TweenTarget) => gsap.set(targets, { autoAlpha: 1 });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        show("[data-anim]");
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // ---------- Hero intro ----------
        const split = SplitText.create("[data-split]", { type: "chars", mask: "chars" });
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.fromTo("[data-anim='nav']", { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 1 }, 0)
          .fromTo("[data-anim='badge']", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.15)
          .set("[data-anim='title']", { autoAlpha: 1 }, 0.2)
          .from(split.chars, { yPercent: 110, duration: 1.2, stagger: 0.025 }, 0.2)
          .fromTo("[data-anim='name']", { autoAlpha: 1, yPercent: 110 }, { autoAlpha: 1, yPercent: 0, duration: 1.3 }, 0.55)
          .fromTo("[data-anim='sub']", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.75)
          .fromTo("[data-anim='cta']", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.9)
          // main image: rises from the bottom and fades in
          .fromTo(
            "[data-anim='hero-img']",
            { autoAlpha: 0, y: 220, scale: 0.96, filter: "blur(18px)" },
            { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 2.2 },
            0.5,
          );

        // ---------- Hero scroll: ring opens, text + image fade out ----------
        ScrollTrigger.create({
          trigger: "[data-hero]",
          start: "top top",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            progress.current = self.progress;
          },
        });
        gsap.to("[data-hero-copy]", {
          autoAlpha: 0,
          y: -80,
          ease: "none",
          scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "45% top", scrub: true },
        });
        gsap.to("[data-hero-img-wrap]", {
          autoAlpha: 0,
          y: -140,
          scale: 0.9,
          ease: "none",
          scrollTrigger: { trigger: "[data-hero]", start: "35% top", end: "bottom top", scrub: true },
        });

        // ---------- Generic fade-ups ----------
        gsap.utils.toArray<HTMLElement>("[data-anim='up']").forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 40 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1.1,
              ease: "expo.out",
              delay: Number(el.dataset.delay ?? 0),
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            },
          );
        });
      });

      // ---------- Memories: horizontal pin on desktop ----------
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const track = document.querySelector<HTMLElement>("[data-track]");
        if (!track) return;
        const distance = () => track.scrollWidth - window.innerWidth + 64;
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: "[data-memories]",
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -5 },
            {
              xPercent: 5,
              ease: "none",
              scrollTrigger: {
                trigger: "[data-memories]",
                start: "top top",
                end: () => `+=${distance()}`,
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <main ref={root} className="relative flex-1 overflow-x-clip bg-surface-base text-[15.49px] leading-[23.24px] text-text-primary">
      <ConfettiCanvas />
      <CokeCan />

      {/* ---------- Nav ---------- */}
      <header data-anim="nav" className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav
          aria-label="Page sections"
          className="flex w-full max-w-3xl items-center justify-between gap-3 rounded-full bg-surface-raised/80 py-2 pr-2 pl-2 shadow-[var(--shadow-token-3)] backdrop-blur-xl"
        >
          <a href="#top" className="link-quiet flex items-center gap-2.5 rounded-full pr-2 text-text-primary">
            <Image src={dp} alt="" width={32} height={32} className="size-8 rounded-full" />
            <span className="text-[13.94px] font-medium">Chammu · 21.11</span>
          </a>
          <div className="flex items-center gap-1 sm:gap-5">
            <a href="#memories" className="link-quiet hidden text-[13.94px] sm:inline">Memories</a>
            <a href="#wishes" className="link-quiet hidden text-[13.94px] sm:inline">Wishes</a>
            <a href="#note" className="link-quiet hidden text-[13.94px] sm:inline">Note</a>
            <a href="#wish" className="btn btn-primary min-h-9 px-4 text-[13.94px]">Answer me</a>
          </div>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section id="top" data-hero className="relative isolate min-h-[100svh] pt-32 sm:pt-40">
        <ParticleRing progress={progress} className="absolute inset-x-0 top-0 -z-10 h-[100svh] w-full" />

        <div data-hero-copy className="relative mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
          <p
            data-anim="badge"
            className="inline-flex items-center gap-2 rounded-full bg-surface-raised py-1.5 pr-3.5 pl-1.5 text-[12.7px] text-text-primary shadow-[var(--shadow-token-3)]"
          >
            <span className="grid size-6 place-items-center rounded-full bg-surface-strong shadow-[var(--shadow-token-2)]">
              <Sparkles className="size-3.5" aria-hidden="true" />
            </span>
            Welcome to Chammu&apos;s new era
          </p>

          <h1
            data-anim="title"
            className="mt-7 text-[clamp(2.9rem,8.4vw,6.4rem)] leading-[0.98] font-light tracking-[-0.045em]"
          >
            <span data-split className="block">Happy Birthday,</span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span data-anim="name" className="text-gradient-era block font-normal">Chammu</span>
            </span>
          </h1>

          <p data-anim="sub" className="mt-6 max-w-md text-text-secondary">
            21 November 2026. Naman turns the page on another year — engineer, tech talker, proud Indian,
            and the heart of our family.
          </p>

          <div data-anim="cta" className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#memories" className="btn btn-primary pr-1.5">
              See the memories
              <span className="grid size-8 place-items-center rounded-full bg-text-inverse text-text-primary">
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </a>
            <a href="#wish" className="btn btn-ghost">Jump to my question</a>
          </div>
        </div>

        <div data-hero-img-wrap className="relative mx-auto mt-10 w-[min(88vw,460px)] sm:mt-14">
          <div data-anim="hero-img" className="relative">
            <Image
              src={hero}
              alt="Naman smiling in his brown printed tee, posing for a photo with a guest"
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 640px) 460px, 88vw"
              className="h-auto w-full select-none"
              draggable={false}
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-surface-base via-surface-base/70 to-transparent" />
          </div>
          <p className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2 text-[12.7px] text-text-secondary">
            <ArrowDown className="size-3.5" aria-hidden="true" /> Scroll into his year
          </p>
        </div>
      </section>

      {/* ---------- The birthday boy ---------- */}
      <section className="relative mx-auto max-w-6xl px-4 py-24 sm:px-8 lg:py-32">
        <SectionHead index="01" label="The birthday boy" title={<>Naman on paper. <span className="text-text-secondary">Chammu at home.</span></>} />
        <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f, i) => (
            <li key={f.title} data-anim="up" data-delay={i * 0.08} className="card flex min-h-56 flex-col p-6">
              <span className="font-hindi text-3xl text-text-primary">{f.tag}</span>
              <h3 className="mt-auto pt-8 text-[15.49px] font-medium">{f.title}</h3>
              <p className="mt-1.5 text-text-secondary">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Memories ---------- */}
      <section id="memories" data-memories className="relative scroll-mt-0 overflow-hidden py-16 lg:flex lg:h-[100svh] lg:items-center lg:py-0">
        <div
          data-track
          className="flex flex-col gap-4 px-4 sm:px-8 lg:w-max lg:flex-row lg:items-stretch lg:gap-5 lg:pl-[max(2rem,calc((100vw-72rem)/2+2rem))]"
        >
          <div className="flex flex-col justify-end pb-4 lg:w-[360px] lg:shrink-0 lg:pb-10">
            <SectionHead index="02" label="Memories" title={<>A year of <span className="text-gradient-era">Chammu</span></>} />
            <p data-anim="up" className="mt-5 max-w-xs text-text-secondary">
              Straight off his grid. Only the shots where that smile is front and centre.
            </p>
          </div>
          {memories.map((m, i) => (
            <figure
              key={m.title}
              data-anim="up"
              data-delay={i * 0.06}
              className="card group relative overflow-hidden p-2 lg:w-[400px] lg:shrink-0"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] transition-transform duration-700 ease-out group-hover:scale-[1.02]">
                <Image
                  data-parallax
                  src={m.src}
                  alt={m.alt}
                  placeholder="blur"
                  // load all four up front: the sideways-scrolling strip reaches the last card
                  // before lazy loading would have finished, leaving it on the blurred placeholder
                  loading="eager"
                  sizes="(min-width: 1024px) 460px, 92vw"
                  className="absolute inset-y-0 -left-[6%] h-full w-[112%] max-w-none object-cover"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-3 px-2 pt-3 pb-1.5">
                <div>
                  <p className="text-[15.49px] font-medium">{m.title}</p>
                  <p className="text-[13.56px] text-text-secondary">{m.meta}</p>
                </div>
                <span className="rounded-full bg-surface-strong px-2.5 py-1 text-[11.15px] text-text-secondary shadow-[var(--shadow-token-3)]">
                  0{i + 1}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- Wishes ---------- */}
      <section id="wishes" className="relative mx-auto max-w-3xl scroll-mt-24 px-4 py-24 sm:px-8 lg:py-32">
        <SectionHead index="03" label="Wishes" title={<>Five wishes for your <span className="text-gradient-era">new era</span></>} />
        <Accordion items={wishes} />
      </section>

      {/* ---------- Note ---------- */}
      <section id="note" className="relative mx-auto max-w-3xl scroll-mt-24 px-4 pb-24 sm:px-8 lg:pb-32">
        <article data-anim="up" className="card relative overflow-hidden p-7 sm:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(255,106,61,0.25),transparent_65%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(91,123,255,0.22),transparent_65%)]" />
          <p className="text-[12.7px] text-text-secondary">04 — A note for you</p>
          <h2 className="mt-4 text-4xl font-light tracking-[-0.03em] sm:text-5xl">Dear Chammu,</h2>
          <div className="mt-6 space-y-4 text-[16.5px] leading-[1.65] text-text-secondary">
            <p>
              Happy birthday, bhai. Somewhere between the temple trips, the late nights and the long explanations about
              some new piece of tech, you became someone I really look up to.
            </p>
            <p>
              Thank you for showing up, for keeping the family laughing, and for still letting everyone call you Chammu
              without complaining (much). This is your new era — go make it loud.
            </p>
            <p className="font-hindi text-xl text-text-primary">जन्मदिन की बहुत-बहुत शुभकामनाएँ!</p>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-[#9b3fb5] text-lg font-medium text-white">A</span>
            <div>
              <p className="font-medium">Ayushman</p>
              <p className="text-[13.56px] text-text-secondary">your brother, forever</p>
            </div>
          </div>
        </article>
      </section>

      {/* ---------- The question ---------- */}
      <section id="wish" className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] px-4 py-24 sm:px-8 lg:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-full max-w-4xl bg-[radial-gradient(50%_45%_at_50%_45%,rgba(194,107,255,0.14),transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p data-anim="up" className="text-[12.7px] text-text-secondary">05 — One last thing</p>
          <h2 data-anim="up" className="mt-4 text-[clamp(2.4rem,7vw,4.6rem)] leading-[1] font-light tracking-[-0.04em]">
            Did you like my <span className="text-gradient-era font-normal">Wish</span> ??
          </h2>
          <div data-anim="up">
            <WishQuestion />
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-[13.56px] text-text-secondary sm:flex-row sm:px-8">
          <p>Made with love by Ayushman for Naman · 21 November 2026</p>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="link-quiet">
            @kr_naman21 on Instagram
          </a>
        </div>
      </footer>
    </main>
  );
}

function SectionHead({ index, label, title }: { index: string; label: string; title: React.ReactNode }) {
  return (
    <div>
      <p data-anim="up" className="inline-flex items-center gap-2 text-[12.7px] text-text-secondary">
        <span className="rounded-md bg-surface-raised px-1.5 py-0.5 text-[11.15px] text-text-primary shadow-[var(--shadow-token-3)]">
          {index}
        </span>
        {label}
      </p>
      <h2 data-anim="up" data-delay={0.08} className="mt-4 max-w-2xl text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.04] font-light tracking-[-0.035em]">
        {title}
      </h2>
    </div>
  );
}

function Accordion({ items }: { items: { title: string; body: string }[] }) {
  const [open, setOpen] = useState(0);
  const id = useId();
  return (
    <ul className="mt-12 flex flex-col gap-2.5">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.title} data-anim="up" data-delay={i * 0.06} className="card overflow-hidden rounded-[14px]">
            <h3>
              <button
                type="button"
                id={`${id}-b${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-p${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full cursor-pointer items-center gap-4 rounded-[14px] px-4 py-3.5 text-left transition-colors duration-200 hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-strong"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-surface-strong text-[12.7px] text-text-secondary shadow-[var(--shadow-token-3)]">
                  0{i + 1}
                </span>
                <span className="flex-1 font-medium">{it.title}</span>
                <span className="grid size-7 place-items-center rounded-full bg-surface-strong shadow-[var(--shadow-token-2)]">
                  <ChevronDown
                    className={`size-4 text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </span>
              </button>
            </h3>
            <div
              id={`${id}-p${i}`}
              role="region"
              aria-labelledby={`${id}-b${i}`}
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-5 pl-16 text-text-secondary">{it.body}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
