import { SIM } from "./config.js";
import { clamp, positionKey } from "./JumpFloodField.js";

function bandFromGlow(glow) {
  return Math.trunc(glow * 3.999) & 3;
}

function hashToUnit(input) {
  let value = input >>> 0;
  value = Math.imul((value ^ (value >>> 16)) >>> 0, 0x7feb352d) >>> 0;
  value = Math.imul((value ^ (value >>> 15)) >>> 0, 0x846ca68b) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return (value & 0xffff) / 65535;
}

class SDFPatterns {
  constructor(field) {
    this.field = field;
  }

  isVoronoiEdge(x, y) {
    const field = this.field;
    const index = y * field.width + x;
    const seedX = field.nearestX[index];
    const seedY = field.nearestY[index];
    if (seedX === SIM.sentinel) return false;
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [offsetX, offsetY] of offsets) {
      const neighborX = x + offsetX;
      const neighborY = y + offsetY;
      if (
        neighborX < 0 || neighborX >= field.width ||
        neighborY < 0 || neighborY >= field.height
      ) continue;
      const neighborIndex = neighborY * field.width + neighborX;
      if (
        field.nearestX[neighborIndex] !== seedX ||
        field.nearestY[neighborIndex] !== seedY
      ) return true;
    }
    return false;
  }

  distinctNeighborCount(x, y) {
    const field = this.field;
    const owners = new Set();
    const offsets = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [offsetX, offsetY] of offsets) {
      const neighborX = x + offsetX;
      const neighborY = y + offsetY;
      if (
        neighborX < 0 || neighborX >= field.width ||
        neighborY < 0 || neighborY >= field.height
      ) continue;
      const index = neighborY * field.width + neighborX;
      const seedX = field.nearestX[index];
      if (seedX === SIM.sentinel) continue;
      owners.add(positionKey(seedX, field.nearestY[index]));
    }
    return owners.size;
  }

  isLocalMaximum(x, y) {
    const field = this.field;
    const distance = field.distances[y * field.width + x];
    if (distance < 0) return false;
    const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [offsetX, offsetY] of offsets) {
      const neighborX = x + offsetX;
      const neighborY = y + offsetY;
      if (
        neighborX < 0 || neighborX >= field.width ||
        neighborY < 0 || neighborY >= field.height
      ) continue;
      const neighborDistance = field.distances[
        neighborY * field.width + neighborX
      ];
      if (neighborDistance > distance + SIM.medialAxisTolerance) return false;
    }
    return true;
  }

  sample(pattern, x, y, time, output) {
    const field = this.field;
    const index = y * field.width + x;
    const distance = field.distances[index];
    const owner = field.ownerIds[index];
    const seedX = field.nearestX[index];
    const seedY = field.nearestY[index];
    const key = positionKey(seedX, seedY);
    const bandSpacing = SIM.bandSpacing;
    let glow = 0;
    let band = 0;

    if (distance < 0 || owner < 0) {
      output.glow = 0;
      output.band = 0;
      return output;
    }

    switch (pattern) {
      case 0:
        glow = clamp(distance / SIM.typicalDistance, 0, 1);
        band = bandFromGlow(glow);
        break;
      case 1:
        glow = 1 - clamp(distance / SIM.typicalDistance, 0, 1);
        band = bandFromGlow(glow);
        break;
      case 2:
        glow = Math.sqrt(clamp(distance / SIM.typicalDistance, 0, 1));
        band = bandFromGlow(glow);
        break;
      case 3: {
        const linear = clamp(distance / SIM.typicalDistance, 0, 1);
        glow = linear * linear;
        band = bandFromGlow(glow);
        break;
      }
      case 4:
        glow = clamp(distance / (SIM.typicalDistance * 0.5), 0, 1);
        band = bandFromGlow(glow);
        break;
      case 5: {
        const unit = (distance % bandSpacing) / bandSpacing;
        glow = unit < 0.5 ? unit * 2 : 2 - unit * 2;
        band = Math.trunc(distance / bandSpacing) & 3;
        break;
      }
      case 6:
        glow = (distance % bandSpacing) / bandSpacing;
        band = Math.trunc(distance / bandSpacing) & 3;
        break;
      case 7: {
        const ring = Math.trunc(distance / bandSpacing);
        glow = ring & 1 ? 0.85 : 0.15;
        band = ring & 3;
        break;
      }
      case 8:
        glow = Math.sin(distance * (Math.PI * 2 / bandSpacing)) * 0.5 + 0.5;
        band = Math.trunc(distance / bandSpacing) & 3;
        break;
      case 9:
        glow = Math.exp(-(distance % bandSpacing) * 1.5);
        band = Math.trunc(distance / bandSpacing) & 3;
        break;
      case 10:
        glow = 1 - clamp(distance * 0.06, 0, 0.4);
        band = owner & 3;
        break;
      case 11:
        glow = clamp(1 - distance * 0.1, 0, 1);
        band = owner & 3;
        break;
      case 12: {
        const random = hashToUnit(key);
        glow = 0.3 + random * 0.7;
        band = Math.trunc(random * 3.999) & 3;
        break;
      }
      case 13: {
        const random = hashToUnit(key);
        glow = clamp((1 - distance * 0.04) * (0.3 + random * 0.7), 0, 1);
        band = Math.trunc(hashToUnit((key ^ 0xdeadbeef) >>> 0) * 3.999) & 3;
        break;
      }
      case 14: {
        const rate = 0.5 + hashToUnit(key) * 2.5;
        const pulse = 0.5 + 0.5 * Math.sin(time * rate);
        glow = clamp((1 - distance * 0.06) * pulse, 0, 1);
        band = key & 3;
        break;
      }
      case 15: {
        const difference = Math.abs(distance - SIM.outlineDistance);
        glow = difference > SIM.outlineThickness
          ? 0
          : 1 - difference / SIM.outlineThickness;
        band = difference > SIM.outlineThickness ? 0 : owner & 3;
        break;
      }
      case 16: {
        const innerDifference = Math.abs(distance - 4);
        const outerDifference = Math.abs(distance - 10);
        if (innerDifference < SIM.outlineThickness) {
          glow = 1 - innerDifference / SIM.outlineThickness;
          band = 1;
        } else if (outerDifference < SIM.outlineThickness) {
          glow = 1 - outerDifference / SIM.outlineThickness;
          band = 3;
        }
        break;
      }
      case 17:
        if (distance >= 2 && distance <= 7) {
          {
            const unit = (distance - 2) / 5;
            glow = Math.min(
              unit * unit * (3 - 2 * unit) * (1 - unit) * 4,
              1,
            );
            band = owner & 3;
          }
        }
        break;
      case 18:
        glow = Math.exp(-(distance * distance) / (SIM.haloSigma ** 2));
        band = owner & 3;
        break;
      case 19: {
        const sigma1 = SIM.haloSigma * 0.5;
        const sigma2 = SIM.haloSigma;
        const sigma3 = SIM.haloSigma * 2;
        glow = clamp(
          Math.exp(-(distance * distance) / (sigma1 * sigma1)) * 0.6 +
          Math.exp(-(distance * distance) / (sigma2 * sigma2)) * 0.3 +
          Math.exp(-(distance * distance) / (sigma3 * sigma3)) * 0.15,
          0,
          1,
        );
        band = owner & 3;
        break;
      }
      case 20:
        if (this.isVoronoiEdge(x, y)) {
          glow = 1;
          band = owner & 3;
        }
        break;
      case 21:
        if (this.distinctNeighborCount(x, y) >= 3) {
          glow = 1;
          band = 3;
        }
        break;
      case 22:
        if (!this.isVoronoiEdge(x, y)) {
          glow = clamp(1 - distance * 0.05, 0, 1);
          band = owner & 3;
        }
        break;
      case 23:
        if (!this.isVoronoiEdge(x, y)) {
          const unit = (distance % bandSpacing) / bandSpacing;
          glow = unit < 0.5 ? unit * 2 : 2 - unit * 2;
          band = owner & 3;
        }
        break;
      case 24:
        if (this.isLocalMaximum(x, y)) {
          glow = 1;
          band = owner & 3;
        }
        break;
      case 25: {
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.5);
        const baseGlow = clamp(distance / SIM.typicalDistance, 0, 1);
        glow = baseGlow * pulse;
        band = bandFromGlow(baseGlow);
        break;
      }
      case 26: {
        const threshold = (time * 4) % SIM.typicalDistance;
        const difference = Math.abs(distance - threshold);
        const thickness = SIM.outlineThickness * 1.5;
        if (difference <= thickness) {
          glow = 1 - difference / thickness;
          band = owner & 3;
        }
        break;
      }
      case 27: {
        let unit = (distance - time * 3) % bandSpacing;
        if (unit < 0) unit += bandSpacing;
        unit /= bandSpacing;
        glow = Math.sin(unit * Math.PI * 2) * 0.5 + 0.5;
        band = Math.trunc(distance / bandSpacing) & 3;
        break;
      }
      case 28: {
        const value =
          Math.sin(distance * 0.4 + time) +
          Math.cos(x * 0.15 + time * 0.7) +
          Math.sin(y * 0.12 + time * 0.5);
        glow = (value + 3) / 6;
        band = bandFromGlow(glow);
        break;
      }
      case 29: {
        const phase = hashToUnit(key) * Math.PI * 2;
        const pulse = 0.5 + 0.5 * Math.sin(time * 2 + phase);
        const fade = clamp(1 - distance * 0.05, 0, 1);
        glow = pulse * fade;
        band = key & 3;
        break;
      }
      default:
        break;
    }

    output.glow = clamp(glow, 0, 1);
    output.band = band & 3;
    return output;
  }
}

export { bandFromGlow, hashToUnit, SDFPatterns };
