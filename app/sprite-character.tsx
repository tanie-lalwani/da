"use client";

import Image from "next/image";

export type AnimState = "idle" | "run" | "jump" | "fall" | "fun" | "walk" | "hit" | "somersault";

/**
 * Frame counts for each animation.
 * Individual transparent PNGs live at /sprites/frames/<anim>/<anim>_XXX.png
 */
const FRAME_COUNTS: Record<AnimState, number> = {
  idle: 5,
  run: 4,
  jump: 4,
  fall: 4,
  fun: 4,
  walk: 4,
  hit: 4,
  somersault: 8,
};

function getFramePath(anim: AnimState, frame: number): string {
  const padded = String(frame).padStart(3, "0");
  return `/sprites/frames/${anim}/${anim}_${padded}.png`;
}

interface SpriteCharacterProps {
  anim: AnimState;
  flipX?: boolean;
  className?: string;
  /** 0–1 normalized scroll progress within this animation segment.
   *  The displayed frame is chosen purely from this value. */
  progressFrame?: number;
}

/**
 * Scroll-driven sprite character.
 * Frames only change when `progressFrame` changes (i.e. on scroll).
 * No auto-play, no intervals — just PNG replacement.
 */
export function SpriteCharacter({
  anim,
  flipX = false,
  className = "",
  progressFrame = 0,
}: SpriteCharacterProps) {
  const totalFrames = FRAME_COUNTS[anim];

  // Pick frame from progress (0→1 maps to frame 0→last)
  const displayFrame = Math.min(
    Math.floor(progressFrame * totalFrames),
    totalFrames - 1
  );

  const src = getFramePath(anim, displayFrame);

  return (
    <div
      className={`sprite-character ${className}`}
      style={{
        transform: flipX ? "scaleX(-1)" : undefined,
      }}
    >
      <Image
        src={src}
        alt="Character"
        width={176}
        height={350}
        priority
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          imageRendering: "auto",
        }}
      />
    </div>
  );
}
