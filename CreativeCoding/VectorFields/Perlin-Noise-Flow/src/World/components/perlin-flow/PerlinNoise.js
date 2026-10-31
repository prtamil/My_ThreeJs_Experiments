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

function fade(value) {
  return value * value * value * (
    value * (value * 6 - 15) + 10
  );
}

function lerp(start, end, amount) {
  return start + amount * (end - start);
}

function gradient(hash, x, y) {
  const direction = hash & 7;
  const u = direction < 4 ? x : y;
  const v = direction < 4 ? y : x;
  return (direction & 1 ? -u : u) + (direction & 2 ? -2 * v : 2 * v);
}

class PerlinNoise {
  constructor(seed) {
    this.random = new RandomSource(seed);
    this.permutation = new Uint16Array(512);
    this.shuffle();
  }

  shuffle(seed) {
    if (seed !== undefined) this.random.reseed(seed);
    const base = Uint16Array.from({ length: 256 }, (_, index) => index);
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

  sample(x, y) {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const latticeX = floorX & 255;
    const latticeY = floorY & 255;
    const localX = x - floorX;
    const localY = y - floorY;
    const blendX = fade(localX);
    const blendY = fade(localY);
    const permutation = this.permutation;
    const a = permutation[latticeX] + latticeY;
    const b = permutation[latticeX + 1] + latticeY;
    const n00 = gradient(permutation[a], localX, localY);
    const n10 = gradient(permutation[b], localX - 1, localY);
    const n01 = gradient(permutation[a + 1], localX, localY - 1);
    const n11 = gradient(permutation[b + 1], localX - 1, localY - 1);
    return lerp(
      lerp(n00, n10, blendX),
      lerp(n01, n11, blendX),
      blendY,
    );
  }
}

export { fade, gradient, PerlinNoise, RandomSource };
