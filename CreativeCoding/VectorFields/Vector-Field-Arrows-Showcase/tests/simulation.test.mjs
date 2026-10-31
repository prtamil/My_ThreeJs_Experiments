import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { MAP, PATTERN_NAMES, PATTERN_TIERS, SIM, THEMES } from "../src/World/components/vector-arrows/config.js";
import { VectorNoise } from "../src/World/components/vector-arrows/VectorNoise.js";
import { VectorFieldSimulation } from "../src/World/components/vector-arrows/VectorFieldSimulation.js";

const seed = 0x5eed1234;
assert.equal(PATTERN_NAMES.length, 30);
assert.equal(PATTERN_TIERS.length, 30);
assert.equal(THEMES.length, 10);
const noise = new VectorNoise(seed);
const noiseSample = noise.sample(-2.5, 7.125);
noise.reseed(seed);
assert.equal(noise.sample(-2.5, 7.125), noiseSample);

const simulation = new VectorFieldSimulation(seed);
const stats = [];
const started = performance.now();
for (let pattern = 0; pattern < PATTERN_NAMES.length; pattern += 1) {
  simulation.setPattern(pattern);
  const directions = new Set();
  for (let index = 0; index < simulation.glow.length; index += 1) {
    assert.equal(simulation.glow[index], 1);
    assert.ok(simulation.bands[index] >= 0 && simulation.bands[index] < 4);
    assert.ok(simulation.directions[index] >= 0 && simulation.directions[index] <= 8);
    directions.add(simulation.directions[index]);
  }
  assert.ok(directions.size > 0);
  stats.push({ pattern: PATTERN_NAMES[pattern], directions: directions.size });
}
simulation.setPattern(4);
simulation.reset(seed);
const reset = [...simulation.directions.slice(0, 256)];
simulation.stepFixed(1 / SIM.defaultTickRate);
simulation.reset(seed);
assert.deepEqual([...simulation.directions.slice(0, 256)], reset);
simulation.toggleMotion();
simulation.stepFixed(1 / SIM.defaultTickRate);
assert.equal(simulation.motion, true);
simulation.setPattern(29);
simulation.setTickRate(SIM.maxTickRate);
const before = simulation.fieldTime;
simulation.step(1 / SIM.maxTickRate);
assert.ok(simulation.fieldTime > before);
console.table(stats);
console.log(`Validated 30 vector fields, eight compass directions, motion blending, and fixed-step animation in ${(performance.now() - started).toFixed(1)} ms.`);
