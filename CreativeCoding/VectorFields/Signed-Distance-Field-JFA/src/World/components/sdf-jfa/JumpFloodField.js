import { MAP, SIM } from "./config.js";

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function positionKey(x, y) {
  return (((x & 0xffff) << 16) | (y & 0xffff)) >>> 0;
}

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

class JumpFloodField {
  constructor(seed) {
    this.width = MAP.width;
    this.height = MAP.height;
    this.cellCount = this.width * this.height;
    this.nearestX = new Int16Array(this.cellCount);
    this.nearestY = new Int16Array(this.cellCount);
    this.scratchX = new Int16Array(this.cellCount);
    this.scratchY = new Int16Array(this.cellCount);
    this.ownerIds = new Int16Array(this.cellCount);
    this.distances = new Float32Array(this.cellCount);
    this.random = new RandomSource(seed);
    this.seeds = Array.from(
      { length: SIM.seedCount },
      () => ({
        anchorX: 0,
        anchorY: 0,
        phaseX: 0,
        phaseY: 0,
        x: 0,
        y: 0,
        cellX: 0,
        cellY: 0,
      }),
    );
    this.reset(seed);
  }

  scatterSeeds() {
    for (const seed of this.seeds) {
      seed.anchorX = Math.floor(this.random.next() * this.width);
      seed.anchorY = Math.floor(this.random.next() * this.height);
      seed.phaseX = this.random.next() * Math.PI * 2;
      seed.phaseY = this.random.next() * Math.PI * 2;
    }
  }

  animateSeeds(time) {
    for (const seed of this.seeds) {
      const x = seed.anchorX + SIM.wobbleRadius * Math.sin(time + seed.phaseX);
      const y = seed.anchorY + SIM.wobbleRadius * Math.cos(time + seed.phaseY);
      seed.x = clamp(x, 0, this.width - 1);
      seed.y = clamp(y, 0, this.height - 1);
      seed.cellX = Math.trunc(seed.x + 0.5);
      seed.cellY = Math.trunc(seed.y + 0.5);
    }
  }

  initializeGrid() {
    this.nearestX.fill(SIM.sentinel);
    this.nearestY.fill(SIM.sentinel);
    for (const seed of this.seeds) {
      if (
        seed.cellX < 0 || seed.cellX >= this.width ||
        seed.cellY < 0 || seed.cellY >= this.height
      ) continue;
      const index = seed.cellY * this.width + seed.cellX;
      this.nearestX[index] = seed.cellX;
      this.nearestY[index] = seed.cellY;
    }
  }

  runPass(jump, sourceX, sourceY, destinationX, destinationY) {
    for (let cellY = 0; cellY < this.height; cellY += 1) {
      for (let cellX = 0; cellX < this.width; cellX += 1) {
        const index = cellY * this.width + cellX;
        let bestX = sourceX[index];
        let bestY = sourceY[index];
        let bestDistance = bestX === SIM.sentinel
          ? 0x7fffffff
          : (cellX - bestX) ** 2 + (cellY - bestY) ** 2;

        for (let offsetY = -jump; offsetY <= jump; offsetY += jump) {
          const neighborY = cellY + offsetY;
          if (neighborY < 0 || neighborY >= this.height) continue;
          for (let offsetX = -jump; offsetX <= jump; offsetX += jump) {
            if (offsetX === 0 && offsetY === 0) continue;
            const neighborX = cellX + offsetX;
            if (neighborX < 0 || neighborX >= this.width) continue;
            const neighborIndex = neighborY * this.width + neighborX;
            const candidateX = sourceX[neighborIndex];
            if (candidateX === SIM.sentinel) continue;
            const candidateY = sourceY[neighborIndex];
            const candidateDistance =
              (cellX - candidateX) ** 2 + (cellY - candidateY) ** 2;
            if (candidateDistance < bestDistance) {
              bestDistance = candidateDistance;
              bestX = candidateX;
              bestY = candidateY;
            }
          }
        }
        destinationX[index] = bestX;
        destinationY[index] = bestY;
      }
    }
  }

  runJumpFlood() {
    this.initializeGrid();
    let sourceX = this.nearestX;
    let sourceY = this.nearestY;
    let destinationX = this.scratchX;
    let destinationY = this.scratchY;

    for (
      let jump = Math.floor(Math.max(this.width, this.height) / 2);
      jump >= 1;
      jump >>= 1
    ) {
      this.runPass(jump, sourceX, sourceY, destinationX, destinationY);
      [sourceX, destinationX] = [destinationX, sourceX];
      [sourceY, destinationY] = [destinationY, sourceY];
    }

    if (sourceX !== this.nearestX) {
      this.nearestX.set(sourceX);
      this.nearestY.set(sourceY);
    }
  }

  updateReadout() {
    const seedByPosition = new Map();
    for (let index = 0; index < this.seeds.length; index += 1) {
      const seed = this.seeds[index];
      const key = positionKey(seed.cellX, seed.cellY);
      if (!seedByPosition.has(key)) seedByPosition.set(key, index);
    }

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const index = y * this.width + x;
        const ownerId = seedByPosition.get(positionKey(
          this.nearestX[index],
          this.nearestY[index],
        ));
        if (ownerId === undefined) {
          this.ownerIds[index] = -1;
          this.distances[index] = -1;
          continue;
        }
        const seed = this.seeds[ownerId];
        this.ownerIds[index] = ownerId;
        this.distances[index] = Math.hypot(seed.x - x, seed.y - y);
      }
    }
  }

  recompute(time) {
    this.animateSeeds(time);
    this.runJumpFlood();
    this.updateReadout();
  }

  reset(seed) {
    if (seed !== undefined) this.random.reseed(seed);
    this.scatterSeeds();
    this.recompute(0);
  }
}

export { clamp, JumpFloodField, positionKey, RandomSource };
