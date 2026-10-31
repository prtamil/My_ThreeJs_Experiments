import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  PARTICLE_PATTERNS,
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "../src/World/components/perlin-flow/config.js";
import {
  fade,
  PerlinNoise,
} from "../src/World/components/perlin-flow/PerlinNoise.js";
import {
  PerlinFlowSimulation,
} from "../src/World/components/perlin-flow/PerlinFlowSimulation.js";

const seed = 0x5eed1234;

assert.equal(PATTERN_NAMES.length, 30, "The complete C pattern list is present");
assert.equal(THEMES.length, 10, "The complete C theme list is present");
assert.equal(fade(0), 0, "Perlin fade starts at zero");
assert.equal(fade(1), 1, "Perlin fade ends at one");

const noise = new PerlinNoise(seed);
const firstSamples = [
  noise.sample(0.25, 0.75),
  noise.sample(4.125, -2.625),
  noise.sample(81.75, 16.5),
];
noise.shuffle(seed);
const repeatedSamples = [
  noise.sample(0.25, 0.75),
  noise.sample(4.125, -2.625),
  noise.sample(81.75, 16.5),
];
assert.deepEqual(repeatedSamples, firstSamples, "Seeded noise is repeatable");
assert.equal(
  new Set(noise.permutation.slice(0, 256)).size,
  256,
  "The Perlin lookup contains one complete permutation",
);
assert.deepEqual(
  [...noise.permutation.slice(0, 256)],
  [...noise.permutation.slice(256)],
  "The Perlin lookup duplicates its first permutation",
);

const simulation = new PerlinFlowSimulation(seed);
const particlePatterns = new Set(PARTICLE_PATTERNS);
const patternStats = [];
const started = performance.now();

for (let pattern = 0; pattern < PATTERN_NAMES.length; pattern += 1) {
  simulation.setPattern(pattern);
  const ticks = particlePatterns.has(pattern) ? 60 : 1;
  for (let tick = 0; tick < ticks; tick += 1) {
    simulation.stepFixed(1 / SIM.defaultTickRate);
  }

  let minimum = Infinity;
  let maximum = -Infinity;
  let visibleCells = 0;
  for (let index = 0; index < simulation.glow.length; index += 1) {
    const glow = simulation.glow[index];
    assert.ok(Number.isFinite(glow), `${PATTERN_NAMES[pattern]} glow is finite`);
    assert.ok(
      simulation.colors[index] >= 0 && simulation.colors[index] < SIM.colorBands,
      `${PATTERN_NAMES[pattern]} uses a valid color band`,
    );
    minimum = Math.min(minimum, glow);
    maximum = Math.max(maximum, glow);
    if (glow > SIM.glowThreshold) visibleCells += 1;
  }

  assert.ok(visibleCells > 0, `${PATTERN_NAMES[pattern]} produces visible cells`);
  patternStats.push({
    pattern: PATTERN_NAMES[pattern],
    minimum: minimum.toFixed(3),
    maximum: maximum.toFixed(3),
    visibleCells,
  });
}

for (const particle of simulation.particles) {
  assert.ok(Number.isFinite(particle.x) && Number.isFinite(particle.y));
  assert.ok(particle.color >= 0 && particle.color < SIM.colorBands);
  assert.ok(particle.maxAge >= SIM.minAgeTicks);
  assert.ok(particle.maxAge < SIM.maxAgeTicks);
}

simulation.setSpeed(SIM.minSpeed);
simulation.adjustSpeed(-1);
assert.equal(simulation.speed, SIM.minSpeed, "Speed has a lower bound");
simulation.setSpeed(SIM.maxSpeed);
simulation.adjustSpeed(1);
assert.equal(simulation.speed, SIM.maxSpeed, "Speed has an upper bound");

simulation.setTickRate(SIM.minTickRate);
simulation.adjustTickRate(-1);
assert.equal(simulation.tickRate, SIM.minTickRate, "Tick rate has a lower bound");
simulation.setTickRate(SIM.maxTickRate);
simulation.adjustTickRate(1);
assert.equal(simulation.tickRate, SIM.maxTickRate, "Tick rate has an upper bound");

simulation.setPattern(29);
simulation.step(SIM.maxFrameDelta);
assert.ok(simulation.fieldTime > 0, "The 240 Hz catch-up path advances time");

const elapsed = performance.now() - started;
console.table(patternStats);
console.log(
  `Validated ${PATTERN_NAMES.length} patterns, ${THEMES.length} themes, ` +
  `${simulation.particles.length} particles, and the 240 Hz stress path ` +
  `in ${elapsed.toFixed(1)} ms.`,
);
