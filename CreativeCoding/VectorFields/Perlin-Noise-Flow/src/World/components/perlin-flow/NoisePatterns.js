import { SIM } from "./config.js";

const TWO_PI = Math.PI * 2;
const WARP_AMOUNT = 5;
const DEEP_WARP_AMOUNT = 8;
const LACUNARITY = 2;
const GAIN = 0.5;
const CONTOUR_LEVELS = [0.2, 0.4, 0.6, 0.8];

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function fract(value) {
  return value - Math.floor(value);
}

function smoothstep(minimum, maximum, value) {
  const amount = clamp((value - minimum) / (maximum - minimum));
  return amount * amount * (3 - 2 * amount);
}

class NoisePatterns {
  constructor(noise) {
    this.noise = noise;
    this.scale = SIM.noiseScale;
  }

  raw(x, y, time) {
    return this.noise.sample(x * this.scale, y * this.scale + time);
  }

  height(x, y, time) {
    return this.raw(x, y, time) * 0.5 + 0.5;
  }

  warp(x, y, time) {
    const qx = this.noise.sample(x * this.scale, y * this.scale + time);
    const qy = this.noise.sample(
      (x + 5.2) * this.scale,
      (y + 1.3) * this.scale + time,
    );
    const value = this.noise.sample(
      (x + qx * WARP_AMOUNT) * this.scale,
      (y + qy * WARP_AMOUNT) * this.scale + time,
    );
    return value * 0.5 + 0.5;
  }

