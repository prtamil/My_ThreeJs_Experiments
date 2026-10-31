function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(Math.max(value, minimum), maximum);
}

class ValuePatterns {
  constructor(noise) {
    this.noise = noise;
  }

  sample(pattern, x, y, time) {
    const noise = this.noise;
    let glow = 0;

    switch (pattern) {
      case 0:
        glow = noise.sample(x, y + time, 2);
        break;
      case 1:
        glow = noise.sample(x, y + time, 1);
        break;
      case 2:
        glow = noise.sample(x, y + time, 0);
        break;
      case 3:
        glow = noise.sample(x, y + time, 3);
        break;
      case 4:
        glow = noise.sample(x, y + time, 4);
        break;
      case 5:
        glow = noise.fbmN(x, y + time, 2);
        break;
      case 6:
        glow = noise.fbm(x, y + time);
        break;
      case 7:
        glow = noise.fbmN(x, y + time, 6);
        break;
      case 8:
        glow = noise.fbmAbsolute(x, y + time);
        break;
      case 9: {
        const value = (noise.fbm(x, y + time) - 0.5) * 2;
        glow = 1 - Math.abs(value);
        break;
      }
      case 10: {
        const value = noise.fbm(x, y + time) * 8;
        glow = value - Math.floor(value);
        break;
      }
      case 11: {
        const value = noise.fbm(x, y + time);
        if (value < 0.45) glow = 0;
        else if (value > 0.55) glow = 1;
        else {
          const amount = (value - 0.45) * 10;
          glow = amount * amount * (3 - 2 * amount);
        }
        break;
      }
      case 12:
        glow = Math.sin(noise.fbm(x, y + time) * 12) * 0.5 + 0.5;
        break;
      case 13: {
        const value = noise.fbm(x, y + time);
        glow = value * value;
        break;
      }
      case 14:
        glow = Math.sqrt(clamp(noise.fbm(x, y + time)));
        break;
      case 15: {
        const warpX = (noise.fbm(x, y + time) - 0.5) * 2;
        const warpY = (noise.fbm(x + 5.2, y + 1.3 + time) - 0.5) * 2;
        glow = noise.fbm(x + warpX, y + warpY + time);
        break;
      }
      case 16:
        glow = noise.fbm(x * 0.4, y + time * 1.5);
        break;
      case 17: {
        const cosine = 0.7071068;
        const sine = 0.7071068;
        const rotatedX = x * cosine - y * sine;
        const rotatedY = x * sine + y * cosine;
        glow = noise.fbm(rotatedX, rotatedY + time);
        break;
      }
      case 18: {
        const first = noise.fbm(x, y + time);
        const second = noise.fbm(x + 0.5, y + time);
        const third = noise.fbm(x, y + 0.5 + time);
        const fourth = noise.fbm(x + 0.5, y + 0.5 + time);
        glow = 0.25 * (first + second + third + fourth);
        break;
      }
      case 19: {
        const low = noise.fbm(x, y + time);
        const high = noise.fbm(x * 3, y * 3 + time);
        glow = 0.6 * low + 0.4 * high;
        break;
      }
      case 20: {
        const first = noise.fbm(x, y + time);
        const second = noise.fbm(x * 2 + 5, y * 2 + 3 + time);
        glow = first * second * 2;
        break;
      }
      case 21: {
        const first = noise.fbm(x, y + time);
        const second = noise.fbm(x * 3, y * 3 + time);
        glow = (first + second) * 0.5;
        break;
      }
      case 22: {
        const first = noise.fbm(x, y + time);
        const second = noise.fbm(x + 0.5, y + 0.5 + time);
        glow = Math.abs(first - second) * 4;
        break;
      }
      case 23: {
        const value = noise.fbm(x, y + time);
        glow = Math.sin(x * 3 + value * 6) * 0.5 + 0.5;
        break;
      }
      case 24: {
        const first = noise.fbm(x, y + time);
        const second = noise.fbmAbsolute(x * 1.5 + 7, y * 1.5 + 3 + time);
        glow = first * second * 1.8;
        break;
      }
      case 25: {
        const value = noise.fbm(x, y + time);
        const waves =
          Math.sin(x * 2 + value * 3) +
          Math.cos(y * 2.5 + value * 3) +
          Math.sin((x + y) * 1.5 + value * 2);
        glow = (waves + 3) / 6;
        break;
      }
      case 26: {
        const value = noise.fbmAbsolute(x, y + time);
        glow = value * value * 1.5;
        break;
      }
      case 27: {
        const value = (noise.fbm(x, y + time) - 0.5) * 2;
        const ridge = 1 - Math.abs(value);
        let power = ridge * ridge;
        power *= power;
        power *= power;
        power *= ridge * ridge * ridge * ridge;
        glow = power * 1.8;
        break;
      }
      case 28: {
        let background = noise.sample(x, y + time * 0.3, 2) * 0.3;
        const stars = noise.sample(
          x * 6 + 13,
          y * 6 + 7 + time * 0.5,
          2,
        );
        if (stars > 0.7) background += (stars - 0.7) * 3;
        glow = background;
        break;
      }
      case 29: {
        const band = Math.sin(
          x * 1.5 + noise.fbm(x, y + time) * 4,
        ) * 0.5 + 0.5;
        const vertical = Math.max(Math.sin(y * 0.4 + 1), 0);
        glow = band * vertical * 1.2;
        break;
      }
      default:
        break;
    }

    return clamp(glow);
  }
}

export { clamp, ValuePatterns };
