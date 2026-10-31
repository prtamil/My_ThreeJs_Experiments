import { MAP, SIM } from "./config.js";

const HALF_DIAGONAL = Math.hypot(MAP.width * 0.5, MAP.height * 0.5);
const SOFT_EPSILON = 1.5;
const SOFT_EPSILON_SQUARED = SOFT_EPSILON * SOFT_EPSILON;

function magnitudeSaturate(magnitude, scale) {
  return magnitude / (magnitude + scale);
}

function gradient(scalar, x, y) {
  return {
    x: 0.5 * (scalar(x + 1, y) - scalar(x - 1, y)),
    y: 0.5 * (scalar(x, y + 1) - scalar(x, y - 1)),
  };
}

function curl(scalar, x, y) {
  return {
    x: 0.5 * (scalar(x, y + 1) - scalar(x, y - 1)),
    y: -0.5 * (scalar(x + 1, y) - scalar(x - 1, y)),
  };
}

class VectorPatterns {
  constructor(noise) {
    this.noise = noise;
    this.paraboloid = (x, y) => x * x + y * y;
    this.saddle = (x, y) => x * x - y * y;
    this.periodic = (x, y) => Math.sin(x * 0.25) * Math.cos(y * 0.25);
    this.ripple = (x, y) => Math.cos(0.30 * Math.hypot(x, y));
    this.noiseScalar = (x, y) => this.noise.sample(
      x * SIM.noiseFrequency,
      y * SIM.noiseFrequency,
    );
    this.streamGrid = (x, y) => Math.sin(x * 0.10) * Math.sin(y * 0.20);
  }

  direct(vectorX, vectorY, normalizedMagnitude) {
    if (normalizedMagnitude < SIM.arrowDeadZone) {
      return { glow: 1, band: 0, direction: 8 };
    }
    const angle = Math.atan2(vectorY, vectorX);
    const direction = (Math.floor(angle / (Math.PI / 4) + 0.5) + 8) & 7;
    const band = Math.min(Math.max(Math.trunc(normalizedMagnitude * 3.999), 0), 3);
    return { glow: 1, band, direction };
  }

  motionProbe(time) {
    const noiseX = this.noise.sample(time * 0.12, 0);
    const noiseY = this.noise.sample(0, time * 0.12 + 13.7);
    return {
      x: MAP.width * 0.5 + 0.40 * MAP.width * (2 * noiseX - 1),
      y: MAP.height * 0.5 + 0.40 * MAP.height * (2 * noiseY - 1),
    };
  }

  emit(x, y, time, vectorX, vectorY, normalizedMagnitude) {
    let vx = vectorX;
    let vy = vectorY;
    if (time > 0) {
      const probe = this.motionProbe(time);
      const deltaX = x - probe.x;
      const deltaY = y - probe.y;
      let spiralX = deltaY - deltaX;
      let spiralY = -deltaX - deltaY;
      const spiralMagnitude = Math.hypot(spiralX, spiralY);
      if (spiralMagnitude > 1e-6) {
        spiralX /= spiralMagnitude;
        spiralY /= spiralMagnitude;
      }
      const fieldMagnitude = Math.hypot(vx, vy);
      if (fieldMagnitude > 1e-6) {
        vx /= fieldMagnitude;
        vy /= fieldMagnitude;
      }
      vx += spiralX;
      vy += spiralY;
    }
    return this.direct(vx, vy, normalizedMagnitude);
  }

