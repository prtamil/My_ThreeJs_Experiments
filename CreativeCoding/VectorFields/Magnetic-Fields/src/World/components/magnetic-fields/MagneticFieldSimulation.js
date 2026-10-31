import {
  GLYPH_SETS,
  MAP,
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "./config.js";
import { createPatternPoles } from "./PolePatterns.js";

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

class MagneticFieldSimulation {
  constructor() {
    this.width = MAP.width;
    this.height = MAP.height;
    this.cellCount = MAP.width * MAP.height;
    this.glow = new Float32Array(this.cellCount);
    this.colors = new Uint8Array(this.cellCount);
    this.particles = [];
    this.basePoles = [];
    this.activePoles = [];

    this.paused = false;
    this.speed = SIM.defaultSpeed;
    this.tickRate = SIM.defaultTickRate;
    this.particleCount = SIM.defaultParticles;
    this.theme = 0;
    this.glyphSet = 2;
    this.pattern = 1;
    this.driftRate = SIM.driftRate;
    this.showGlyphs = true;
    this.showPoles = true;
    this.time = 0;
    this.accumulator = 0;

    this.reset();
  }

  spawnParticle(particle = {}) {
    particle.x = Math.random() * this.width;
    particle.y = Math.random() * this.height;
    particle.color = Math.floor(Math.random() * SIM.colorBands);
    particle.age = 0;
    particle.maxAge =
      SIM.minAgeTicks +
      Math.floor(Math.random() * (SIM.maxAgeTicks - SIM.minAgeTicks));
    return particle;
  }

  resizeParticlePool() {
    while (this.particles.length < this.particleCount) {
      this.particles.push(this.spawnParticle());
    }
    this.particles.length = this.particleCount;
  }

  refreshActivePoles() {
    this.activePoles.length = this.basePoles.length;

    for (let index = 0; index < this.basePoles.length; index += 1) {
      const source = this.basePoles[index];
      const angle = this.time * this.driftRate + source.phase;
      const active = this.activePoles[index] ?? {};
      active.x = source.bx + source.ox * Math.cos(angle);
      active.y = source.by + source.oy * Math.sin(angle);
      active.strength = source.strength;
      active.polarity = source.polarity;
      this.activePoles[index] = active;
    }
  }

  sampleFieldDirection(x, y, result = { x: 0, y: 0 }) {
    let fieldX = 0;
    let fieldY = 0;

    for (const pole of this.activePoles) {
      const dx = x - pole.x;
      const dy = y - pole.y;
      const radiusSquared =
        dx * dx + dy * dy + SIM.fieldSofteningSquared;
      const radiusCubed = radiusSquared * Math.sqrt(radiusSquared);
      const weight = (pole.polarity * pole.strength) / radiusCubed;
      fieldX += dx * weight;
      fieldY += dy * weight;
    }

    const magnitude = Math.hypot(fieldX, fieldY);
    if (magnitude > SIM.fieldEpsilon) {
      fieldX /= magnitude;
      fieldY /= magnitude;
    }

    result.x = fieldX;
    result.y = fieldY;
    return result;
  }

  depositTrail(particle) {
    const x = Math.trunc(particle.x);
    const y = Math.trunc(particle.y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

    const index = y * this.width + x;
    this.glow[index] = 1;
    this.colors[index] = particle.color;
  }

  stepParticle(particle, delta, direction) {
    this.sampleFieldDirection(particle.x, particle.y, direction);
    particle.x += direction.x * this.speed * delta;
    particle.y += direction.y * this.speed * delta;
    particle.age += 1;
    this.depositTrail(particle);

    if (
      particle.age >= particle.maxAge ||
      particle.x < 0 ||
      particle.x >= this.width ||
      particle.y < 0 ||
      particle.y >= this.height
    ) {
      this.spawnParticle(particle);
    }
  }

  stepFixed(delta) {
    const decay = Math.exp(-SIM.trailDecay * delta);
    for (let index = 0; index < this.glow.length; index += 1) {
      this.glow[index] *= decay;
    }

    this.time += delta;
    this.refreshActivePoles();

    const direction = { x: 0, y: 0 };
    for (const particle of this.particles) {
      this.stepParticle(particle, delta, direction);
    }
  }

  step(delta) {
    if (this.paused) {
      this.accumulator = 0;
      return 0;
    }

    const frameDelta = clamp(Number(delta) || 0, 0, SIM.maxFrameDelta);
    const fixedDelta = 1 / this.tickRate;
    this.accumulator += frameDelta;

    let steps = 0;
    while (
      this.accumulator >= fixedDelta &&
      steps < SIM.maxStepsPerFrame
    ) {
      this.stepFixed(fixedDelta);
      this.accumulator -= fixedDelta;
      steps += 1;
    }

    if (steps === SIM.maxStepsPerFrame) {
      this.accumulator = Math.min(this.accumulator, fixedDelta);
    }

    return steps;
  }

  reset() {
    this.time = 0;
    this.accumulator = 0;
    this.glow.fill(0);
    this.colors.fill(0);
    this.basePoles = createPatternPoles(
      this.pattern,
      this.width,
      this.height,
    );
    this.refreshActivePoles();
    this.particles.length = 0;
    this.resizeParticlePool();
  }

  setPattern(pattern) {
    this.pattern = clamp(
      Math.round(Number(pattern)),
      0,
      PATTERN_NAMES.length - 1,
    );
    this.reset();
  }

  cyclePattern(direction = 1) {
    this.setPattern(
      (this.pattern + direction + PATTERN_NAMES.length) %
        PATTERN_NAMES.length,
    );
  }

  setTheme(theme) {
    this.theme = clamp(Math.round(Number(theme)), 0, THEMES.length - 1);
  }

  cycleTheme(direction = 1) {
    this.setTheme((this.theme + direction + THEMES.length) % THEMES.length);
  }

  setGlyphSet(glyphSet) {
    this.glyphSet = clamp(
      Math.round(Number(glyphSet)),
      0,
      GLYPH_SETS.length - 1,
    );
  }

  cycleGlyphSet(direction = 1) {
    this.setGlyphSet(
      (this.glyphSet + direction + GLYPH_SETS.length) % GLYPH_SETS.length,
    );
  }

  setSpeed(speed) {
    this.speed = clamp(
      Math.round(Number(speed)),
      SIM.minSpeed,
      SIM.maxSpeed,
    );
  }

  adjustSpeed(direction) {
    this.setSpeed(direction > 0 ? this.speed * 2 : this.speed / 2);
  }

  setTickRate(tickRate) {
    this.tickRate = clamp(
      Math.round(Number(tickRate) / SIM.tickRateStep) * SIM.tickRateStep,
      SIM.minTickRate,
      SIM.maxTickRate,
    );
    this.accumulator = 0;
  }

  adjustTickRate(direction) {
    this.setTickRate(this.tickRate + direction * SIM.tickRateStep);
  }

  setParticleCount(count) {
    this.particleCount = clamp(
      Math.round(Number(count)),
      SIM.minParticles,
      SIM.maxParticles,
    );
    this.resizeParticlePool();
  }

  togglePaused() {
    this.paused = !this.paused;
  }
}

export { MagneticFieldSimulation };
