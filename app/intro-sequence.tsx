"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { SpriteCharacter, type AnimState } from "./sprite-character";
import { UnityModal } from "./unity-modal";

type Side = "left" | "right";
type ChapterId =
  | "brand-films"
  | "performance-ads"
  | "stand-up"
  | "content-creation"
  | "blogs";

type Chapter = {
  id: ChapterId;
  eyebrow: string;
  title: string;
  side: Side;
  start: number;
  end: number;
  accent: string;
  snippets: string[];
};

type Motion = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  glow: number;
  evolution: number;
  landed: boolean;
  world: ChapterId | "void" | "build" | "impact" | "reveal";
  anim: AnimState;
  flipX: boolean;
  somersault: number; // 0-1 normalized for somersault rotation
  animProgress: number; // 0-1 progress within the current animation segment
};

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;
type RouteWorld = Motion["world"];
type Route = {
  start: number;
  end: number;
  from: Side;
  to: Side;
  world: RouteWorld;
  rotation: number;
};

const chapters: Chapter[] = [
  {
    id: "brand-films",
    eyebrow: "Chapter 01",
    title: "BRAND FILMS",
    side: "right",
    start: 0.16,
    end: 0.3,
    accent: "#67e8f9",
    snippets: ["Launch", "Manifesto", "Founder film"],
  },
  {
    id: "performance-ads",
    eyebrow: "Chapter 02",
    title: "PERFORMANCE ADS",
    side: "left",
    start: 0.3,
    end: 0.44,
    accent: "#a3e635",
    snippets: ["CTR lift", "Funnels", "Scale tests"],
  },
  {
    id: "stand-up",
    eyebrow: "Chapter 03",
    title: "STAND-UP",
    side: "right",
    start: 0.44,
    end: 0.58,
    accent: "#facc15",
    snippets: ["Clips", "Crowd work", "Sets"],
  },
  {
    id: "content-creation",
    eyebrow: "Chapter 04",
    title: "CONTENT CREATION",
    side: "left",
    start: 0.58,
    end: 0.72,
    accent: "#fb7185",
    snippets: ["Reels", "Thumbnails", "Timelines"],
  },
  {
    id: "blogs",
    eyebrow: "Chapter 05",
    title: "BLOGS",
    side: "right",
    start: 0.72,
    end: 0.84,
    accent: "#c4b5fd",
    snippets: ["Essays", "Notes", "Drafts"],
  },
];

const routes: Route[] = [
  { start: 0, end: 0.16, from: "right", to: "left", world: "void", rotation: 0 },
  { start: 0.16, end: 0.3, from: "left", to: "right", world: "brand-films", rotation: 540 },
  { start: 0.3, end: 0.44, from: "right", to: "left", world: "performance-ads", rotation: 1080 },
  { start: 0.44, end: 0.58, from: "left", to: "right", world: "stand-up", rotation: 1620 },
  { start: 0.58, end: 0.72, from: "right", to: "left", world: "content-creation", rotation: 2160 },
  { start: 0.72, end: 0.84, from: "left", to: "right", world: "blogs", rotation: 2700 },
];

