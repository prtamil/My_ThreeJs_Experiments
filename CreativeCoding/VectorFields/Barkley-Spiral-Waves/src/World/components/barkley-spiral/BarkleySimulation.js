import { MAP, MODEL, SIM, THEMES } from "./config.js";

function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

class BarkleySimulation {
  constructor() {
    this.width = MAP.width;
    this.height = MAP.height;
    this.cellCount = this.width * this.height;
    this.u = new Float32Array(this.cellCount);
    this.uNext = new Float32Array(this.cellCount);
    this.v = new Float32Array(this.cellCount);

    this.a = MODEL.a;
    this.b = MODEL.b;
    this.epsilon = MODEL.epsilon;
    this.diffusion = MODEL.diffusion;
    this.substeps = SIM.defaultSubsteps;
    this.theme = 0;
    this.paused = false;
    this.showGlyphs = true;
    this.frame = 0;

    this.reset();
  }

  reset() {
    const halfWidth = Math.floor(this.width / 2);
    const halfHeight = Math.floor(this.height / 2);

    for (let row = 0; row < this.height; row += 1) {
      for (let column = 0; column < this.width; column += 1) {
        const index = row * this.width + column;
        this.u[index] = column < halfWidth ? 1 : 0;
        this.uNext[index] = 0;
        this.v[index] = row < halfHeight ? MODEL.seedBlockRecovery : 0;
      }
    }

    this.frame = 0;
  }

  step() {
    const width = this.width;
    const height = this.height;
    const u = this.u;
    const uNext = this.uNext;
    const v = this.v;
    const inverseAspectSquared = 1 / (MODEL.cellAspect * MODEL.cellAspect);
    const timeStep = MODEL.timeStep;

    for (let row = 0; row < height; row += 1) {
      const rowOffset = row * width;

      for (let column = 0; column < width; column += 1) {
        const index = rowOffset + column;
        const excitation = u[index];
        const recovery = v[index];
        const west = column > 0 ? u[index - 1] : excitation;
        const east = column < width - 1 ? u[index + 1] : excitation;
        const north = row > 0 ? u[index - width] : excitation;
        const south = row < height - 1 ? u[index + width] : excitation;
        const laplacian =
          east +
          west -
          2 * excitation +
          (north + south - 2 * excitation) * inverseAspectSquared;
        const threshold = (recovery + this.b) / this.a;
        const reaction =
          (excitation * (1 - excitation) * (excitation - threshold)) /
          this.epsilon;
        const excitationDelta = reaction + this.diffusion * laplacian;

        uNext[index] = clamp01(excitation + timeStep * excitationDelta);
        v[index] = clamp01(
          recovery + timeStep * (excitation - recovery),
        );
      }
    }

    this.u = uNext;
    this.uNext = u;
  }

  stepFrame() {
    if (this.paused) return;

    for (let index = 0; index < this.substeps; index += 1) {
      this.step();
    }

    this.frame += 1;
  }

  setSubsteps(substeps) {
    this.substeps = Math.min(
      Math.max(Math.round(Number(substeps)), SIM.minSubsteps),
      SIM.maxSubsteps,
    );
  }

  adjustSpeed(direction) {
    this.setSubsteps(this.substeps + direction);
  }

  setTheme(theme) {
    this.theme = Math.min(
      Math.max(Math.round(Number(theme)), 0),
      THEMES.length - 1,
    );
  }

  cycleTheme(direction = 1) {
    this.theme =
      (this.theme + direction + THEMES.length) % THEMES.length;
  }

  togglePaused() {
    this.paused = !this.paused;
  }
}

export { BarkleySimulation };
