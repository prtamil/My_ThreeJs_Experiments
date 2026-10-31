import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  MAP,
  PATTERN_NAMES,
  PATTERN_TIERS,
  SIM,
  THEMES,
} from "../src/World/components/value-noise/config.js";
import {
  HASH_TOP24_TO_UNIT,
  LATTICE_HASH_MUL_X,
  LATTICE_HASH_MUL_Y,
  ValueNoise,
} from "../src/World/components/value-noise/ValueNoise.js";
import {
  ValueNoiseSimulation,
} from "../src/World/components/value-noise/ValueNoiseSimulation.js";

const seed = 0x5eed1234;

assert.equal(PATTERN_NAMES.length, 30, "All source patterns are present");
assert.equal(PATTERN_TIERS.length, 30, "Every pattern has its source tier");
assert.equal(THEMES.length, 10, "All source themes are present");
assert.equal(MAP.width, 200);
assert.equal(MAP.height, 56);
assert.equal(SIM.noiseScale, 0.10);
assert.equal(SIM.octaves, 4);
assert.equal(LATTICE_HASH_MUL_X, 374761393);
assert.equal(LATTICE_HASH_MUL_Y, 668265263);
assert.equal(HASH_TOP24_TO_UNIT, 1 / 16777215);

const noise = new ValueNoise(seed);
const samples = [
  noise.sample(0.125, 0.75, 2),
  noise.sample(-2.5, 7.125, 3),
  noise.sample(81.25, -16.75, 4),
];
noise.reseed(seed);
assert.deepEqual(
  [
    noise.sample(0.125, 0.75, 2),
    noise.sample(-2.5, 7.125, 3),
    noise.sample(81.25, -16.75, 4),
  ],
  samples,
  "Seeded value-noise fields are repeatable",
);
assert.equal(
  noise.sample(4, -3, 2),
  noise.latticeScalar(4, -3),
  "An integer point returns its lattice corner",
);
assert.equal(
  noise.sample(4.8, -2.2, 0),
  noise.latticeScalar(5, -2),
  "Blocky interpolation snaps to the nearest corner",
);

const simulation = new ValueNoiseSimulation(seed);
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

simulation.setPattern(0);
simulation.reset(seed);
const resetField = [...simulation.glow.slice(0, 256)];
simulation.stepFixed(1 / SIM.defaultTickRate);
assert.ok(simulation.fieldTime > 0, "A fixed tick advances the drift clock");
simulation.reset(seed);
assert.deepEqual(
  [...simulation.glow.slice(0, 256)],
  resetField,
  "Resetting with a seed reproduces the value-noise field",
);

simulation.setDrift(SIM.minDrift);
simulation.adjustDrift(-1);
assert.equal(simulation.drift, SIM.minDrift, "Drift has a lower bound");
simulation.setDrift(SIM.maxDrift);
simulation.adjustDrift(1);
assert.equal(simulation.drift, SIM.maxDrift, "Drift has an upper bound");
simulation.setPattern(15);
simulation.setTickRate(SIM.maxTickRate);
const timeBeforeStress = simulation.fieldTime;
simulation.step(1 / SIM.maxTickRate);
assert.ok(simulation.fieldTime > timeBeforeStress, "The 240 Hz warp path advances");

const elapsed = performance.now() - started;
console.table(patternStats);
console.log(
  `Validated lattice value noise, ${PATTERN_NAMES.length} patterns, ` +
  `${THEMES.length} themes, deterministic resets, and the 240 Hz warp path ` +
  `in ${elapsed.toFixed(1)} ms.`,
);