const finalWords = ["Storyteller.", "Creator.", "Performer.", "Strategist."];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function mix(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function segment(value: number, start: number, end: number) {
  return clamp((value - start) / (end - start));
}

function ease(value: number) {
  return value * value * (3 - 2 * value);
}

function fadeRange(progress: number, start: number, end: number) {
  return (
    ease(segment(progress, start + 0.025, start + 0.065)) *
    (1 - ease(segment(progress, end - 0.035, end)))
  );
}

function vars(values: Record<`--${string}`, string | number>): CSSVars {
  return values as CSSVars;
}

function sideX(side: Side) {
  return side === "left" ? 18 : 82;
}

function rectRoute(progress: number, route: Route) {
  const t = segment(progress, route.start, route.end);
  const vertical = 0.64;
  const fromX = sideX(route.from);
  const toX = sideX(route.to);

  if (t <= vertical) {
    const drop = ease(t / vertical);

    return {
      x: fromX,
      y: mix(14, 82, drop),
      rotation: mix(route.rotation, route.rotation + 300, drop),
      world: route.world,
      anim: "somersault" as AnimState,
      flipX: route.to === "left",
      somersault: drop, // Somersault during fall
      animProgress: drop,
    };
  }

  const traverse = ease((t - vertical) / (1 - vertical));

  return {
    x: mix(fromX, toX, traverse),
    y: 82,
    rotation: mix(route.rotation + 300, route.rotation + 540, traverse),
    world: route.world,
    anim: "run" as AnimState,
    flipX: route.to === "left",
    somersault: 0,
    animProgress: traverse,
  };
}

function getMotion(progress: number): Motion {
  let x = sideX("right");
  let y = 14;
  let rotation = 0;
  let scale = 1;
  let world: Motion["world"] = "void";
  let anim: AnimState = "idle";
  let flipX = false;
  let somersault = 0;
  let animProgress = 0;
  const activeRoute = routes.find((route) => progress >= route.start && progress < route.end);

  if (activeRoute) {
    const routeMotion = rectRoute(progress, activeRoute);
    x = routeMotion.x;
    y = routeMotion.y;
    rotation = routeMotion.rotation;
    world = routeMotion.world;
    anim = routeMotion.anim;
    flipX = routeMotion.flipX;
    somersault = routeMotion.somersault;
    animProgress = routeMotion.animProgress;
  } else if (progress < 0.9) {
    const t = ease(segment(progress, 0.84, 0.9));
    x = mix(sideX("right"), 50, t);
    y = mix(82, 42, t);
    rotation = mix(3240, 3600, t);
    scale = mix(1.05, 1.45, t);
    world = "build";
    anim = "jump";
    somersault = t;
    animProgress = t;
  } else if (progress < 0.955) {
    const t = ease(segment(progress, 0.9, 0.955));
    x = 50;
    y = mix(42, 79, t);
    rotation = mix(3120, 3600, t);
    scale = mix(1.25, 1.25, t);
    world = "impact";
    anim = "somersault";
    somersault = t;
    animProgress = t;
  } else {
    const t = ease(segment(progress, 0.955, 1));
    x = 50;
    y = mix(79, 52, t);
    rotation = 3600;
    scale = mix(1.25, 2.4, t);
    world = "reveal";
    anim = "fun";
    somersault = 0;
    animProgress = t;
  }

  // Hero section somersault: during the initial void entry (0 to 0.08)
  if (progress < 0.08) {
    const heroSomersaultT = ease(segment(progress, 0, 0.08));
    somersault = heroSomersaultT;
    anim = "somersault";
    animProgress = heroSomersaultT;
  }

  return {
    x,
    y,
    rotation,
    scale,
    glow: ease(segment(progress, 0.78, 0.93)),
    evolution: ease(segment(progress, 0.82, 0.965)),
    landed: progress > 0.925 && progress < 0.965,
    world,
    anim,
    flipX,
    somersault,
    animProgress,
  };
}

export function IntroSequence() {
  const [progress, setProgress] = useState(0);
  const motion = getMotion(progress);
  const reveal = ease(segment(progress, 0.955, 1));
  const impact = ease(segment(progress, 0.91, 0.95)) * (1 - ease(segment(progress, 0.955, 0.985)));
  const build = ease(segment(progress, 0.79, 0.9)) * (1 - ease(segment(progress, 0.93, 0.96)));

  // Determine somersault rotation (one full 360° flip)
  const somersaultRotation = motion.somersault * 360;

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? clamp(window.scrollY / max) : 0);
    };

    const request = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);

    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <main className="scroll-story">
      <div
        className={`cinema-stage world-${motion.world} ${motion.landed ? "is-landed" : ""}`}
        style={vars({
          "--build": build,
          "--impact": impact,
          "--reveal": reveal,
          "--glow": motion.glow,
          "--evolution": motion.evolution,
        })}
      >
        <VoidSpawn />

        {chapters.map((chapter) => (
          <WorldLayer key={chapter.id} chapter={chapter} progress={progress} />
        ))}

        <div
          className="devra-rig"
          style={{
            transform: `translate3d(${motion.x}vw, ${motion.y}vh, 0) translate(-50%, -50%) scale(${motion.scale})`,
          }}
        >
          <div className="spawn-fall">
            <div
              className="sprite-somersault-wrapper"
              style={{
                transform: `rotate(${somersaultRotation}deg)`,
                transition: "transform 80ms linear",
              }}
            >
              <SpriteCharacter
                anim={motion.anim}
                flipX={motion.flipX}
                progressFrame={motion.animProgress}
                className="devra-sprite"
              />
            </div>
            <Trail />
          </div>
        </div>

        {chapters.map((chapter) => (
          <ChapterCard key={chapter.id} chapter={chapter} progress={progress} />
        ))}

        <BuildUp progress={progress} />
        <ImpactFlash />
        <TransformationReveal reveal={reveal} progress={progress} />
      </div>
      <UnityModal />
    </main>
  );
}