  sample(pattern, x, y, time) {
    const centreX = MAP.width * 0.5;
    const centreY = MAP.height * 0.5;
    const deltaX = x - centreX;
    const deltaY = y - centreY;
    let vector;
    let vx;
    let vy;
    let magnitude;

    switch (pattern) {
      case 0:
        vector = gradient(this.paraboloid, deltaX, deltaY);
        magnitude = Math.hypot(vector.x, vector.y);
        return this.emit(x, y, time, vector.x, vector.y, magnitudeSaturate(magnitude, HALF_DIAGONAL * 0.5));
      case 1:
        vector = gradient(this.saddle, deltaX, deltaY);
        magnitude = Math.hypot(vector.x, vector.y);
        return this.emit(x, y, time, vector.x, vector.y, magnitudeSaturate(magnitude, HALF_DIAGONAL * 0.5));
      case 2:
        vector = gradient(this.periodic, x, y);
        magnitude = Math.hypot(vector.x, vector.y);
        return this.emit(x, y, time, vector.x, vector.y, magnitudeSaturate(magnitude, 0.8));
      case 3:
        vector = gradient(this.ripple, deltaX, deltaY);
        magnitude = Math.hypot(vector.x, vector.y);
        return this.emit(x, y, time, vector.x, vector.y, magnitudeSaturate(magnitude, 0.8));
      case 4:
        vector = gradient(this.noiseScalar, x, y);
        magnitude = Math.hypot(vector.x, vector.y);
        return this.emit(x, y, time, vector.x, vector.y, magnitudeSaturate(magnitude, 2 * SIM.noiseFrequency));
      case 5:
        magnitude = Math.hypot(deltaX, deltaY);
        return this.emit(x, y, time, deltaX, deltaY, magnitudeSaturate(magnitude, HALF_DIAGONAL));
      case 6:
        magnitude = Math.hypot(deltaX, deltaY);
        return this.emit(x, y, time, -deltaX, -deltaY, magnitudeSaturate(magnitude, HALF_DIAGONAL));
      case 7:
        magnitude = Math.hypot(deltaX, deltaY);
        return this.emit(x, y, time, -deltaY, deltaX, magnitudeSaturate(magnitude, HALF_DIAGONAL));
      case 8:
        vx = deltaY;
        return this.emit(x, y, time, vx, 0, magnitudeSaturate(Math.abs(vx), MAP.height * 0.5));
      case 9:
        return this.emit(x, y, time, Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), 0.7);
      case 10: {
        const radiusSquared = deltaX * deltaX + deltaY * deltaY + SOFT_EPSILON_SQUARED;
        vx = deltaX / radiusSquared;
        vy = deltaY / radiusSquared;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 0.4));
      }
      case 11: {
        const leftX = x - (centreX - 8);
        const leftY = y - centreY;
        const leftR2 = leftX * leftX + leftY * leftY + SOFT_EPSILON_SQUARED;
        const rightX = x - (centreX + 8);
        const rightY = y - centreY;
        const rightR2 = rightX * rightX + rightY * rightY + SOFT_EPSILON_SQUARED;
        vx = leftX / leftR2 - rightX / rightR2;
        vy = leftY / leftR2 - rightY / rightR2;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 0.4));
      }
      case 12: {
        const radiusSquared = deltaX * deltaX + deltaY * deltaY + SOFT_EPSILON_SQUARED;
        vx = -deltaY / radiusSquared;
        vy = deltaX / radiusSquared;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 1.5));
      }
      case 13: {
        const radiusSquared = deltaX * deltaX + deltaY * deltaY + SOFT_EPSILON_SQUARED;
        const radius = Math.sqrt(radiusSquared);
        vx = -deltaX / (radiusSquared * radius);
        vy = -deltaY / (radiusSquared * radius);
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(1 / radiusSquared, 0.4));
      }
      case 14: {
        vx = 0;
        vy = 0;
        const offsets = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
        for (const [offsetX, offsetY, sign] of offsets) {
          const pointX = x - (centreX + 6 * offsetX);
          const pointY = y - (centreY + 6 * offsetY);
          const radiusSquared = pointX * pointX + pointY * pointY + SOFT_EPSILON_SQUARED;
          vx += sign * pointX / radiusSquared;
          vy += sign * pointY / radiusSquared;
        }
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 0.4));
      }
      case 15:
        vector = curl(this.noiseScalar, x, y);
        magnitude = Math.hypot(vector.x, vector.y);
        return this.emit(x, y, time, vector.x, vector.y, magnitudeSaturate(magnitude, 2 * SIM.noiseFrequency));
      case 16:
        vector = curl(this.streamGrid, x, y);
        magnitude = Math.hypot(vector.x, vector.y);
        return this.emit(x, y, time, vector.x, vector.y, magnitudeSaturate(magnitude, 0.8 * 0.3));
      case 17: {
        const leftX = x - (centreX - 8);
        const leftY = y - centreY;
        const leftR2 = leftX * leftX + leftY * leftY + SOFT_EPSILON_SQUARED;
        const rightX = x - (centreX + 8);
        const rightY = y - centreY;
        const rightR2 = rightX * rightX + rightY * rightY + SOFT_EPSILON_SQUARED;
        vx = -leftY / leftR2 + rightY / rightR2;
        vy = leftX / leftR2 - rightX / rightR2;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 1.5));
      }
      case 18: {
        const normalizedY = 2 * y / (MAP.height - 1) - 1;
        vx = 1 - normalizedY * normalizedY;
        return this.emit(x, y, time, vx, 0, vx * 0.9);
      }
      case 19:
        vector = gradient(this.noiseScalar, x, y);
        vx = 1 + vector.x * 4;
        vy = vector.y * 4;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 1.5));
      case 20: {
        const phaseX = deltaX * (3 / centreX);
        const phaseY = deltaY * (3 / centreY);
        vx = -phaseX;
        vy = -phaseY;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 2));
      }
      case 21: {
        const phaseX = deltaX * (3 / centreX);
        const phaseY = deltaY * (3 / centreY);
        vx = -phaseX - phaseY;
        vy = phaseX - phaseY;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 2));
      }
      case 22: {
        const phaseX = deltaX * (3 / centreX);
        const phaseY = deltaY * (3 / centreY);
        const radiusSquared = phaseX * phaseX + phaseY * phaseY;
        const factor = 1 - radiusSquared;
        vx = factor * phaseX - phaseY;
        vy = phaseX + factor * phaseY;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 2));
      }
      case 23: {
        const phaseX = deltaX * (3 / centreX);
        const phaseY = deltaY * (3 / centreY);
        vx = phaseY;
        vy = (1 - phaseX * phaseX) * phaseY - phaseX;
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 4));
      }
      case 24: {
        const phaseX = deltaX * (3.14159 / centreX);
        const phaseY = deltaY * (3 / centreY);
        vx = phaseY;
        vy = -Math.sin(phaseX);
        return this.emit(x, y, time, vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 2));
      }
      case 25: {
        const angle = 2 * Math.PI / 6 * time;
        const poleX = 8 * Math.cos(angle);
        const poleY = 8 * Math.sin(angle);
        const firstX = x - (centreX + poleX);
        const firstY = y - (centreY + poleY);
        const firstR2 = firstX * firstX + firstY * firstY + SOFT_EPSILON_SQUARED;
        const secondX = x - (centreX - poleX);
        const secondY = y - (centreY - poleY);
        const secondR2 = secondX * secondX + secondY * secondY + SOFT_EPSILON_SQUARED;
        vx = firstX / firstR2 - secondX / secondR2;
        vy = firstY / firstR2 - secondY / secondR2;
        return this.direct(vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 0.4));
      }
      case 26:
        vx = Math.sin(0.25 * x - (2 * Math.PI / 4) * time);
        return this.direct(vx, 0, Math.abs(vx) * 0.95);
      case 27: {
        const pulse = Math.sin((2 * Math.PI / 4) * time);
        vx = deltaX * pulse;
        vy = deltaY * pulse;
        return this.direct(vx, vy, magnitudeSaturate(Math.hypot(vx, vy), HALF_DIAGONAL));
      }
      case 28: {
        const angle = (2 * Math.PI / 8) * time;
        const orbitRadius = HALF_DIAGONAL * 0.30;
        const vortexX = centreX + orbitRadius * Math.cos(angle);
        const vortexY = centreY + orbitRadius * Math.sin(angle);
        const pointX = x - vortexX;
        const pointY = y - vortexY;
        const radiusSquared = pointX * pointX + pointY * pointY + SOFT_EPSILON_SQUARED;
        vx = -pointY / radiusSquared;
        vy = pointX / radiusSquared;
        return this.direct(vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 1.5));
      }
      case 29: {
        const drift = time * 0.7;
        const up = this.noise.sample(x * SIM.noiseFrequency, (y + 1 + drift) * SIM.noiseFrequency);
        const down = this.noise.sample(x * SIM.noiseFrequency, (y - 1 + drift) * SIM.noiseFrequency);
        const right = this.noise.sample((x + 1) * SIM.noiseFrequency, (y + drift) * SIM.noiseFrequency);
        const left = this.noise.sample((x - 1) * SIM.noiseFrequency, (y + drift) * SIM.noiseFrequency);
        vx = 0.5 * (up - down);
        vy = -0.5 * (right - left);
        return this.direct(vx, vy, magnitudeSaturate(Math.hypot(vx, vy), 2 * SIM.noiseFrequency));
      }
      default:
        return { glow: 0, band: 0, direction: 8 };
    }
  }
}

export { magnitudeSaturate, VectorPatterns };
