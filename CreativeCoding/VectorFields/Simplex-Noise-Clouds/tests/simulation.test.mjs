import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  MAP,
  PATTERN_NAMES,
  PATTERN_TIERS,
  SIM,
  THEMES,
} from "../src/World/components/simplex-clouds/config.js";
import {
  F2,
  G2,
  GRADIENTS,
  SimplexNoise,
} from "../src/World/components/simplex-clouds/SimplexNoise.js";
import {
  CloudSimulation,
} from "../src/World/components/simplex-clouds/CloudSimulation.js";

const seed = 0x5eed1234;

assert.equal(PATTERN_NAMES.length, 30, "All source patterns are present");
assert.equal(PATTERN_TIERS.length, 30, "Every pattern has its source tier");
assert.equal(THEMES.length, 10, "All source themes are present");
assert.equal(GRADIENTS.length, 12, "The Gustavson gradient set is preserved");
assert.equal(F2, 0.36602540378443864);
assert.equal(G2, 0.21132486540518713);

const noise = new SimplexNoise(seed);
const firstSamples = [
  noise.sample(0.125, 0.75),
  noise.sample(-2.5, 7.125),
  noise.sample(81.25, -16.75),
];
noise.shuffle(seed);
assert.deepEqual(
  [
    noise.sample(0.125, 0.75),
    noise.sample(-2.5, 7.125),
    noise.sample(81.25, -16.75),
  ],
  firstSamples,
  "Seeded simplex fields are repeatable",
);
assert.equal(new Set(noise.permutation.slice(0, 256)).size, 256);
assert.deepEqual(
  [...noise.permutation.slice(0, 256)],
  [...noise.permutation.slice(256)],
  "The permutation is duplicated for safe chained lookups",
);
assert.equal(noise.sample(0, 0), 0, "The simplex origin has zero contribution");

const simulation = new CloudSimulation(seed);
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

simulation.reset(seed);
const resetField = [...simulation.glow.slice(0, 256)];
simulation.stepFixed(1 / SIM.defaultTickRate);
assert.ok(simulation.fieldTime > 0, "A fixed tick advances the drift clock");
simulation.reset(seed);
assert.deepEqual(
  [...simulation.glow.slice(0, 256)],
  resetField,
  "Resetting with a seed reproduces the cloud field",
);

simulation.setDrift(SIM.minDrift);
simulation.adjustDrift(-1);
assert.equal(simulation.drift, SIM.minDrift, "Drift has a lower bound");
simulation.setDrift(SIM.maxDrift);
simulation.adjustDrift(1);
assert.equal(simulation.drift, SIM.maxDrift, "Drift has an upper bound");
simulation.setPattern(19);
simulation.setTickRate(SIM.maxTickRate);
const timeBeforeStress = simulation.fieldTime;
simulation.step(1 / SIM.maxTickRate);
assert.ok(simulation.fieldTime > timeBeforeStress, "The 240 Hz fractal path advances");

const elapsed = performance.now() - started;
console.table(patternStats);
console.log(
  `Validated Gustavson simplex noise, ${PATTERN_NAMES.length} patterns, ` +
  `${THEMES.length} themes, deterministic resets, and the 240 Hz fractal path ` +
  `in ${elapsed.toFixed(1)} ms.`,
);
