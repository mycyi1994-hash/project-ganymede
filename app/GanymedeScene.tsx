"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  z: number;
  startX: number;
  startY: number;
  delay: number;
  glyph: number;
  kind: "moon" | "ring";
  orbitAngle?: number;
  orbitRadius?: number;
};

const GLYPHS = [".", ":", "+", "*", "0", "1", "/", "=", "-", "|"];
const SPACECRAFT = [
  ["  /\\  ", "<|===>", "  \\/  "],
  ["  .  ", "=[+]=", " /_\\ "],
  ["<<o>>", " /|\\ "],
];

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
  const moonCount = width < 640 ? 6480 : 11160;
  const ringCount = width < 640 ? 3420 : 5760;

  for (let i = 0; i < moonCount; i += 1) {
    const y = 1 - (i / (moonCount - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;
    const randomRadius = Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
    const volume = 0.2 + Math.pow(randomRadius, 0.4) * 0.82;
    const relief = (1 + Math.sin(theta * 3 + y * 8) * 0.02) * volume;

    particles.push({
      x: Math.cos(theta) * radius * relief,
      y: y * relief,
      z: Math.sin(theta) * radius * relief,
      startX: 0,
      startY: 0,
      delay: Math.random() * 1050,
      glyph: i % GLYPHS.length,
      kind: "moon",
    });
  }

  for (let i = 0; i < ringCount; i += 1) {
    const angle = (i / ringCount) * Math.PI * 2;
    const band = 1.54 + (i % 10) * 0.015 + Math.sin(i * 2.1) * 0.006;
    const x = Math.cos(angle) * band;
    const z = Math.sin(angle) * band;
    const ringTilt = 0.48;

    particles.push({
      x,
      y: -z * Math.sin(ringTilt),
      z: z * Math.cos(ringTilt),
      startX: 0,
      startY: 0,
      delay: 450 + Math.random() * 1250,
      glyph: (i + 3) % GLYPHS.length,
      kind: "ring",
      orbitAngle: angle,
      orbitRadius: band,
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

function makeGlyphAtlas(fontSize: number) {
  const levels = 6;
  const cell = Math.max(8, Math.ceil(fontSize * 1.65));
  const atlas = document.createElement("canvas");
  const atlasContext = atlas.getContext("2d");
  atlas.width = cell * GLYPHS.length;
  atlas.height = cell * levels;

  if (atlasContext) {
    atlasContext.textAlign = "center";
    atlasContext.textBaseline = "middle";
    atlasContext.fillStyle = "#f3f3ee";
    atlasContext.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;

    for (let level = 0; level < levels; level += 1) {
      atlasContext.globalAlpha = ((level + 1) / levels) * 0.96;
      GLYPHS.forEach((glyph, index) => {
        atlasContext.fillText(glyph, index * cell + cell / 2, level * cell + cell / 2);
      });
    }
  }

  return { atlas, cell, levels };
}

function drawSpacecraft(
  context: CanvasRenderingContext2D,
  model: string[],
  x: number,
  y: number,
  rotation: number,
  scale: number,
  alpha: number,
) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.scale(scale, scale);
  context.globalAlpha = alpha;
  context.fillStyle = "#f5f5ef";
  context.font = "9px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  model.forEach((line, index) => {
    context.fillText(line, 0, (index - (model.length - 1) / 2) * 9);
  });
  context.restore();
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
    let moonParticles: Particle[] = [];
    let ringParticles: Particle[] = [];
    let glyphAtlas = makeGlyphAtlas(6);
    let start = performance.now();
    let lastFrame = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const particles = makeParticles(width, height);
      moonParticles = particles.filter((particle) => particle.kind === "moon");
      ringParticles = particles.filter((particle) => particle.kind === "ring");
      glyphAtlas = makeGlyphAtlas(Math.max(4.8, Math.min(7.2, width / 220)));
      start = performance.now();
      lastFrame = 0;
    };

    const draw = (now: number) => {
      if (!reduceMotion && now - lastFrame < 32) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      const elapsed = reduceMotion ? 5000 : now - start;
      const angle = reduceMotion ? 0.38 : elapsed * 0.000095;
      const centerX = width * 0.5;
      const centerY = height * (width < 640 ? 0.43 : 0.45);
      const sceneScale = Math.min(width, height) * (width < 640 ? 0.235 : 0.285);

      context.clearRect(0, 0, width, height);
      context.globalAlpha = 1;

      const drawParticle = (particle: Particle, index: number, layer: "back" | "moon" | "front") => {
        let rotated;

        if (particle.kind === "ring") {
          const orbitAngle = (particle.orbitAngle ?? 0) + elapsed * 0.000035;
          const orbitRadius = particle.orbitRadius ?? 1.6;
          const ringX = Math.cos(orbitAngle) * orbitRadius;
          const ringZ = Math.sin(orbitAngle) * orbitRadius;
          const ringTilt = 0.48;
          rotated = rotatePoint(
            ringX,
            -ringZ * Math.sin(ringTilt),
            ringZ * Math.cos(ringTilt),
            0,
          );

          if (layer === "back" && rotated.z >= 0) return;
          if (layer === "front" && rotated.z < 0) return;
        } else {
          rotated = rotatePoint(particle.x, particle.y, particle.z, angle);
        }

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
          ? (layer === "back" ? 0.18 : 0.5) + (rotated.z + 2) * (layer === "back" ? 0.05 : 0.13)
          : 0.36 + (rotated.z + 1) * 0.3;

        const alpha = clamp(localProgress * depthAlpha, 0, 0.96);
        if (alpha < 0.035) return;
        const level = Math.min(glyphAtlas.levels - 1, Math.floor(alpha * glyphAtlas.levels));
        const sourceX = particle.glyph * glyphAtlas.cell;
        const sourceY = level * glyphAtlas.cell;
        context.drawImage(
          glyphAtlas.atlas,
          sourceX,
          sourceY,
          glyphAtlas.cell,
          glyphAtlas.cell,
          x - glyphAtlas.cell / 2,
          y - glyphAtlas.cell / 2,
          glyphAtlas.cell,
          glyphAtlas.cell,
        );
      };

      ringParticles.forEach((particle, index) => drawParticle(particle, index, "back"));
      moonParticles.forEach((particle, index) => drawParticle(particle, index, "moon"));
      ringParticles.forEach((particle, index) => drawParticle(particle, index, "front"));

      SPACECRAFT.forEach((model, index) => {
        const direction = index === 1 ? -1 : 1;
        const speed = [0.00016, 0.000115, 0.000205][index];
        const phase = [0.2, 2.25, 4.1][index];
        const orbit = [2.18, 2.62, 1.92][index] * sceneScale;
        const shipAngle = elapsed * speed * direction + phase;
        const orbitX = centerX + Math.cos(shipAngle) * orbit;
        const orbitY = centerY + Math.sin(shipAngle) * orbit * (0.34 + index * 0.055);
        const arrival = reduceMotion ? 1 : easeOutExpo(clamp((elapsed - 1500 - index * 320) / 1900));
        const startX = index === 0 ? -100 : index === 1 ? width + 100 : width * 0.5;
        const startY = index === 2 ? -80 : height * (0.25 + index * 0.22);
        const x = startX + (orbitX - startX) * arrival;
        const y = startY + (orbitY - startY) * arrival;
        const tangent = Math.atan2(
          Math.cos(shipAngle) * orbit * (0.34 + index * 0.055) * direction,
          -Math.sin(shipAngle) * orbit * direction,
        );
        const depth = (Math.sin(shipAngle) + 1) * 0.5;

        drawSpacecraft(
          context,
          model,
          x,
          y,
          tangent,
          width < 640 ? 0.78 : 0.9 + depth * 0.25,
          arrival * (0.28 + depth * 0.65),
        );
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
    <div className="scene" aria-label="ASCII particles assemble into a rotating moon with orbital rings and passing spacecraft">
      <canvas ref={canvasRef} className="ascii-canvas" aria-hidden="true" />
      <div className="scene-status" aria-live="polite">
        <i aria-hidden="true" />
        <span ref={statusRef}>GATHERING SIGNAL</span>
      </div>
    </div>
  );
}
