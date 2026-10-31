import {
  MAP,
  PARTICLE_PATTERNS,
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "./config.js";
import { NoisePatterns } from "./NoisePatterns.js";
import { PerlinNoise } from "./PerlinNoise.js";

const PARTICLE_PATTERN_SET = new Set(PARTICLE_PATTERNS);
const CURL_EPSILON = 1e-6;
const JITTER_ANGLE_RANGE = 1.5;

function clampInteger(value, minimum, maximum) {
  return Math.min(Math.max(Math.round(Number(value)), minimum), maximum);
}

class PerlinFlowSimulation {
  constructor(seed) {
    this.noise = new PerlinNoise(seed);
    this.patterns = new NoisePatterns(this.noise);
    this.glow = new Float32Array(MAP.width * MAP.height);
    this.colors = new Uint8Array(MAP.width * MAP.height);
    this.particles = Array.from(
      { length: SIM.defaultParticles },
      () => ({ x: 0, y: 0, color: 0, age: 0, maxAge: 0 }),
    );
    this.pattern = 0;
    this.theme = 0;
    this.speed = SIM.defaultSpeed;
    this.tickRate = SIM.defaultTickRate;
    this.paused = false;
    this.showGlyphs = true;
    this.fieldTime = 0;
    this.accumulator = 0;
    this.reset(seed);
  }

  get isParticlePattern() {
    return PARTICLE_PATTERN_SET.has(this.pattern);
  }

  spawnParticle(particle) {
    const random = this.noise.random;
    particle.x = Math.floor(random.next() * MAP.width);
    particle.y = Math.floor(random.next() * MAP.height);
    particle.color = Math.floor(random.next() * SIM.colorBands);
    particle.age = 0;
    particle.maxAge = SIM.minAgeTicks + Math.floor(
      random.next() * (SIM.maxAgeTicks - SIM.minAgeTicks),
    );
  }

  spawnAllParticles() {
    for (const particle of this.particles) this.spawnParticle(particle);
  }

  reset(seed) {
    this.fieldTime = 0;
    this.accumulator = 0;
    this.glow.fill(0);
    this.colors.fill(0);
    this.noise.shuffle(seed);
    this.spawnAllParticles();
  }

  clearField() {
    this.glow.fill(0);
    this.colors.fill(0);
  }

  setPattern(value) {
    const next = clampInteger(value, 0, PATTERN_NAMES.length - 1);
    this.pattern = next;
    this.clearField();
  }

  cyclePattern(direction) {
    const count = PATTERN_NAMES.length;
    this.pattern = (this.pattern + direction + count) % count;
    this.clearField();
  }

  setTheme(value) {
    this.theme = clampInteger(value, 0, THEMES.length - 1);
  }

  cycleTheme(direction) {
    this.theme = (this.theme + direction + THEMES.length) % THEMES.length;
  }

  setSpeed(value) {
    this.speed = clampInteger(value, SIM.minSpeed, SIM.maxSpeed);
  }

  adjustSpeed(direction) {
    this.setSpeed(direction > 0 ? this.speed * 2 : this.speed / 2);
  }

  setTickRate(value) {
    const clamped = clampInteger(value, SIM.minTickRate, SIM.maxTickRate);
    this.tickRate = Math.round(clamped / SIM.tickRateStep) * SIM.tickRateStep;
    this.accumulator = 0;
  }

  adjustTickRate(direction) {
    this.setTickRate(this.tickRate + direction * SIM.tickRateStep);
  }

  togglePaused() {
    this.paused = !this.paused;
  }

  rasterizePattern() {
    const output = { glow: 0, band: 0 };
    const centerX = MAP.width * 0.5;
    const centerY = MAP.height * 0.5;
    let index = 0;

    for (let y = 0; y < MAP.height; y += 1) {
      for (let x = 0; x < MAP.width; x += 1) {
        this.patterns.sample(
          this.pattern,
          x,
          y,
          this.fieldTime,
          centerX,
          centerY,
          MAP.height,
          output,
        );
        this.glow[index] = output.glow;
        this.colors[index] = output.band & 3;
        index += 1;
      }
    }
  }

  velocityAt(particle, output) {
    if (this.pattern === 27) {
      this.patterns.curl(particle.x, particle.y, this.fieldTime, output);
      const magnitude = Math.hypot(output.x, output.y);
      if (magnitude > CURL_EPSILON) {
        output.x = output.x / magnitude * this.speed;
        output.y = output.y / magnitude * this.speed;
      } else {
        output.x = 0;
        output.y = 0;
      }
      return output;
    }

    const noise = this.patterns.raw(
      particle.x,
      particle.y,
      this.fieldTime,
    );
    let angle = noise * Math.PI;
    if (this.pattern === 26) angle += Math.PI * 0.5;
    if (this.pattern === 28) {
      angle += (this.noise.random.next() - 0.5) * JITTER_ANGLE_RANGE;
    }
    output.x = Math.cos(angle) * this.speed;
    output.y = Math.sin(angle) * this.speed;
    return output;
  }

  stepParticle(particle, delta, velocity) {
    this.velocityAt(particle, velocity);
    particle.x += velocity.x * delta;
    particle.y += velocity.y * delta;
    particle.age += 1;

    const cellX = Math.trunc(particle.x);
    const cellY = Math.trunc(particle.y);
    if (
      cellX >= 0 && cellX < MAP.width &&
      cellY >= 0 && cellY < MAP.height
    ) {
      const index = cellY * MAP.width + cellX;
      this.glow[index] = 1;
      this.colors[index] = particle.color;
    }

    if (
      particle.age >= particle.maxAge ||
      particle.x < 0 || particle.x >= MAP.width ||
      particle.y < 0 || particle.y >= MAP.height
    ) {
      this.spawnParticle(particle);
    }
  }

  stepFixed(delta) {
    this.fieldTime += SIM.fieldDrift * delta;

    if (this.isParticlePattern) {
      const decay = Math.exp(-SIM.glowDecay * delta);
      for (let index = 0; index < this.glow.length; index += 1) {
        this.glow[index] *= decay;
      }
      const velocity = { x: 0, y: 0 };
      for (const particle of this.particles) {
        this.stepParticle(particle, delta, velocity);
      }
    } else {
      this.rasterizePattern();
    }
  }

  step(frameDelta) {
    if (this.paused) return;
    const fixedDelta = 1 / this.tickRate;
    this.accumulator += Math.min(
      Math.max(Number(frameDelta) || 0, 0),
      SIM.maxFrameDelta,
    );

    let steps = 0;
    while (
      this.accumulator >= fixedDelta &&
      steps < SIM.maxStepsPerFrame
    ) {
      this.stepFixed(fixedDelta);
      this.accumulator -= fixedDelta;
      steps += 1;
    }

    if (steps === SIM.maxStepsPerFrame && this.accumulator >= fixedDelta) {
      this.accumulator %= fixedDelta;
    }
  }
}

export { PerlinFlowSimulation };
