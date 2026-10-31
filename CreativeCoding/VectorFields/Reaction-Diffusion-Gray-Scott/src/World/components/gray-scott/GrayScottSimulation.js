import { MAP, PATTERN_NAMES, PRESETS, SIM, THEMES } from "./config.js";

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function clampInteger(value, minimum, maximum) {
  return Math.round(clamp(Number(value), minimum, maximum));
}

function normalizeV(value) {
  return clamp(value * SIM.renderGain, 0, 1);
}

class RandomSource {
  constructor(seed = Math.floor(Math.random() * 0x100000000)) {
    this.reseed(seed);
  }

  reseed(seed) {
    this.state = (Number(seed) >>> 0) || 0x6d2b79f5;
  }

  next() {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state / 0x100000000;
  }
}

class GrayScottSimulation {
  constructor(seed) {
    const cellCount = MAP.width * MAP.height;
    this.u = new Float32Array(cellCount);
    this.v = new Float32Array(cellCount);
    this.uNext = new Float32Array(cellCount);
    this.vNext = new Float32Array(cellCount);
    this.random = new RandomSource(seed);
    this.pattern = 0;
    this.theme = 0;
    this.subSteps = SIM.defaultSubSteps;
    this.tickRate = SIM.defaultTickRate;
    this.paused = false;
    this.showGlyphs = true;
    this.stepCount = 0;
    this.accumulator = 0;
    this.feed = PRESETS[0].feed;
    this.kill = PRESETS[0].kill;
    this.reset(seed);
  }

  reset(seed) {
    if (seed !== undefined) this.random.reseed(seed);
    const preset = PRESETS[this.pattern];
    this.feed = preset.feed;
    this.kill = preset.kill;
    this.u.fill(1);
    this.v.fill(0);
    this.uNext.fill(1);
    this.vNext.fill(0);

    const centerX = Math.floor(MAP.width / 2);
    const centerY = Math.floor(MAP.height / 2);
    const radius = Math.max(
      Math.floor(Math.min(MAP.width, MAP.height) / SIM.seedRadiusDenominator),
      SIM.minimumSeedRadius,
    );
    const radiusSquared = radius * radius;
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        if (offsetX * offsetX + offsetY * offsetY > radiusSquared) continue;
        const x = centerX + offsetX;
        const y = centerY + offsetY;
        if (x < 0 || x >= MAP.width || y < 0 || y >= MAP.height) continue;
        const index = y * MAP.width + x;
        this.u[index] = SIM.seedU;
        this.v[index] = SIM.seedV;
      }
    }

    for (let index = 0; index < this.u.length; index += 1) {
      const centered = Math.floor(this.random.next() * 100) - 50;
      this.u[index] += centered * SIM.jitterGain;
    }
    this.uNext.set(this.u);
    this.vNext.set(this.v);
    this.stepCount = 0;
    this.accumulator = 0;
  }

  setPattern(value) {
    this.pattern = clampInteger(value, 0, PATTERN_NAMES.length - 1);
    this.reset();
  }

  cyclePattern(direction) {
    const count = PATTERN_NAMES.length;
    this.pattern = (this.pattern + direction + count) % count;
    this.reset();
  }

  setTheme(value) {
    this.theme = clampInteger(value, 0, THEMES.length - 1);
  }

  cycleTheme(direction) {
    this.theme = (this.theme + direction + THEMES.length) % THEMES.length;
  }

  setSubSteps(value) {
    this.subSteps = clampInteger(value, SIM.minSubSteps, SIM.maxSubSteps);
  }

  adjustSubSteps(direction) {
    const value = direction > 0
      ? this.subSteps * 2
      : Math.trunc(this.subSteps / 2);
    this.setSubSteps(value);
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

  stepReaction() {
    const width = MAP.width;
    const height = MAP.height;
    const u = this.u;
    const v = this.v;
    const uNext = this.uNext;
    const vNext = this.vNext;
    const feed = this.feed;
    const kill = this.kill;
    const diffusionU = SIM.diffusionU;
    const diffusionV = SIM.diffusionV;
    const timeStep = SIM.timeStep;

    for (let y = 0; y < height; y += 1) {
      const up = y > 0 ? y - 1 : y;
      const down = y < height - 1 ? y + 1 : y;
      for (let x = 0; x < width; x += 1) {
        const left = x > 0 ? x - 1 : x;
        const right = x < width - 1 ? x + 1 : x;
        const index = y * width + x;
        const valueU = u[index];
        const valueV = v[index];
        const laplacianU =
          u[y * width + left] + u[y * width + right] +
          u[up * width + x] + u[down * width + x] - 4 * valueU;
        const laplacianV =
          v[y * width + left] + v[y * width + right] +
          v[up * width + x] + v[down * width + x] - 4 * valueV;
        const reaction = valueU * valueV * valueV;
        uNext[index] = valueU + timeStep * (
          diffusionU * laplacianU - reaction + feed * (1 - valueU)
        );
        vNext[index] = valueV + timeStep * (
          diffusionV * laplacianV + reaction - (feed + kill) * valueV
        );
      }
    }

    this.u = uNext;
    this.v = vNext;
    this.uNext = u;
    this.vNext = v;
  }

  stepFixed() {
    for (let step = 0; step < this.subSteps; step += 1) {
      this.stepReaction();
      this.stepCount += 1;
    }
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
      this.stepFixed();
      this.accumulator -= fixedDelta;
      ticks += 1;
    }

    if (ticks === SIM.maxTicksPerFrame && this.accumulator >= fixedDelta) {
      this.accumulator %= fixedDelta;
    }
  }
}

export { clamp, GrayScottSimulation, normalizeV, RandomSource };
