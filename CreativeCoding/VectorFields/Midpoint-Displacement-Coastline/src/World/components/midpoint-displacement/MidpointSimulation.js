import {
  DENSITY,
  GLYPH_SETS,
  MAP,
  PATTERN_NAMES,
  SIM,
  STYLE,
  THEMES,
} from "./config.js";
import { createPatternSpecs } from "./PatternPresets.js";

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

class RandomSource {
  constructor(seed = Math.floor(Math.random() * 0x100000000)) {
    this.state = (Number(seed) >>> 0) || 0x6d2b79f5;
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

  signed() {
    return this.next() * 2 - 1;
  }
}

function generateMidpointLine(
  pointCount,
  left,
  right,
  initialAmplitude,
  roughness,
  randomSigned,
) {
  const line = new Float32Array(pointCount);
  line[0] = left;
  line[pointCount - 1] = right;
  let step = pointCount - 1;
  let amplitude = initialAmplitude;

  while (step > 1) {
    const half = step / 2;
    for (let index = half; index < pointCount - 1; index += step) {
      line[index] =
        (line[index - half] + line[index + half]) * 0.5 +
        randomSigned() * amplitude;
    }
    step = half;
    amplitude *= roughness;
  }

  return line;
}

function sampleLine(line, width, x) {
  if (width <= 1) return line[0];
  const position = x * (line.length - 1) / (width - 1);
  const index = Math.trunc(position);
  if (index < 0) return line[0];
  if (index >= line.length - 1) return line[line.length - 1];
  const fraction = position - index;
  return line[index] * (1 - fraction) + line[index + 1] * fraction;
}

class MidpointSimulation {
  constructor(seed) {
    this.width = MAP.width;
    this.height = MAP.height;
    this.cellCount = MAP.width * MAP.height;
    this.visible = new Uint8Array(this.cellCount);
    this.bands = new Uint8Array(this.cellCount);
    this.densities = new Uint8Array(this.cellCount);
    this.random = new RandomSource(seed);

    this.pattern = 0;
    this.theme = 0;
    this.glyphSet = 2;
    this.morphRate = SIM.defaultMorphRate;
    this.tickRate = SIM.defaultTickRate;
    this.paused = false;
    this.showGlyphs = true;
    this.morphProgress = 0;
    this.accumulator = 0;
    this.specs = [];
    this.keyframeA = [];
    this.keyframeB = [];
    this.liveLines = [];

    this.reset();
  }

  generateKeyframe(spec) {
    const endpointJitter = spec.amplitude * 0.5;
    const left =
      spec.yCenter + spec.leftOffset + this.random.signed() * endpointJitter;
    const right =
      spec.yCenter + spec.rightOffset + this.random.signed() * endpointJitter;
    return generateMidpointLine(
      SIM.linePoints,
      left,
      right,
      spec.amplitude,
      spec.roughness,
      () => this.random.signed(),
    );
  }

  generateAllKeyframes() {
    return this.specs.map((spec) => this.generateKeyframe(spec));
  }

  interpolateLiveLines() {
    const amount = this.morphProgress;
    const inverse = 1 - amount;

    for (let lineIndex = 0; lineIndex < this.specs.length; lineIndex += 1) {
      const start = this.keyframeA[lineIndex];
      const end = this.keyframeB[lineIndex];
      const live = this.liveLines[lineIndex];
      for (let point = 0; point < SIM.linePoints; point += 1) {
        live[point] = inverse * start[point] + amount * end[point];
      }
    }
  }

  rotateKeyframes() {
    this.keyframeA = this.keyframeB;
    this.keyframeB = this.generateAllKeyframes();
  }

  paintCell(x, y, band, density) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const index = y * this.width + x;
    this.visible[index] = 1;
    this.bands[index] = band & 3;
    this.densities[index] = density;
  }

  paintLineOnly(line, band, density) {
    for (let x = 0; x < this.width; x += 1) {
      const y = Math.trunc(sampleLine(line, this.width, x));
      if (y >= 0 && y < this.height) this.paintCell(x, y, band, density);
    }
  }

