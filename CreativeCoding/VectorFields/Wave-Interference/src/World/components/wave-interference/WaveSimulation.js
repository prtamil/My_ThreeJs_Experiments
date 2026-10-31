import { MAP, SIM, THEMES } from "./config.js";

const TWO_PI = 2 * Math.PI;

class RandomSource {
  constructor(seed) {
    this.reseed(seed);
  }

  reseed(seed) {
    this.state = seed === undefined
      ? Math.floor(Math.random() * 0x100000000) >>> 0
      : Number(seed) >>> 0;
    if (this.state === 0) this.state = 0x6d2b79f5;
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

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

class WaveSimulation {
  constructor(seed) {
    this.random = new RandomSource(seed);
    this.sources = Array.from({ length: SIM.maxSources }, () => ({
      x: 0,
      y: 0,
      phase: 0,
    }));
    this.glow = new Float32Array(MAP.width * MAP.height);
    this.bands = new Uint8Array(MAP.width * MAP.height);
    this.sourceCount = SIM.defaultSources;
    this.wavelength = SIM.defaultWavelength;
    this.time = 0;
    this.paused = false;
    this.theme = 0;
    this.showGlyphs = true;
    this.scatterSources();
    this.evaluateField();
  }

  scatterSources() {
    for (const source of this.sources) {
      source.x = this.random.next() * MAP.width;
      source.y = this.random.next() * MAP.height;
      source.phase = this.random.next() * TWO_PI;
    }
  }

  reset(seed) {
    if (seed !== undefined) this.random.reseed(seed);
    else this.random.reseed();
    this.scatterSources();
    this.evaluateField();
  }

  sourceWaveAt(source, x, y) {
    const deltaX = x - source.x;
    const deltaY = (y - source.y) * SIM.cellAspect;
    const distance = Math.hypot(deltaX, deltaY);
    const waveNumber = TWO_PI / this.wavelength;
    const angularFrequency = TWO_PI * SIM.frequency;
    return Math.sin(
      waveNumber * distance - angularFrequency * this.time + source.phase,
    );
  }

  waveHeightAt(x, y) {
    let sum = 0;
    for (let index = 0; index < this.sourceCount; index += 1) {
      sum += this.sourceWaveAt(this.sources[index], x, y);
    }
    return sum / this.sourceCount;
  }

  heightToBand(height) {
    return clamp(
      Math.trunc((height + 1) * 0.5 * SIM.shadeCount),
      0,
      SIM.shadeCount - 1,
    );
  }

  evaluateField() {
    let index = 0;
    for (let y = 0; y < MAP.height; y += 1) {
      for (let x = 0; x < MAP.width; x += 1) {
        const height = this.waveHeightAt(x, y);
        this.glow[index] = (height + 1) * 0.5;
        this.bands[index] = this.heightToBand(height);
        index += 1;
      }
    }
  }

  setSourceCount(value) {
    this.sourceCount = Math.round(clamp(
      Number(value),
      SIM.minSources,
      SIM.maxSources,
    ));
    this.evaluateField();
  }

  adjustSourceCount(delta) {
    this.setSourceCount(this.sourceCount + delta);
  }

  setWavelength(value) {
    this.wavelength = clamp(
      Number(value),
      SIM.minWavelength,
      SIM.maxWavelength,
    );
    this.evaluateField();
  }

  adjustWavelength(delta) {
    this.setWavelength(this.wavelength + delta * SIM.wavelengthStep);
  }

  setTheme(value) {
    this.theme = Math.round(clamp(Number(value), 0, THEMES.length - 1));
  }

  cycleTheme() {
    this.theme = (this.theme + 1) % THEMES.length;
  }

  togglePaused() {
    this.paused = !this.paused;
  }

  step(delta) {
    if (this.paused) return;
    this.time += clamp(Number(delta) || 0, 0, SIM.maxFrameDelta);
    this.evaluateField();
  }
}

export { RandomSource, TWO_PI, WaveSimulation };
