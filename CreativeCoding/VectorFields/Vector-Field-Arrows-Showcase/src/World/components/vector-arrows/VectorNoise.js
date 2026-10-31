class VectorNoise {
  constructor(seed) { this.reseed(seed); }
  reseed(seed) {
    this.seed = seed === undefined
      ? Math.floor(Math.random() * 0x100000000) >>> 0
      : Number(seed) >>> 0;
  }
  hash32(input) {
    let value = Number(input) >>> 0;
    value = Math.imul(value ^ (value >>> 16), 0x7feb352d) >>> 0;
    value = Math.imul(value ^ (value >>> 15), 0x846ca68b) >>> 0;
    return (value ^ (value >>> 16)) >>> 0;
  }
  latticeScalar(x, y) {
    const hash = (
      Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + this.seed
    ) >>> 0;
    return (this.hash32(hash) >>> 8) / 16777215;
  }
  sample(x, y) {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const fractionX = x - cellX;
    const fractionY = y - cellY;
    const blendX = fractionX * fractionX * (3 - 2 * fractionX);
    const blendY = fractionY * fractionY * (3 - 2 * fractionY);
    const c00 = this.latticeScalar(cellX, cellY);
    const c10 = this.latticeScalar(cellX + 1, cellY);
    const c01 = this.latticeScalar(cellX, cellY + 1);
    const c11 = this.latticeScalar(cellX + 1, cellY + 1);
    const bottom = c00 + (c10 - c00) * blendX;
    const top = c01 + (c11 - c01) * blendX;
    return bottom + (top - bottom) * blendY;
  }
}

export { VectorNoise };
