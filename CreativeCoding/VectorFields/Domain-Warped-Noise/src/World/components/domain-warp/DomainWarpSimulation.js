import { NOISE, PATTERN_NAMES, SIM, THEMES } from "./config.js";

class DomainWarpSimulation {
  constructor() {
    this.pattern = 2;
    this.theme = 0;
    this.driftMultiplier = SIM.driftDefault;
    this.simFps = SIM.fpsDefault;
    this.paused = false;
    this.showGlyphs = true;
    this.noiseScale = NOISE.scale;
    this.warpAmount = NOISE.warpAmount;
    this.intensityGamma = NOISE.gamma;
    this.fieldTime = 0;
    this.flash = SIM.flashInitial;
    this.noiseRevision = 0;
  }

  step(delta) {
    if (this.paused) return;
    this.flash *= Math.exp(-SIM.flashDecay * delta);
    this.fieldTime += SIM.fieldDrift * this.driftMultiplier * delta;
  }

  reset() {
    this.fieldTime = 0;
    this.flash = SIM.flashInitial;
    this.noiseRevision += 1;
  }

  setPattern(pattern) {
    this.pattern = Math.min(
      Math.max(Math.round(Number(pattern)), 0),
      PATTERN_NAMES.length - 1,
    );
  }

  cyclePattern(direction) {
    this.pattern =
      (this.pattern + direction + PATTERN_NAMES.length) % PATTERN_NAMES.length;
  }

  setTheme(theme) {
    this.theme = Math.min(
      Math.max(Math.round(Number(theme)), 0),
      THEMES.length - 1,
    );
  }

  cycleTheme(direction) {
    this.theme = (this.theme + direction + THEMES.length) % THEMES.length;
  }

  changeDrift(direction) {
    if (direction > 0) {
      this.driftMultiplier = Math.min(
        this.driftMultiplier * 2,
        SIM.driftMax,
      );
    } else {
      this.driftMultiplier = Math.max(
        Math.floor(this.driftMultiplier / 2),
        SIM.driftMin,
      );
    }
  }

  changeSimulationRate(direction) {
    this.simFps = Math.min(
      Math.max(this.simFps + direction * SIM.fpsStep, SIM.fpsMin),
      SIM.fpsMax,
    );
  }

  togglePaused() { this.paused = !this.paused; }
}

export { DomainWarpSimulation };
