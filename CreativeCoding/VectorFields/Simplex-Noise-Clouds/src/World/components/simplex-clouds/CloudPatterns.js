import { SIM } from "./config.js";

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

function smoothstep(minimum, maximum, value) {
  const amount = clamp((value - minimum) / (maximum - minimum));
  return amount * amount * (3 - 2 * amount);
}

class CloudPatterns {
  constructor(noise) {
    this.noise = noise;
  }

  sample(pattern, x, y, time, normalizedX, normalizedY) {
    const noise = this.noise;
    let glow = 0;

    switch (pattern) {
      case 0:
        glow = noise.fbm(x, y + time) * 0.5 + 0.5;
        break;
      case 1:
        glow = clamp(Math.abs(noise.fbm(x, y + time)));
        break;
      case 2:
        glow = clamp(1 - Math.abs(noise.fbm(x, y + time)));
        break;
      case 3:
        glow = noise.fbm(x * SIM.wispsXScale, y + time * 1.5) * 0.5 + 0.5;
        break;
      case 4: {
        let ridge = 1 - Math.abs(noise.fbm(x, y + time));
        ridge *= ridge;
        ridge *= ridge;
        glow = clamp(ridge);
        break;
      }
      case 5: {
        const value = noise.fbm(x, y + time) * 8;
        glow = value - Math.floor(value);
        break;
      }
      case 6: {
        const value = noise.fbm(x, y + time);
        glow = Math.sin(x * 3 + value * 6) * 0.5 + 0.5;
        break;
      }
      case 7:
        glow = Math.sin(noise.fbm(x, y + time) * 12) > 0 ? 0.9 : 0.1;
        break;
      case 8:
        glow = Math.sin(noise.fbm(x, y + time) * 16) * 0.5 + 0.5;
        break;
      case 9:
        glow = smoothstep(0.45, 0.55, noise.fbm(x, y + time) * 0.5 + 0.5);
        break;
      case 10:
        glow = clamp(noise.fbmAbsolute(x, y + time));
        break;
      case 11: {
        const value = noise.fbmAbsolute(x, y + time);
        glow = clamp(value * value * 1.5);
        break;
      }
      case 12: {
        const turbulence = noise.fbmAbsolute(x, y + time * 2);
        const rise = (1 - normalizedY) * 0.5 + 0.25;
        glow = clamp(turbulence * rise * 1.3);
        break;
      }
      case 13: {
        const value = noise.fbmAbsolute(x, y + time);
        glow = clamp(1 - Math.sqrt(value + 0.05));
        break;
      }
      case 14: {
        const value = noise.fbmAbsolute(x, y + time * 1.5);
        glow = value > 0.55
          ? clamp((value - 0.55) * 3 + 0.5)
          : value * 0.4;
        break;
      }
      case 15: {
        const warpX = noise.sample(x, y + time);
        const warpY = noise.sample(x + 5.2, y + 1.3 + time);
        glow = noise.fbm(x + warpX, y + warpY) * 0.5 + 0.5;
        break;
      }
      case 16: {
        const angle = noise.sample(x * 0.5, y * 0.5 + time) * Math.PI * 2;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const warpedX = x * cosine - y * sine;
        const warpedY = x * sine + y * cosine;
        glow = noise.fbm(warpedX, warpedY + time) * 0.5 + 0.5;
        break;
      }
      case 17: {
        const warpX = noise.sample(x, y) * 2;
        glow = noise.fbm(x + warpX + time, y * 0.5) * 0.5 + 0.5;
        break;
      }
      case 18: {
        const warpX = noise.sample(x * 2, y * 2 + time);
        const warpY = noise.sample(x * 2 + 5, y * 2 + 5 + time);
        glow = noise.fbm(
          x + 0.4 * warpX,
          y + 0.4 * warpY + time,
        ) * 0.5 + 0.5;
        break;
      }
      case 19: {
        const warpX = noise.sample(x, y + time);
        const warpY = noise.sample(x + 5.2, y + 1.3 + time);
        const secondX = noise.sample(
          x + 2 * warpX + 1.7,
          y + 2 * warpY + 9.2 + time,
        );
        const secondY = noise.sample(
          x + 2 * warpX + 8.3,
          y + 2 * warpY + 2.8 + time,
        );
        glow = noise.fbm(
          x + 2 * secondX,
          y + 2 * secondY + time,
        ) * 0.5 + 0.5;
        break;
      }
      case 20: {
        const first = noise.fbm(x, y + time) * 0.5 + 0.5;
        const second = noise.fbm(
          x * 2 + 7,
          y * 2 + 3 + time,
        ) * 0.5 + 0.5;
        glow = clamp(first * second * 2);
        break;
      }
      case 21: {
        const band = Math.sin(
          x * 1.5 + noise.fbm(x, y + time) * 4,
        ) * 0.5 + 0.5;
        const vertical = Math.exp(-normalizedY * normalizedY * 1.5);
        glow = clamp(band * vertical * 1.2);
        break;
      }
      case 22: {
        const value = noise.fbm(x, y + time);
        const waves =
          Math.sin(x * 2 + value * 3) +
          Math.cos(y * 2.5 + value * 3) +
          Math.sin((x + y) * 1.5 + value * 2);
        glow = (waves + 3) / 6;
        break;
      }
      case 23: {
        const ridge = 1 - Math.abs(noise.fbm(x, y + time));
        let power = ridge * ridge;
        power *= power;
        power *= power;
        power *= ridge * ridge * ridge * ridge;
        glow = clamp(power * 1.8);
        break;
      }
      case 24: {
        const radius = Math.hypot(normalizedX, normalizedY);
        const angle = Math.atan2(normalizedY, normalizedX);
        const spiral = Math.sin(
          angle * 2 + radius * 6 + noise.fbm(x, y + time) * 3,
        );
        glow = clamp(
          (spiral * 0.5 + 0.5) * Math.exp(-radius * 0.5) * 1.4,
        );
        break;
      }
      case 25: {
        const radius = Math.hypot(normalizedX, normalizedY);
        const corona = noise.fbmAbsolute(x, y + time * 2);
        glow = clamp(corona * Math.exp(-radius * 1.2) * 1.8);
        break;
      }
      case 26: {
        const value = noise.fbm(x, y + time) * 0.5 + 0.5;
        glow = Math.floor(value * 6) / 5;
        break;
      }
      case 27: {
        const radiusSquared =
          normalizedX * normalizedX + normalizedY * normalizedY;
        const value = noise.fbm(x, y + time) * 0.5 + 0.5;
        const mask = clamp(1 - radiusSquared * 0.8);
        glow = value * mask;
        break;
      }
      case 28: {
        let background = noise.fbm(x, y + time * 0.3) * 0.5 + 0.5;
        const stars = noise.sample(
          x * 6 + 13,
          y * 6 + 7 + time * 0.5,
        );
        background *= 0.3;
        if (stars > 0.6) background += (stars - 0.6) * 2.5;
        glow = clamp(background);
        break;
      }
      case 29: {
        const radius = Math.hypot(normalizedX, normalizedY);
        const angle = Math.atan2(normalizedY, normalizedX);
        const rays = Math.sin(angle * 8) * 0.5 + 0.5;
        const pulse = Math.sin(time * 2) * 0.3 + 0.7;
        const value = noise.fbm(x, y + time) * 0.5 + 0.5;
        glow = clamp(
          (rays * pulse + value * 0.4) * Math.exp(-radius * 0.8) * 2,
        );
        break;
      }
      default:
        break;
    }

    return clamp(glow);
  }
}

export { clamp, CloudPatterns, smoothstep };
