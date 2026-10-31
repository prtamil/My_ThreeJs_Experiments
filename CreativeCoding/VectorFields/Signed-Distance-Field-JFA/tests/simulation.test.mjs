import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  MAP,
  PATTERN_NAMES,
  PATTERN_TIERS,
  SIM,
  THEMES,
} from "../src/World/components/sdf-jfa/config.js";
import {
  JumpFloodField,
} from "../src/World/components/sdf-jfa/JumpFloodField.js";
import {
  hashToUnit,
} from "../src/World/components/sdf-jfa/SDFPatterns.js";
import {
  SDFSimulation,
} from "../src/World/components/sdf-jfa/SDFSimulation.js";

const seed = 0x5eed1234;

assert.equal(PATTERN_NAMES.length, 30, "All C visualization modes are present");
assert.equal(PATTERN_TIERS.length, 30, "Every mode has its source tier");
assert.equal(THEMES.length, 10, "All C themes are present");
assert.equal(SIM.seedCount, 20, "The source seed count is preserved");
assert.deepEqual([100, 50, 25, 12, 6, 3, 1], (() => {
  const steps = [];
  for (let jump = Math.floor(Math.max(MAP.width, MAP.height) / 2); jump >= 1; jump >>= 1) {
    steps.push(jump);
  }
  return steps;
})());

assert.equal(hashToUnit(0), hashToUnit(0), "The cell hash is deterministic");
assert.ok(hashToUnit(0xdeadbeef) >= 0 && hashToUnit(0xdeadbeef) <= 1);

const field = new JumpFloodField(seed);
const seedSnapshot = field.seeds.map((point) => ({
  anchorX: point.anchorX,
  anchorY: point.anchorY,
  phaseX: point.phaseX,
  phaseY: point.phaseY,
}));
field.reset(seed);
assert.deepEqual(
  field.seeds.map((point) => ({
    anchorX: point.anchorX,
    anchorY: point.anchorY,
    phaseX: point.phaseX,
    phaseY: point.phaseY,
  })),
  seedSnapshot,
  "A supplied seed reproduces the scattered points",
);

for (let index = 0; index < field.cellCount; index += 1) {
  assert.notEqual(field.nearestX[index], SIM.sentinel, "JFA reaches every cell");
  assert.ok(field.ownerIds[index] >= 0 && field.ownerIds[index] < SIM.seedCount);
  assert.ok(Number.isFinite(field.distances[index]) && field.distances[index] >= 0);
  const owner = field.seeds[field.ownerIds[index]];
  assert.equal(owner.cellX, field.nearestX[index]);
  assert.equal(owner.cellY, field.nearestY[index]);
}

let ownershipSamples = 0;
let exactOwnershipSamples = 0;
for (let y = 0; y < MAP.height; y += 7) {
  for (let x = 0; x < MAP.width; x += 11) {
    const index = y * MAP.width + x;
    const ownerDistanceSquared =
      (x - field.nearestX[index]) ** 2 + (y - field.nearestY[index]) ** 2;
    let nearestDistanceSquared = Infinity;
    for (const point of field.seeds) {
      nearestDistanceSquared = Math.min(
        nearestDistanceSquared,
        (x - point.cellX) ** 2 + (y - point.cellY) ** 2,
      );
    }
    assert.ok(ownerDistanceSquared >= nearestDistanceSquared);
    ownershipSamples += 1;
    if (ownerDistanceSquared === nearestDistanceSquared) exactOwnershipSamples += 1;
  }
}
assert.ok(
  exactOwnershipSamples / ownershipSamples > 0.9,
  "The source JFA approximation matches brute force for most sampled cells",
);

const simulation = new SDFSimulation(seed);
const patternStats = [];
const started = performance.now();

for (let pattern = 0; pattern < PATTERN_NAMES.length; pattern += 1) {
  simulation.setPattern(pattern);
  let minimum = Infinity;
  let maximum = -Infinity;
  let visibleCells = 0;
  for (let index = 0; index < simulation.glow.length; index += 1) {
    const glow = simulation.glow[index];
    assert.ok(Number.isFinite(glow), `${PATTERN_NAMES[pattern]} glow is finite`);
    assert.ok(glow >= 0 && glow <= 1, `${PATTERN_NAMES[pattern]} glow is clamped`);
    assert.ok(simulation.colors[index] >= 0 && simulation.colors[index] < 4);
    minimum = Math.min(minimum, glow);
    maximum = Math.max(maximum, glow);
    if (glow > SIM.glowThreshold) visibleCells += 1;
  }
  assert.ok(visibleCells > 0, `${PATTERN_NAMES[pattern]} produces visible cells`);
  patternStats.push({
    pattern: PATTERN_NAMES[pattern],
    tier: PATTERN_TIERS[pattern],
    minimum: minimum.toFixed(3),
    maximum: maximum.toFixed(3),
    visibleCells,
  });
}

simulation.setDrift(SIM.minDrift);
simulation.adjustDrift(-1);
assert.equal(simulation.drift, SIM.minDrift, "Drift has a lower bound");
simulation.setDrift(SIM.maxDrift);
simulation.adjustDrift(1);
assert.equal(simulation.drift, SIM.maxDrift, "Drift has an upper bound");
simulation.setTickRate(SIM.maxTickRate);
const timeBeforeStress = simulation.wobbleTime;
simulation.step(1 / SIM.maxTickRate);
assert.ok(simulation.wobbleTime > timeBeforeStress, "The 240 Hz path advances JFA motion");

const elapsed = performance.now() - started;
console.table(patternStats);
console.log(
  `Validated the source JFA pass sequence (${exactOwnershipSamples}/${ownershipSamples} ` +
  `sampled owners exactly nearest), ${PATTERN_NAMES.length} patterns, ` +
  `${THEMES.length} themes, ${SIM.seedCount} drifting seeds, and the 240 Hz path ` +
  `in ${elapsed.toFixed(1)} ms.`,
);
