import { SIM } from "./config.js";

const LATTICE_HASH_MUL_X = 374761393;
const LATTICE_HASH_MUL_Y = 668265263;
const HASH_TOP24_TO_UNIT = 1 / 16777215;

function hash32(input) {
  let value = Number(input) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b) >>> 0;
  return (value ^ (value >>> 16)) >>> 0;
}

function smoothstep01(value) {
  return value * value * (3 - 2 * value);
}

function quintic01(value) {
  return value * value * value * (
    value * (value * 6 - 15) + 10
  );
}

function cosine01(value) {
  return (1 - Math.cos(value * Math.PI)) * 0.5;
}

function interpolationCurve(value, mode) {
  if (mode === 2) return smoothstep01(value);
  if (mode === 3) return quintic01(value);
  if (mode === 4) return cosine01(value);
  return value;
}

function lerp(first, second, amount) {
  return first + (second - first) * amount;
}

class ValueNoise {
  constructor(seed) {
    this.reseed(seed);
  }

  reseed(seed) {
    this.seed = seed === undefined
      ? Math.floor(Math.random() * 0x100000000) >>> 0
      : Number(seed) >>> 0;
  }

  latticeScalar(x, y) {
    const latticeHash = (
      Math.imul(x | 0, LATTICE_HASH_MUL_X) +
      Math.imul(y | 0, LATTICE_HASH_MUL_Y) +
      this.seed
    ) >>> 0;
    return (hash32(latticeHash) >>> 8) * HASH_TOP24_TO_UNIT;
  }

  sample(x, y, interpolationMode = 2) {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const fractionX = x - cellX;
    const fractionY = y - cellY;

    if (interpolationMode === 0) {
      const cornerX = fractionX < 0.5 ? cellX : cellX + 1;
      const cornerY = fractionY < 0.5 ? cellY : cellY + 1;
      return this.latticeScalar(cornerX, cornerY);
    }

    const corner00 = this.latticeScalar(cellX, cellY);
    const corner10 = this.latticeScalar(cellX + 1, cellY);
    const corner01 = this.latticeScalar(cellX, cellY + 1);
    const corner11 = this.latticeScalar(cellX + 1, cellY + 1);
    const blendX = interpolationCurve(fractionX, interpolationMode);
    const blendY = interpolationCurve(fractionY, interpolationMode);
    const bottomEdge = lerp(corner00, corner10, blendX);
    const topEdge = lerp(corner01, corner11, blendX);
    return lerp(bottomEdge, topEdge, blendY);
  }

  fbmN(x, y, octaveCount) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maximumAmplitude = 0;
    for (let octave = 0; octave < octaveCount; octave += 1) {
      const value = this.sample(x * frequency, y * frequency, 2) * 2 - 1;
      total += amplitude * value;
      maximumAmplitude += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / maximumAmplitude * 0.5 + 0.5;
  }

  fbm(x, y) {
    return this.fbmN(x, y, SIM.octaves);
  }

  fbmAbsolute(x, y) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maximumAmplitude = 0;
    for (let octave = 0; octave < SIM.octaves; octave += 1) {
      const value = this.sample(x * frequency, y * frequency, 2) * 2 - 1;
      total += amplitude * Math.abs(value);
      maximumAmplitude += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / maximumAmplitude;
  }
}

export {
  cosine01,
  HASH_TOP24_TO_UNIT,
  hash32,
  LATTICE_HASH_MUL_X,
  LATTICE_HASH_MUL_Y,
  quintic01,
  smoothstep01,
  ValueNoise,
};
