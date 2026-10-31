import { MAP, SIM } from "./config.js";

function hash32(value) {
  let hash = value >>> 0;
  hash = Math.imul((hash ^ (hash >>> 16)) >>> 0, 0x7feb352d) >>> 0;
  hash = Math.imul((hash ^ (hash >>> 15)) >>> 0, 0x846ca68b) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}

function smoothstep01(value) {
  return value * value * (3 - 2 * value);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

class ScalarField {
  constructor(width = MAP.width, height = MAP.height) {
    this.width = width;
    this.height = height;
    this.cellCount = width * height;
    this.samples = new Float32Array(this.cellCount);
    this.seed = 0;
    this.reset();
  }

  reset(seed = Math.floor(Math.random() * 0x100000000)) {
    this.seed = Number(seed) >>> 0;
  }

  at(x, y) {
    const column = Math.min(Math.max(Math.trunc(x), 0), this.width - 1);
    const row = Math.min(Math.max(Math.trunc(y), 0), this.height - 1);
    return this.samples[row * this.width + column];
  }

  latticeScalar(x, y) {
    const mixed = (
      Math.imul(x, 374761393) +
      Math.imul(y, 668265263) +
      this.seed
    ) >>> 0;
    return (hash32(mixed) >>> 8) / 16777215;
  }

  valueNoise(x, y) {
    const latticeX = Math.floor(x);
    const latticeY = Math.floor(y);
    const blendX = smoothstep01(x - latticeX);
    const blendY = smoothstep01(y - latticeY);
    const top = lerp(
      this.latticeScalar(latticeX, latticeY),
      this.latticeScalar(latticeX + 1, latticeY),
      blendX,
    );
    const bottom = lerp(
      this.latticeScalar(latticeX, latticeY + 1),
      this.latticeScalar(latticeX + 1, latticeY + 1),
      blendX,
    );
    return lerp(top, bottom, blendY);
  }

  fbm(x, y) {
    const octave0 = this.valueNoise(x, y) * 0.5;
    const octave1 = this.valueNoise(x * 2, y * 2) * 0.3;
    const octave2 = this.valueNoise(x * 4, y * 4) * 0.2;
    return Math.min(Math.max(octave0 + octave1 + octave2, 0), 1);
  }

  rebuild(time) {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const fieldX = x * SIM.fieldScale;
        const fieldY = y * SIM.fieldScale + time;
        this.samples[y * this.width + x] = this.fbm(fieldX, fieldY);
      }
    }
  }

  classify(x, y, threshold) {
    let marchingCase = 0;
    if (this.at(x, y + 1) >= threshold) marchingCase |= 1;
    if (this.at(x + 1, y + 1) >= threshold) marchingCase |= 2;
    if (this.at(x + 1, y) >= threshold) marchingCase |= 4;
    if (this.at(x, y) >= threshold) marchingCase |= 8;
    return marchingCase;
  }
}

export { hash32, ScalarField };
