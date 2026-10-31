import { evaluateAllCells } from "./ContourPatterns.js";
import { MAP, PATTERNS, SIM, THEMES } from "./config.js";
import { ScalarField } from "./ScalarField.js";

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

class MarchingSquaresSimulation {
  constructor() {
    this.field = new ScalarField(MAP.width, MAP.height);
    this.cellCount = MAP.width * MAP.height;
    this.glow = new Uint8Array(this.cellCount);
    this.bands = new Uint8Array(this.cellCount);
    this.glyphs = new Uint8Array(this.cellCount);

    this.pattern = 0;
    this.theme = 0;
    this.threshold = SIM.defaultThreshold;
    this.fieldTime = 0;
    this.sweepPhase = 0;
    this.driftMultiplier = SIM.defaultDriftMultiplier;
    this.tickRate = SIM.defaultTickRate;
    this.paused = false;
    this.showGlyphs = true;
    this.accumulator = 0;

    this.reset();
  }

  rebuildField() {
    this.field.rebuild(this.fieldTime);
  }

  evaluateContours() {
    evaluateAllCells(
      this.field,
      this.pattern,
      this.threshold,
      this.fieldTime,
      this.sweepPhase,
      this.glow,
      this.bands,
      this.glyphs,
    );
  }

  reset(seed) {
    this.field.reset(seed);
    this.fieldTime = 0;
    this.sweepPhase = 0;
    this.threshold = SIM.defaultThreshold;
    this.accumulator = 0;
    this.glow.fill(0);
    this.bands.fill(0);
    this.glyphs.fill(0);
    this.rebuildField();
    this.evaluateContours();
  }

  stepFixed(delta) {
    this.fieldTime +=
      SIM.fieldDrift * this.driftMultiplier * delta;
    this.sweepPhase = (
      this.sweepPhase +
      delta * this.driftMultiplier / SIM.sweepPeriod
    ) % 1;
    this.rebuildField();
    this.evaluateContours();
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

  setPattern(pattern) {
    this.pattern = clamp(
      Math.round(Number(pattern)),
      0,
      PATTERNS.length - 1,
    );
    this.evaluateContours();
  }

  cyclePattern(direction = 1) {
    this.setPattern(
      (this.pattern + direction + PATTERNS.length) % PATTERNS.length,
    );
  }

  setTheme(theme) {
    this.theme = clamp(Math.round(Number(theme)), 0, THEMES.length - 1);
  }

  cycleTheme(direction = 1) {
    this.setTheme((this.theme + direction + THEMES.length) % THEMES.length);
  }

  setThreshold(threshold) {
    const steps = Math.round(Number(threshold) / SIM.thresholdStep);
    this.threshold = clamp(
      steps * SIM.thresholdStep,
      SIM.minThreshold,
      SIM.maxThreshold,
    );
    this.evaluateContours();
  }

  adjustThreshold(direction) {
    this.setThreshold(this.threshold + direction * SIM.thresholdStep);
  }

  setDriftMultiplier(multiplier) {
    const choices = [1, 2, 4, 8, 16];
    const requested = clamp(
      Number(multiplier) || 1,
      SIM.minDriftMultiplier,
      SIM.maxDriftMultiplier,
    );
    this.driftMultiplier = choices.reduce((nearest, choice) =>
      Math.abs(choice - requested) < Math.abs(nearest - requested)
        ? choice
        : nearest,
    );
  }

  adjustDriftMultiplier(direction) {
    this.setDriftMultiplier(
      direction > 0
        ? this.driftMultiplier * 2
        : this.driftMultiplier / 2,
    );
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

  togglePaused() {
    this.paused = !this.paused;
  }

  get displayedThreshold() {
    if (this.pattern !== 25) return this.threshold;
    const middle = (SIM.minThreshold + SIM.maxThreshold) * 0.5;
    const amplitude = (SIM.maxThreshold - SIM.minThreshold) * 0.5;
    return middle + amplitude * Math.sin(this.sweepPhase * Math.PI * 2);
  }
}

export { MarchingSquaresSimulation };
