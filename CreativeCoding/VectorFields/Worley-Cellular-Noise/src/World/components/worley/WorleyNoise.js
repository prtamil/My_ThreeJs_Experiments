import { SIM } from "./config.js";

const METRIC = Object.freeze({
  EUCLIDEAN: 0,
  MANHATTAN: 1,
  CHEBYSHEV: 2,
  SUPERELLIPSE: 3,
  STAR: 4,
  STRETCHED: 5,
});
const HASH_UNIT_FROM_16BIT = 1 / 65535;
const HASH_UNIT_FROM_BYTE = 1 / 255;
const HASH_PHASE_FROM_BYTE = 1 / 40;
const HASH_PERSONALITY_SALT = 0xa5a5a5a5;

function hash32(input) {
  let value = Number(input) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b) >>> 0;
  return (value ^ (value >>> 16)) >>> 0;
}

function hashByte(hash, index) {
  return (hash >>> (index * 8)) & 0xff;
}

function hashHalfword(hash, index) {
  return (hash >>> (index * 16)) & 0xffff;
}

class WorleyNoise {
  constructor(seed) { this.reseed(seed); }

  reseed(seed) {
    this.seed = seed === undefined
      ? Math.floor(Math.random() * 0x100000000) >>> 0
      : Number(seed) >>> 0;
  }

  tileHash(x, y) {
    const hash = (
      Math.imul(x | 0, 374761393) +
      Math.imul(y | 0, 668265263) +
      this.seed
    ) >>> 0;
    return hash32(hash);
  }

  featurePoint(x, y, time) {
    const hash = this.tileHash(x, y);
    let offsetX = hashHalfword(hash, 1) * HASH_UNIT_FROM_16BIT;
    let offsetY = hashHalfword(hash, 0) * HASH_UNIT_FROM_16BIT;
    const phaseX = hashByte(hash, 1) * HASH_PHASE_FROM_BYTE;
    const phaseY = hashByte(hash, 3) * HASH_PHASE_FROM_BYTE;
    offsetX += SIM.wobbleAmount * Math.sin(time + phaseX);
    offsetY += SIM.wobbleAmount * Math.cos(time + phaseY);
    return { x: x + offsetX, y: y + offsetY, hash };
  }

  metricDistance(metric, x, y) {
    const absoluteX = Math.abs(x);
    const absoluteY = Math.abs(y);
    if (metric === METRIC.MANHATTAN) return absoluteX + absoluteY;
    if (metric === METRIC.CHEBYSHEV) return Math.max(absoluteX, absoluteY);
    if (metric === METRIC.SUPERELLIPSE) {
      return Math.cbrt(absoluteX ** 3 + absoluteY ** 3);
    }
    if (metric === METRIC.STAR) {
      const sum = Math.sqrt(absoluteX) + Math.sqrt(absoluteY);
      return sum * sum;
    }
    if (metric === METRIC.STRETCHED) return 2 * absoluteX + absoluteY;
    return Math.hypot(x, y);
  }

  query(fieldX, fieldY, time, metric = METRIC.EUCLIDEAN) {
    const tileX = Math.floor(fieldX);
    const tileY = Math.floor(fieldY);
    const result = { f1: 1e10, f2: 1e10, f3: 1e10, cellId: 0 };
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const point = this.featurePoint(tileX + offsetX, tileY + offsetY, time);
        const distance = this.metricDistance(
          metric,
          point.x - fieldX,
          point.y - fieldY,
        );
        this.consider(result, distance, point.hash);
      }
    }
    return result;
  }

  queryWeighted(fieldX, fieldY, time) {
    const tileX = Math.floor(fieldX);
    const tileY = Math.floor(fieldY);
    const result = { f1: 1e10, f2: 1e10, f3: 1e10, cellId: 0 };
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const point = this.featurePoint(tileX + offsetX, tileY + offsetY, time);
        const rawDistance = Math.hypot(point.x - fieldX, point.y - fieldY);
        const weight = 0.5 + hashByte(point.hash, 2) * HASH_UNIT_FROM_BYTE;
        this.consider(result, rawDistance / weight, point.hash);
      }
    }
    return result;
  }

  consider(result, distance, sourceHash) {
    if (distance < result.f1) {
      result.f3 = result.f2;
      result.f2 = result.f1;
      result.f1 = distance;
      result.cellId = sourceHash;
    } else if (distance < result.f2) {
      result.f3 = result.f2;
      result.f2 = distance;
    } else if (distance < result.f3) {
      result.f3 = distance;
    }
  }

  cellHashToUnit(cellId) {
    const remixed = hash32((cellId ^ HASH_PERSONALITY_SALT) >>> 0);
    return hashHalfword(remixed, 0) * HASH_UNIT_FROM_16BIT;
  }
}

export { hash32, METRIC, WorleyNoise };
