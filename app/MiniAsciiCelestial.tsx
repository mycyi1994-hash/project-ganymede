"use client";

import { useEffect, useRef } from "react";

export type CelestialVariant = "core" | "tech" | "income" | "alpha";

type SphereParticle = {
  x: number;
  y: number;
  z: number;
  glyph: number;
  surface: boolean;
};

type RingParticle = {
  angle: number;
  radius: number;
  glyph: number;
  band: number;
};

type Config = {
  sphereCount: number;
  ringCount: number;
  bands: number[];
  ringTilt: number;
  ringRoll: number;
  rotationSpeed: number;
  ringSpeed: number;
  axialTilt: number;
  scale: number;
};

const GLYPHS = [".", ":", "+", "*", "0", "1", "/", "=", "-", "|"];

const CONFIGS: Record<CelestialVariant, Config> = {
  core: {
    sphereCount: 1200,
    ringCount: 540,
    bands: [1.3, 1.52, 1.76],
    ringTilt: 0.32,
    ringRoll: -0.28,
    rotationSpeed: 0.00026,
    ringSpeed: 0.0001,
    axialTilt: -0.12,
    scale: 0.34,
  },
  tech: {
    sphereCount: 1080,
    ringCount: 420,
    bands: [1.34, 1.62],
    ringTilt: 0.68,
    ringRoll: -0.7,
    rotationSpeed: -0.00034,
    ringSpeed: 0.00015,
    axialTilt: 0.18,
    scale: 0.35,
  },
  income: {
    sphereCount: 1380,
    ringCount: 620,
    bands: [1.28, 1.44, 1.62, 1.82],
    ringTilt: 0.2,
    ringRoll: 0.08,
    rotationSpeed: 0.00018,
    ringSpeed: 0.000075,
    axialTilt: -0.06,
    scale: 0.33,
  },
  alpha: {
    sphereCount: 920,
    ringCount: 620,
    bands: [1.3, 1.58, 1.9],
    ringTilt: 0.82,
    ringRoll: -0.16,
    rotationSpeed: 0.0005,
    ringSpeed: 0.0002,
    axialTilt: 0.26,
    scale: 0.34,
  },
};

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function hash(index: number) {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function rotateSphere(x: number, y: number, z: number, yaw: number, tilt: number) {
  const cosineY = Math.cos(yaw);
  const sineY = Math.sin(yaw);
  const rotatedX = x * cosineY - z * sineY;
  const rotatedZ = x * sineY + z * cosineY;
  const cosineX = Math.cos(tilt);
  const sineX = Math.sin(tilt);

  return {
    x: rotatedX,
    y: y * cosineX - rotatedZ * sineX,
    z: y * sineX + rotatedZ * cosineX,
  };
}

function rollPoint(point: { x: number; y: number; z: number }, roll: number) {
  const cosine = Math.cos(roll);
  const sine = Math.sin(roll);
  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
    z: point.z,
  };
}

function makeSphere(count: number) {
  const particles: SphereParticle[] = [];
  const surfaceCount = Math.floor(count * 0.58);

  for (let index = 0; index < count; index += 1) {
    const surface = index < surfaceCount;
    const localIndex = surface ? index : index - surfaceCount;
    const localCount = surface ? surfaceCount : count - surfaceCount;
    const y = 1 - ((localIndex + 0.5) / localCount) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * localIndex + (surface ? 0 : 1.37);
    const randomRadius = hash(index + 11);
    const relief = surface ? 0.97 + randomRadius * 0.025 : 0.16 + Math.cbrt(randomRadius) * 0.76;

    particles.push({
      x: Math.cos(theta) * radius * relief,
      y: y * relief,
      z: Math.sin(theta) * radius * relief,
      glyph: index % GLYPHS.length,
      surface,
    });
  }

  return particles;
}

function makeRings(count: number, bands: number[]) {
  const particles: RingParticle[] = [];

  for (let index = 0; index < count; index += 1) {
    const band = index % bands.length;
    const localIndex = Math.floor(index / bands.length);
    const localCount = Math.ceil((count - band) / bands.length);
    particles.push({
      angle: (localIndex / localCount) * Math.PI * 2 + band * 0.14,
      radius: bands[band] + (localIndex % 3 - 1) * 0.007 + Math.sin(index * 1.7) * 0.002,
      glyph: (index + 3) % GLYPHS.length,
      band,
    });
  }

  return particles;
}

