"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  z: number;
  startX: number;
  startY: number;
  delay: number;
  char: string;
  kind: "moon" | "ring";
};

const GLYPHS = [".", ":", "+", "*", "0", "1", "/", "=", "-", "·"];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutExpo(value: number) {
  return value === 1 ? 1 : 1 - Math.pow(2, -10 * value);
}

function rotatePoint(x: number, y: number, z: number, angle: number) {
  const cosY = Math.cos(angle);
  const sinY = Math.sin(angle);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  const tilt = -0.13;
  const cosX = Math.cos(tilt);
  const sinX = Math.sin(tilt);

  return {
    x: x1,
    y: y * cosX - z1 * sinX,
    z: y * sinX + z1 * cosX,
  };
}

function makeParticles(width: number, height: number) {
  const particles: Particle[] = [];
  const moonCount = width < 640 ? 360 : 620;
  const ringCount = width < 640 ? 190 : 320;

  for (let i = 0; i < moonCount; i += 1) {
    const y = 1 - (i / (moonCount - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;
    const relief = 1 + Math.sin(theta * 3 + y * 8) * 0.025;

    particles.push({
      x: Math.cos(theta) * radius * relief,
      y: y * relief,
      z: Math.sin(theta) * radius * relief,
      startX: 0,
      startY: 0,
      delay: Math.random() * 1050,
      char: GLYPHS[i % GLYPHS.length],
      kind: "moon",
    });
  }

  for (let i = 0; i < ringCount; i += 1) {
    const angle = (i / ringCount) * Math.PI * 2;
    const band = 1.48 + (i % 4) * 0.075 + Math.sin(i * 2.1) * 0.018;
    const x = Math.cos(angle) * band;
    const z = Math.sin(angle) * band;
    const ringTilt = 0.34;

    particles.push({
      x,
      y: -z * Math.sin(ringTilt),
      z: z * Math.cos(ringTilt),
      startX: 0,
      startY: 0,
      delay: 450 + Math.random() * 1250,
      char: GLYPHS[(i + 3) % GLYPHS.length],
      kind: "ring",
    });
  }

  particles.forEach((particle, index) => {
    const edge = index % 4;
    const margin = 50 + Math.random() * 180;
    if (edge === 0) {
      particle.startX = -margin;
      particle.startY = Math.random() * height;
    } else if (edge === 1) {
      particle.startX = width + margin;
      particle.startY = Math.random() * height;
    } else if (edge === 2) {
      particle.startX = Math.random() * width;
      particle.startY = -margin;
    } else {
      particle.startX = Math.random() * width;
      particle.startY = height + margin;
    }
  });

  return particles;
}

export default function GanymedeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let start = performance.now();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = makeParticles(width, height);
      start = performance.now();
    };

    const draw = (now: number) => {
      const elapsed = reduceMotion ? 5000 : now - start;
      const angle = reduceMotion ? 0.38 : elapsed * 0.000095;
      const centerX = width * 0.5;
      const centerY = height * (width < 640 ? 0.43 : 0.45);
      const sceneScale = Math.min(width, height) * (width < 640 ? 0.235 : 0.285);

      context.clearRect(0, 0, width, height);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `${Math.max(8, Math.min(13, width / 115))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

      particles.forEach((particle, index) => {
        const rotated = rotatePoint(particle.x, particle.y, particle.z, angle);
        const perspective = 1 / (1.02 - rotated.z * 0.12);
        const targetX = centerX + rotated.x * sceneScale * perspective;
        const targetY = centerY + rotated.y * sceneScale * perspective;
        const localProgress = reduceMotion
          ? 1
          : clamp((elapsed - particle.delay) / (particle.kind === "ring" ? 2100 : 2500));
        const eased = easeOutExpo(localProgress);
        const swirl = Math.sin(elapsed * 0.002 + index * 0.37) * 22 * (1 - eased);
        const x = particle.startX + (targetX - particle.startX) * eased + swirl;
        const y = particle.startY + (targetY - particle.startY) * eased + Math.cos(index) * swirl;
        const depthAlpha = particle.kind === "ring"
          ? 0.46 + (rotated.z + 2) * 0.14
          : 0.36 + (rotated.z + 1) * 0.3;

        context.globalAlpha = clamp(localProgress * depthAlpha, 0, 0.96);
        context.fillStyle = particle.kind === "ring" ? "#cfcfc8" : "#f2f2ed";
        context.fillText(particle.char, x, y);
      });

      context.globalAlpha = 1;
      if (statusRef.current) {
        statusRef.current.textContent = elapsed < 1450
          ? "GATHERING SIGNAL"
          : elapsed < 3300
            ? "FORMING CELESTIAL BODY"
            : "ORBIT STABLE";
      }

      if (!reduceMotion) animationFrame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="scene" aria-label="ASCII particles assemble into a rotating moon and orbital rings">
      <canvas ref={canvasRef} className="ascii-canvas" aria-hidden="true" />
      <div className="scene-status" aria-live="polite">
        <i aria-hidden="true" />
        <span ref={statusRef}>GATHERING SIGNAL</span>
      </div>
    </div>
  );
}
