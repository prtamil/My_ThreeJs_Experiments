import {
  GLYPH_STYLES,
  MAP,
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "./config.js";
import { createAttractors, updateActiveAttractors } from "./attractors.js";
import { sampleVelocity } from "./patterns.js";

class ParticleSystem {
  constructor() {
    this.width = MAP.width;
    this.height = MAP.height;
    this.totalCells = this.width * this.height;
    this.particleCount = SIM.particleCount;

    this.glow = new Float32Array(this.totalCells);
    this.colorBand = new Uint8Array(this.totalCells);
    this.particleX = new Float32Array(this.particleCount);
    this.particleY = new Float32Array(this.particleCount);
    this.particleColor = new Uint8Array(this.particleCount);
    this.particleAge = new Uint16Array(this.particleCount);
    this.particleMaxAge = new Uint16Array(this.particleCount);
    this.velocity = new Float32Array(2);

    this.pattern = 0;
    this.theme = 0;
    this.glyphStyle = 2;
    this.speed = SIM.speedDefault;
    this.simFps = SIM.fpsDefault;
    this.paused = false;
    this.time = 0;
    this.baseAttractors = [];
    this.activeAttractors = [];

    this.reset();
  }

  reset() {
    this.time = 0;
    this.glow.fill(0);
    this.colorBand.fill(0);
    this.baseAttractors = createAttractors(
      this.pattern,
      this.width,
      this.height,
    );
    updateActiveAttractors(
      this.baseAttractors,
      this.activeAttractors,
      this.time,
    );

    for (let index = 0; index < this.particleCount; index += 1) {
      this.spawn(index);
    }
  }

  spawn(index) {
    this.particleX[index] = Math.random() * this.width;
    this.particleY[index] = Math.random() * this.height;
    this.particleColor[index] = Math.floor(Math.random() * 4);
    this.particleAge[index] = 0;
    this.particleMaxAge[index] =
      SIM.ageMinTicks +
      Math.floor(Math.random() * (SIM.ageMaxTicks - SIM.ageMinTicks));
  }

  step(delta) {
    const decay = Math.exp(-SIM.trailGlowDecay * delta);

    for (let index = 0; index < this.totalCells; index += 1) {
      this.glow[index] *= decay;
    }

    this.time += delta;
    updateActiveAttractors(
      this.baseAttractors,
      this.activeAttractors,
      this.time,
    );

    for (let index = 0; index < this.particleCount; index += 1) {
      this.stepParticle(index, delta);
    }
  }

  stepParticle(index, delta) {
    let x = this.particleX[index];
    let y = this.particleY[index];

    sampleVelocity(this, x, y, this.velocity);
    const magnitude = Math.hypot(this.velocity[0], this.velocity[1]);

    if (magnitude > SIM.velocityEpsilon) {
      this.velocity[0] /= magnitude;
      this.velocity[1] /= magnitude;
    }

    x += this.velocity[0] * this.speed * delta;
    y += this.velocity[1] * this.speed * delta;
    this.particleX[index] = x;
    this.particleY[index] = y;
    this.particleAge[index] += 1;

    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    if (
      cellX >= 0 &&
      cellX < this.width &&
      cellY >= 0 &&
      cellY < this.height
    ) {
      const cellIndex = cellY * this.width + cellX;
      this.glow[cellIndex] = SIM.trailHitIntensity;
      this.colorBand[cellIndex] = this.particleColor[index];
    }

    if (
      this.particleAge[index] >= this.particleMaxAge[index] ||
      x < 0 ||
      x >= this.width ||
      y < 0 ||
      y >= this.height
    ) {
      this.spawn(index);
    }
  }

  cyclePattern(direction) {
    this.setPattern(
      (this.pattern + direction + PATTERN_NAMES.length) % PATTERN_NAMES.length,
    );
  }

  setPattern(pattern) {
    this.pattern = Math.max(
      0,
      Math.min(Number(pattern), PATTERN_NAMES.length - 1),
    );
    this.reset();
  }

  cycleTheme(direction) {
    this.theme = (this.theme + direction + THEMES.length) % THEMES.length;
  }

  cycleGlyphStyle(direction) {
    this.glyphStyle =
      (this.glyphStyle + direction + GLYPH_STYLES.length) %
      GLYPH_STYLES.length;
  }

  changeSpeed(direction) {
    if (direction > 0) {
      this.speed = Math.min(this.speed * 2, SIM.speedMax);
    } else {
      this.speed = Math.max(Math.floor(this.speed / 2), SIM.speedMin);
    }
  }

  changeSimulationRate(direction) {
    this.simFps = Math.max(
      SIM.fpsMin,
      Math.min(this.simFps + direction * SIM.fpsStep, SIM.fpsMax),
    );
  }

  togglePaused() {
    this.paused = !this.paused;
  }
}

export { ParticleSystem };