  paintFillBelow(line, band, density) {
    for (let x = 0; x < this.width; x += 1) {
      let start = Math.trunc(sampleLine(line, this.width, x));
      if (start < 0) start = 0;
      if (start >= this.height) continue;
      for (let y = start; y < this.height; y += 1) {
        this.paintCell(x, y, band, density);
      }
    }
  }

  paintFillAbove(line, band, density) {
    for (let x = 0; x < this.width; x += 1) {
      let end = Math.trunc(sampleLine(line, this.width, x));
      if (end < 0) continue;
      if (end >= this.height) end = this.height - 1;
      for (let y = 0; y <= end; y += 1) {
        this.paintCell(x, y, band, density);
      }
    }
  }

  rasterize() {
    this.visible.fill(0);
    this.bands.fill(0);
    this.densities.fill(0);

    for (let index = 0; index < this.specs.length; index += 1) {
      const spec = this.specs[index];
      const line = this.liveLines[index];
      if (spec.style === STYLE.fillBelow) {
        this.paintFillBelow(line, spec.band, spec.density);
      } else if (spec.style === STYLE.fillAbove) {
        this.paintFillAbove(line, spec.band, spec.density);
      } else {
        this.paintLineOnly(line, spec.band, spec.density);
      }

      if (spec.outlineBand >= 0 && spec.style !== STYLE.thinLine) {
        this.paintLineOnly(line, spec.outlineBand, DENSITY.high);
      }
    }
  }

  reset(seed) {
    if (seed !== undefined) this.random.reseed(seed);
    this.morphProgress = 0;
    this.accumulator = 0;
    this.specs = createPatternSpecs(
      this.pattern,
      this.height,
      () => this.random.next(),
    );
    this.keyframeA = this.generateAllKeyframes();
    this.keyframeB = this.generateAllKeyframes();
    this.liveLines = this.keyframeA.map((line) => Float32Array.from(line));
    this.rasterize();
  }

  stepFixed(delta) {
    this.morphProgress += this.morphRate * delta;
    if (this.morphProgress >= 1) {
      this.rotateKeyframes();
      this.morphProgress = 0;
    }
    this.interpolateLiveLines();
    this.rasterize();
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
    while (this.accumulator >= fixedDelta && steps < SIM.maxStepsPerFrame) {
      this.stepFixed(fixedDelta);
      this.accumulator -= fixedDelta;
      steps += 1;
    }
    if (steps === SIM.maxStepsPerFrame) {
      this.accumulator = Math.min(this.accumulator, fixedDelta);
    }
    return steps;
  }

  setPattern(pattern) {
    this.pattern = clamp(Math.round(Number(pattern)), 0, PATTERN_NAMES.length - 1);
    this.reset();
  }

  cyclePattern(direction = 1) {
    this.setPattern((this.pattern + direction + PATTERN_NAMES.length) % PATTERN_NAMES.length);
  }

  setTheme(theme) {
    this.theme = clamp(Math.round(Number(theme)), 0, THEMES.length - 1);
  }

  cycleTheme(direction = 1) {
    this.setTheme((this.theme + direction + THEMES.length) % THEMES.length);
  }

  setGlyphSet(glyphSet) {
    this.glyphSet = clamp(Math.round(Number(glyphSet)), 0, GLYPH_SETS.length - 1);
  }

  cycleGlyphSet(direction = 1) {
    this.setGlyphSet((this.glyphSet + direction + GLYPH_SETS.length) % GLYPH_SETS.length);
  }

  setMorphRate(rate) {
    this.morphRate = clamp(Number(rate), SIM.minMorphRate, SIM.maxMorphRate);
  }

  adjustMorphRate(direction) {
    this.setMorphRate(direction > 0 ? this.morphRate * 2 : this.morphRate * 0.5);
  }

  setTickRate(rate) {
    this.tickRate = clamp(
      Math.round(Number(rate) / SIM.tickRateStep) * SIM.tickRateStep,
      SIM.minTickRate,
      SIM.maxTickRate,
    );
    this.accumulator = 0;
  }

  adjustTickRate(direction) {
    this.setTickRate(this.tickRate + direction * SIM.tickRateStep);
  }

  togglePaused() { this.paused = !this.paused; }
}

export { generateMidpointLine, MidpointSimulation, sampleLine };