function makeGlyphAtlas(fontSize: number) {
  const levels = 6;
  const cell = Math.max(7, Math.ceil(fontSize * 1.65));
  const atlas = document.createElement("canvas");
  const context = atlas.getContext("2d");
  atlas.width = cell * GLYPHS.length;
  atlas.height = cell * levels;

  if (context) {
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#eeede8";
    context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    for (let level = 0; level < levels; level += 1) {
      context.globalAlpha = ((level + 1) / levels) * 0.94;
      GLYPHS.forEach((glyph, index) => {
        context.fillText(glyph, index * cell + cell / 2, level * cell + cell / 2);
      });
    }
  }

  return { atlas, cell, levels };
}

export default function MiniAsciiCelestial({ variant }: { variant: CelestialVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const config = CONFIGS[variant];
    const sphere = makeSphere(config.sphereCount);
    const rings = makeRings(config.ringCount, config.bands);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let glyphAtlas = makeGlyphAtlas(5.5);
    let animationFrame = 0;
    let lastFrame = 0;
    let visible = true;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      glyphAtlas = makeGlyphAtlas(clamp(Math.min(width, height) / 22, 4.6, 6.5));
    };

    const drawGlyph = (glyph: number, x: number, y: number, alpha: number) => {
      if (alpha < 0.035) return;
      const level = Math.min(glyphAtlas.levels - 1, Math.floor(clamp(alpha) * glyphAtlas.levels));
      context.drawImage(
        glyphAtlas.atlas,
        glyph * glyphAtlas.cell,
        level * glyphAtlas.cell,
        glyphAtlas.cell,
        glyphAtlas.cell,
        x - glyphAtlas.cell / 2,
        y - glyphAtlas.cell / 2,
        glyphAtlas.cell,
        glyphAtlas.cell,
      );
    };

    const draw = (now: number) => {
      animationFrame = requestAnimationFrame(draw);
      if (!visible || (!reduceMotion && now - lastFrame < 40)) return;
      lastFrame = now;

      const elapsed = reduceMotion ? 3200 : now;
      const yaw = elapsed * config.rotationSpeed;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const scale = Math.min(width, height) * config.scale;
      context.clearRect(0, 0, width, height);

      const projectRing = (particle: RingParticle) => {
        const angle = particle.angle + elapsed * config.ringSpeed;
        const x = Math.cos(angle) * particle.radius;
        const z = Math.sin(angle) * particle.radius;
        return rollPoint({
          x,
          y: -z * Math.sin(config.ringTilt),
          z: z * Math.cos(config.ringTilt),
        }, config.ringRoll);
      };

      const drawRingLayer = (front: boolean) => {
        rings.forEach((particle) => {
          const point = projectRing(particle);
          if (front ? point.z < 0 : point.z >= 0) return;
          const perspective = 1 / (1.08 - point.z * 0.09);
          const x = centerX + point.x * scale * perspective;
          const y = centerY + point.y * scale * perspective;
          const bandWeight = 0.7 + particle.band * 0.08;
          const alpha = (front ? 0.46 + point.z * 0.12 : 0.15 + (point.z + 2) * 0.025) * bandWeight;
          drawGlyph(particle.glyph, x, y, alpha);
        });
      };

      drawRingLayer(false);

      sphere.forEach((particle) => {
        const point = rotateSphere(particle.x, particle.y, particle.z, yaw, config.axialTilt);
        const perspective = 1 / (1.04 - point.z * 0.12);
        const x = centerX + point.x * scale * perspective;
        const y = centerY + point.y * scale * perspective;
        const alpha = particle.surface
          ? 0.38 + (point.z + 1) * 0.27
          : 0.14 + (point.z + 1) * 0.2;
        drawGlyph(particle.glyph, x, y, alpha);
      });

      drawRingLayer(true);

      if (reduceMotion) cancelAnimationFrame(animationFrame);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    }, { rootMargin: "80px" });
    visibilityObserver.observe(canvas);

    resize();
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, [variant]);

  return <canvas ref={canvasRef} className="mini-ascii-celestial" aria-hidden="true" />;
}
