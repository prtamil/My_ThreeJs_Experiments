import { SIM } from "./config.js";

const F2 = 0.36602540378443864;
const G2 = 0.21132486540518713;
const OUTPUT_GAIN = 70;
const GRADIENTS = Object.freeze([
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [1, 0], [-1, 0],
  [0, 1], [0, -1], [0, 1], [0, -1],
]);

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

class SimplexNoise {
  constructor(seed) {
    this.random = new RandomSource(seed);
    this.permutation = new Uint8Array(512);
    this.shuffle();
  }

  shuffle(seed) {
    if (seed !== undefined) this.random.reseed(seed);
    const base = Uint8Array.from({ length: 256 }, (_, index) => index);
    for (let index = 255; index > 0; index -= 1) {
      const other = Math.floor(this.random.next() * (index + 1));
      const temporary = base[index];
      base[index] = base[other];
      base[other] = temporary;
    }
    for (let index = 0; index < 256; index += 1) {
      this.permutation[index] = base[index];
      this.permutation[index + 256] = base[index];
    }
  }

  cornerContribution(gradientIndex, x, y) {
    let falloff = 0.5 - x * x - y * y;
    if (falloff <= 0) return 0;
    falloff *= falloff;
    falloff *= falloff;
    const gradient = GRADIENTS[gradientIndex];
    return falloff * (gradient[0] * x + gradient[1] * y);
  }

  sample(inputX, inputY) {
    const skew = (inputX + inputY) * F2;
    const cellI = Math.floor(inputX + skew);
    const cellJ = Math.floor(inputY + skew);
    const unskew = (cellI + cellJ) * G2;
    const originX = inputX - (cellI - unskew);
    const originY = inputY - (cellJ - unskew);
    const middleI = originX > originY ? 1 : 0;
    const middleJ = originX > originY ? 0 : 1;
    const corners = [[0, 0], [middleI, middleJ], [1, 1]];
    let sum = 0;

    for (const [offsetI, offsetJ] of corners) {
      const cornerUnskew = (offsetI + offsetJ) * G2;
      const x = originX - offsetI + cornerUnskew;
      const y = originY - offsetJ + cornerUnskew;
      const hashI = (cellI + offsetI) & 255;
      const hashJ = (cellJ + offsetJ) & 255;
      const rowOffset = this.permutation[hashJ];
      const gradient = this.permutation[hashI + rowOffset] % 12;
      sum += this.cornerContribution(gradient, x, y);
    }
    return OUTPUT_GAIN * sum;
  }

  fbm(x, y) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maximumAmplitude = 0;
    for (let octave = 0; octave < SIM.octaves; octave += 1) {
      total += amplitude * this.sample(x * frequency, y * frequency);
      maximumAmplitude += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / maximumAmplitude;
  }

  fbmAbsolute(x, y) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maximumAmplitude = 0;
    for (let octave = 0; octave < SIM.octaves; octave += 1) {
      total += amplitude * Math.abs(this.sample(x * frequency, y * frequency));
      maximumAmplitude += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / maximumAmplitude;
  }
}

export { F2, G2, GRADIENTS, RandomSource, SimplexNoise };
