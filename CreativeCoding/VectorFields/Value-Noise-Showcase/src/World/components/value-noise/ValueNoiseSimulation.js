import {
  MAP,
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "./config.js";
import { ValueNoise } from "./ValueNoise.js";
import { ValuePatterns } from "./ValuePatterns.js";

function clampInteger(value, minimum, maximum) {
  return Math.round(Math.min(Math.max(Number(value), minimum), maximum));
}

class ValueNoiseSimulation {
  constructor(seed) {
    this.noise = new ValueNoise(seed);
    this.patterns = new ValuePatterns(this.noise);
    this.glow = new Float32Array(MAP.width * MAP.height);
    this.colors = new Uint8Array(MAP.width * MAP.height);
    this.pattern = 0;
    this.theme = 0;
    this.drift = SIM.defaultDrift;
    this.tickRate = SIM.defaultTickRate;
    this.paused = false;
    this.showGlyphs = true;
    this.fieldTime = 0;
    this.accumulator = 0;
    this.evaluateField();
  }

  evaluateField() {
    let index = 0;
    for (let y = 0; y < MAP.height; y += 1) {
      const sampleY = y * SIM.noiseScale;
      for (let x = 0; x < MAP.width; x += 1) {
        const sampleX = x * SIM.noiseScale;
        const glow = this.patterns.sample(
          this.pattern,
          sampleX,
          sampleY,
          this.fieldTime,
        );
        this.glow[index] = glow;
        this.colors[index] = Math.trunc(glow * 3.999) & 3;
        index += 1;
      }
    }
  }

  reset(seed) {
    this.fieldTime = 0;
    this.accumulator = 0;
    this.noise.reseed(seed);
    this.evaluateField();
  }

  setPattern(value) {
    this.pattern = clampInteger(value, 0, PATTERN_NAMES.length - 1);
    this.evaluateField();
  }

  cyclePattern(direction) {
    const count = PATTERN_NAMES.length;
    this.pattern = (this.pattern + direction + count) % count;
    this.evaluateField();
  }

  setTheme(value) {
    this.theme = clampInteger(value, 0, THEMES.length - 1);
  }

  cycleTheme(direction) {
    this.theme = (this.theme + direction + THEMES.length) % THEMES.length;
  }

  setDrift(value) {
    this.drift = clampInteger(value, SIM.minDrift, SIM.maxDrift);
  }

  adjustDrift(direction) {
    this.setDrift(direction > 0 ? this.drift * 2 : this.drift / 2);
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

  stepFixed(delta) {
    this.fieldTime += SIM.fieldDrift * this.drift * delta;
    this.evaluateField();
  }

  step(frameDelta) {
    if (this.paused) return;
    const fixedDelta = 1 / this.tickRate;
    this.accumulator += Math.min(
      Math.max(Number(frameDelta) || 0, 0),
      SIM.maxFrameDelta,
    );

    let ticks = 0;
    while (
      this.accumulator >= fixedDelta &&
      ticks < SIM.maxTicksPerFrame
    ) {
      this.stepFixed(fixedDelta);
      this.accumulator -= fixedDelta;
      ticks += 1;
    }

    if (ticks === SIM.maxTicksPerFrame && this.accumulator >= fixedDelta) {
      this.accumulator %= fixedDelta;
    }
  }
}

export { ValueNoiseSimulation };
