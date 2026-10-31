import { METRIC } from "./WorleyNoise.js";
import { SIM } from "./config.js";

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function bandFromGlow(glow) {
  return Math.trunc(glow * 3.999) & 3;
}

function standard(glow) {
  const clamped = clamp(glow);
  return { glow: clamped, band: bandFromGlow(clamped) };
}

class WorleyPatterns {
  constructor(noise) { this.noise = noise; }

  sample(pattern, x, y, time) {
    const noise = this.noise;
    let result;

    switch (pattern) {
      case 0:
        result = noise.query(x, y, time);
        return standard(result.f1 / 1.414);
      case 1:
        result = noise.query(x, y, time);
        return standard((result.f2 - 0.3) / 1.6);
      case 2:
        result = noise.query(x, y, time);
        return standard((result.f3 - 0.5) / 2);
      case 3: {
        result = noise.query(x, y, time);
        const glow = 1 - clamp((result.f2 - result.f1) * 2.5);
        return { glow, band: bandFromGlow(clamp(result.f1 / 1.414)) };
      }
      case 4:
        result = noise.query(x, y, time);
        return standard(result.f1 / (result.f2 + 0.001));
      case 5:
        result = noise.query(x, y, time);
        return standard((result.f1 + result.f2 - 0.3) / 2);
      case 6:
        result = noise.query(x, y, time);
        return standard(result.f1 * result.f2 * 1.5);
      case 7:
        result = noise.query(x, y, time);
        return standard(1 - clamp((result.f3 - result.f2) * 2.5));
      case 8:
        result = noise.query(x, y, time);
        return standard((result.f2 - result.f1) * 2.5);
      case 9:
        result = noise.query(x, y, time);
        return standard(1 - clamp(result.f1 / 1.414));
      case 10:
        result = noise.query(x, y, time, METRIC.MANHATTAN);
        return standard(result.f1 / 2);
      case 11:
        result = noise.query(x, y, time, METRIC.CHEBYSHEV);
        return standard(result.f1);
      case 12:
        result = noise.query(x, y, time, METRIC.SUPERELLIPSE);
        return standard(result.f1 / 1.4);
      case 13:
        result = noise.query(x, y, time, METRIC.STAR);
        return standard(result.f1 / 1.5);
      case 14:
        result = noise.query(x, y, time, METRIC.STRETCHED);
        return standard(result.f1 / 2.5);
      case 15:
        result = noise.query(x, y, time);
        return {
          glow: 1 - clamp(result.f1 * 0.4, 0, 0.4),
          band: result.cellId & 3,
        };
      case 16:
        result = noise.queryWeighted(x, y, time);
        return {
          glow: 1 - clamp(result.f1 * 0.5, 0, 0.5),
          band: result.cellId & 3,
        };
      case 17: {
        result = noise.query(x, y, time);
        const rate = 0.5 + noise.cellHashToUnit(result.cellId) * 3;
        const pulse = 0.5 + 0.5 * Math.sin(time * rate);
        const base = 1 - clamp(result.f1 * 0.4, 0, 0.4);
        return { glow: clamp(base * pulse), band: result.cellId & 3 };
      }
      case 18:
        result = noise.query(x, y, time);
        return { glow: noise.cellHashToUnit(result.cellId), band: result.cellId & 3 };
      case 19: {
        result = noise.query(x, y, time);
        const edges = 1 - clamp((result.f2 - result.f1) * 3);
        const cellLevel = 0.3 + 0.7 * noise.cellHashToUnit(result.cellId);
        return { glow: clamp(edges * cellLevel), band: result.cellId & 3 };
      }
      case 20: {
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        for (let octave = 0; octave < SIM.fbmOctaves; octave += 1) {
          result = noise.query(x * frequency, y * frequency, time);
          total += amplitude * result.f1 / 1.414;
          amplitude *= 0.5;
          frequency *= 2;
        }
        return standard(total / SIM.fbmAmplitudeSum);
      }
      case 21: {
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        for (let octave = 0; octave < SIM.fbmOctaves; octave += 1) {
          result = noise.query(x * frequency, y * frequency, time);
          const edges = 1 - clamp((result.f2 - result.f1) * 2.5);
          total += amplitude * edges;
          amplitude *= 0.5;
          frequency *= 2;
        }
        return standard(total / SIM.fbmAmplitudeSum);
      }
      case 22: {
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        for (let octave = 0; octave < SIM.fbmOctaves; octave += 1) {
          result = noise.query(x * frequency, y * frequency, time);
          total += amplitude * (1 - clamp(result.f1 / 1.414));
          amplitude *= 0.5;
          frequency *= 2;
        }
        return standard(total / SIM.fbmAmplitudeSum);
      }
      case 23: {
        const coarse = noise.query(x, y, time);
        const fine = noise.query(x * 2, y * 2, time);
        return standard((coarse.f1 + fine.f1 * 0.5) / 1.5);
      }
      case 24: {
        const parity = (Math.floor(x) + Math.floor(y)) & 1;
        const scale = parity ? 2 : 0.5;
        result = noise.query(x * scale, y * scale, time);
        return standard(result.f1 / 1.414);
      }
      case 25: {
        const warpX = noise.query(x * 0.5, y * 0.5, time);
        const warpY = noise.query(x * 0.5 + 5.2, y * 0.5 + 1.3, time);
        const offsetX = (warpX.f1 - 0.5) * 1.5;
        const offsetY = (warpY.f1 - 0.5) * 1.5;
        result = noise.query(x + offsetX, y + offsetY, time);
        return standard(1 - clamp((result.f2 - result.f1) * 2.5));
      }
      case 26: {
        const euclidean = noise.query(x, y, time, METRIC.EUCLIDEAN);
        const manhattan = noise.query(x, y, time, METRIC.MANHATTAN);
        return standard(0.5 * euclidean.f1 / 1.414 + 0.5 * manhattan.f1 / 2);
      }
      case 27: {
        result = noise.query(x, y, time);
        const peak = 0.5 + 0.5 * noise.cellHashToUnit(result.cellId);
        return {
          glow: clamp(peak * Math.exp(-result.f1 * 4)),
          band: result.cellId & 3,
        };
      }
      case 28: {
        result = noise.query(x, y, time);
        const value = 1 - clamp(result.f1 / 1.414);
        let glow = value * value;
        glow *= glow;
        glow *= glow;
        return standard(glow * 1.5);
      }
      case 29: {
        const warp = noise.query(x * 0.5, y * 0.5, time);
        const offsetX = (warp.f1 - 0.5) * 2;
        const offsetY = (warp.cellId & 1) ? offsetX : -offsetX;
        result = noise.query(x + offsetX, y + offsetY, time);
        return {
          glow: 1 - clamp((result.f2 - result.f1) * 2.5),
          band: result.cellId & 3,
        };
      }
      default:
        return { glow: 0, band: 0 };
    }
  }
}

export { bandFromGlow, clamp, WorleyPatterns };
