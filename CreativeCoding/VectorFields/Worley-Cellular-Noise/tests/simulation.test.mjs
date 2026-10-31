import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { MAP, PATTERN_NAMES, PATTERN_TIERS, SIM, THEMES } from "../src/World/components/worley/config.js";
import { METRIC, WorleyNoise } from "../src/World/components/worley/WorleyNoise.js";
import { WorleySimulation } from "../src/World/components/worley/WorleySimulation.js";

const seed = 0x5eed1234;
assert.equal(PATTERN_NAMES.length, 30);
assert.equal(PATTERN_TIERS.length, 30);
assert.equal(THEMES.length, 10);
const noise = new WorleyNoise(seed);
const query = noise.query(0.25, -1.75, 0.5, METRIC.EUCLIDEAN);
assert.ok(query.f1 <= query.f2 && query.f2 <= query.f3);
noise.reseed(seed);
assert.deepEqual(noise.query(0.25, -1.75, 0.5), query);
assert.equal(noise.metricDistance(METRIC.MANHATTAN, 2, -3), 5);
assert.equal(noise.metricDistance(METRIC.CHEBYSHEV, 2, -3), 3);

const simulation = new WorleySimulation(seed);
const stats = [];
const started = performance.now();
for (let pattern = 0; pattern < PATTERN_NAMES.length; pattern += 1) {
  simulation.setPattern(pattern);
  let minimum = Infinity;
  let maximum = -Infinity;
  let visible = 0;
  for (let index = 0; index < simulation.glow.length; index += 1) {
    const glow = simulation.glow[index];
    assert.ok(Number.isFinite(glow));
    assert.ok(glow >= 0 && glow <= 1);
    assert.ok(simulation.colors[index] >= 0 && simulation.colors[index] < 4);
    minimum = Math.min(minimum, glow);
    maximum = Math.max(maximum, glow);
    if (glow > SIM.glowThreshold) visible += 1;
  }
  assert.ok(visible > 0, `${PATTERN_NAMES[pattern]} produces visible cells`);
  stats.push({ pattern: PATTERN_NAMES[pattern], minimum: minimum.toFixed(3), maximum: maximum.toFixed(3), visible });
}
simulation.setPattern(3);
simulation.reset(seed);
const reset = [...simulation.glow.slice(0, 256)];
simulation.stepFixed(1 / SIM.defaultTickRate);
assert.ok(simulation.fieldTime > 0);
simulation.reset(seed);
assert.deepEqual([...simulation.glow.slice(0, 256)], reset);
simulation.setPattern(29);
simulation.setTickRate(SIM.maxTickRate);
const before = simulation.fieldTime;
simulation.step(1 / SIM.maxTickRate);
assert.ok(simulation.fieldTime > before);
console.table(stats);
console.log(`Validated Worley hashing, six metrics, 30 patterns, and fixed-step animation in ${(performance.now() - started).toFixed(1)} ms.`);