  fbm(x, y, time, octaves = 4, lacunarity = 2, gain = 0.5) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;
    for (let octave = 0; octave < octaves; octave += 1) {
      total += amplitude * this.noise.sample(
        x * this.scale * frequency,
        y * this.scale * frequency + time * frequency,
      );
      maxAmplitude += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }
    return total / maxAmplitude * 0.5 + 0.5;
  }

  turbulence(x, y, time, octaves = 4) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;
    for (let octave = 0; octave < octaves; octave += 1) {
      total += amplitude * Math.abs(this.noise.sample(
        x * this.scale * frequency,
        y * this.scale * frequency + time * frequency,
      ));
      maxAmplitude += amplitude;
      amplitude *= GAIN;
      frequency *= LACUNARITY;
    }
    return total / maxAmplitude;
  }

  ridged(x, y, time, octaves = 4) {
    let total = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;
    for (let octave = 0; octave < octaves; octave += 1) {
      const noise = this.noise.sample(
        x * this.scale * frequency,
        y * this.scale * frequency + time * frequency,
      );
      const ridge = 1 - Math.abs(noise);
      total += amplitude * ridge * ridge;
      maxAmplitude += amplitude;
      amplitude *= GAIN;
      frequency *= LACUNARITY;
    }
    return total / maxAmplitude;
  }

  curl(x, y, time, output = { x: 0, y: 0 }) {
    const epsilon = 1;
    const derivativeY = (
      this.raw(x, y + epsilon, time) -
      this.raw(x, y - epsilon, time)
    ) * 0.5;
    const derivativeX = (
      this.raw(x + epsilon, y, time) -
      this.raw(x - epsilon, y, time)
    ) * 0.5;
    output.x = derivativeY;
    output.y = -derivativeX;
    return output;
  }

  contour(x, y, time, output) {
    const height = this.height(x, y, time);
    let minimumDistance = 1;
    let closest = 0;
    for (let index = 0; index < CONTOUR_LEVELS.length; index += 1) {
      const distance = Math.abs(height - CONTOUR_LEVELS[index]);
      if (distance < minimumDistance) {
        minimumDistance = distance;
        closest = index;
      }
    }
    output.band = closest;
    return minimumDistance < 0.04 ? 1 - minimumDistance / 0.04 : 0;
  }

  deepWarp(x, y, time) {
    const qx = this.raw(x, y, time);
    const qy = this.noise.sample(
      (x + 5.2) * this.scale,
      (y + 1.3) * this.scale + time,
    );
    const rx = this.noise.sample(
      (x + qx * WARP_AMOUNT) * this.scale,
      (y + qy * WARP_AMOUNT) * this.scale + time,
    );
    const ry = this.noise.sample(
      (x + qx * WARP_AMOUNT + 5.2) * this.scale,
      (y + qy * WARP_AMOUNT + 1.3) * this.scale + time,
    );
    const value = this.noise.sample(
      (x + rx * DEEP_WARP_AMOUNT) * this.scale,
      (y + ry * DEEP_WARP_AMOUNT) * this.scale + time,
    );
    return value * 0.5 + 0.5;
  }

  warpRidge(x, y, time) {
    return 1 - Math.abs(this.warp(x, y, time) * 2 - 1);
  }

  slope(x, y, time) {
    const derivativeX = (this.raw(x + 1, y, time) - this.raw(x - 1, y, time)) * 0.5;
    const derivativeY = (this.raw(x, y + 1, time) - this.raw(x, y - 1, time)) * 0.5;
    return clamp(Math.hypot(derivativeX, derivativeY) * 4);
  }

  sample(pattern, x, y, time, centerX, centerY, height, output) {
    output.band = -1;
    let glow = 0;

    switch (pattern) {
      case 1:
        glow = this.height(x, y, time);
        break;
      case 2:
        glow = 1 - this.height(x, y, time);
        break;
      case 3:
        glow = Math.floor(this.height(x, y, time) * 6) / 6;
        break;
      case 4:
        glow = this.height(x, y, time) > 0.5 ? 1 : 0;
        output.band = glow > 0.5 ? 3 : 0;
        break;
      case 5:
        glow = 1 - Math.abs(this.raw(x, y, time));
        break;
      case 6:
        glow = Math.abs(this.raw(x, y, time));
        break;
      case 7:
        glow = 0.5 + 0.5 * Math.sin(this.raw(x, y, time) * Math.PI * 3);
        break;
      case 8: {
        const radius = Math.hypot(x - centerX, y - centerY);
        glow = 0.5 + 0.5 * Math.sin(radius * 0.3 + this.raw(x, y, time));
        break;
      }
      case 9:
        glow = 0.5 + 0.5 * Math.sin(
          this.raw(x, y, time) * Math.PI + Math.sin((x + y) * 0.05),
        );
        break;
      case 10:
        glow = this.contour(x, y, time, output);
        break;
      case 11:
        glow = this.warp(x, y, time);
        break;
      case 12:
        glow = this.deepWarp(x, y, time);
        break;
      case 13:
        glow = this.warpRidge(x, y, time);
        break;
      case 14:
        glow = this.slope(x, y, time);
        break;
      case 15:
        glow = this.fbm(x, y, time, 4);
        break;
      case 16:
        glow = this.fbm(x, y, time, 8);
        break;
      case 17:
        glow = this.ridged(x, y, time, 4);
        break;
      case 18:
        glow = this.turbulence(x, y, time, 4);
        break;
      case 19:
        glow = 1 - this.fbm(x, y, time, 4);
        break;
      case 20:
        glow = 0.5 + 0.5 * Math.sin(
          x * 0.06 + this.turbulence(x, y, time, 4) * 5,
        );
        break;
      case 21: {
        const radius = Math.hypot(x - centerX, y - centerY);
        glow = fract(radius * 0.08 + this.turbulence(x, y, time, 4) * 3);
        break;
      }
      case 22: {
        const turbulence = this.turbulence(x, y, time * 4, 4);
        const mask = 1 - y / height;
        glow = clamp(turbulence * 2 * mask);
        break;
      }
      case 23:
        glow = smoothstep(0.45, 0.65, this.fbm(x, y, time, 4));
        break;
      case 24:
        glow = 1 - smoothstep(0.4, 0.6, this.fbm(x, y, time, 4));
        break;
      case 25: {
        const ridge = 1 - Math.abs(this.noise.sample(
          x * this.scale * 4,
          y * this.scale * 4 + time,
        ));
        glow = ridge > 0.85 ? ridge : 0;
        output.band = 3;
        break;
      }
      case 29: {
        const n1 = this.raw(x, y, time);
        const n2 = this.noise.sample(
          x * this.scale * 2,
          y * this.scale * 2 - time,
        );
        const n3 = this.noise.sample(
          (x + n1 * 10) * this.scale,
          (y + n2 * 10) * this.scale + time * 1.5,
        );
        glow = clamp((Math.sin(n1 * 4) * Math.cos(n2 * 4) + n3) * 0.4 + 0.5);
        break;
      }
      default:
        glow = 0;
    }

    if (output.band < 0) output.band = Math.trunc(glow * 3.99) & 3;
    output.glow = glow;
    return output;
  }
}

export { clamp, fract, NoisePatterns, smoothstep, TWO_PI };