function VoidSpawn() {
  return (
    <div className="void-spawn" aria-hidden="true">
      {Array.from({ length: 26 }).map((_, index) => (
        <i key={`spawn-${index}`} style={vars({ "--i": index })} />
      ))}
    </div>
  );
}

function Trail() {
  return (
    <div className="pixel-trail" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, index) => (
        <i key={`trail-${index}`} style={vars({ "--i": index })} />
      ))}
    </div>
  );
}

function WorldLayer({ chapter, progress }: { chapter: Chapter; progress: number }) {
  const opacity =
    ease(segment(progress, chapter.start - 0.025, chapter.start + 0.035)) *
    (1 - ease(segment(progress, chapter.end - 0.03, chapter.end + 0.025)));

  return (
    <div className={`world-layer ${chapter.id}`} style={vars({ "--o": opacity, "--accent": chapter.accent })}>
      {Array.from({ length: 8 }).map((_, index) => (
        <i key={`${chapter.id}-motif-${index}`} style={vars({ "--i": index })} />
      ))}
    </div>
  );
}

function ChapterCard({ chapter, progress }: { chapter: Chapter; progress: number }) {
  const opacity = fadeRange(progress, chapter.start, chapter.end);
  const active = opacity > 0.65;

  return (
    <section
      className={`chapter-card ${chapter.side}`}
      style={{
        opacity,
        pointerEvents: active ? "auto" : "none",
        transform: `translateY(${(1 - opacity) * 28}px)`,
      }}
    >
      <Link href={`/${chapter.id}`} className="chapter-link" style={vars({ "--accent": chapter.accent })}>
        <span>{chapter.eyebrow}</span>
        <h2>{chapter.title}</h2>
        <div className="snippets">
          {chapter.snippets.map((snippet) => (
            <b key={snippet}>{snippet}</b>
          ))}
        </div>
      </Link>
    </section>
  );
}

function BuildUp({ progress }: { progress: number }) {
  const opacity = ease(segment(progress, 0.8, 0.9)) * (1 - ease(segment(progress, 0.93, 0.965)));

  return (
    <div className="build-up" style={{ opacity }}>
      <span>8-bit</span>
      <span>16-bit</span>
      <span>32-bit</span>
    </div>
  );
}

function ImpactFlash() {
  return (
    <div className="impact-layer" aria-hidden="true">
      <i />
      <i />
      <i />
      <b>BOOM.</b>
    </div>
  );
}

function TransformationReveal({ reveal, progress }: { reveal: number; progress: number }) {
  // Footer somersault: sprite does a flip in the final reveal
  const footerSomersault = ease(segment(progress, 0.965, 0.995));
  const footerRotation = footerSomersault * 360;

  return (
    <div
      className="final-reveal"
      style={{
        opacity: reveal,
        pointerEvents: reveal > 0.9 ? "auto" : "none",
      }}
    >
      <h1 aria-label="Devra Aggarwal">
        {"DEVRA AGGARWAL".split("").map((letter, index) => (
          <span key={`${letter}-${index}`} style={vars({ "--i": index })}>
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </h1>

      {/* Footer somersault character */}
      <div
        className="footer-sprite-wrapper"
        style={{
          transform: `rotate(${footerRotation}deg)`,
        }}
      >
        <SpriteCharacter
          anim="fun"
          progressFrame={footerSomersault}
          className="footer-sprite"
        />
      </div>

      <p>
        {finalWords.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </p>
      <nav aria-label="Primary">
        {[...chapters, { id: "about", title: "ABOUT", accent: "#ffffff" }].map((item) => (
          <Link key={item.id} href={`/${item.id}`}>
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
