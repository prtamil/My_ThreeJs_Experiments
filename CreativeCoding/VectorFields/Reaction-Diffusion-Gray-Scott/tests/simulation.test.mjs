import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  MAP,
  PATTERN_NAMES,
  PRESETS,
  SIM,
  THEMES,
} from "../src/World/components/gray-scott/config.js";
import {
  GrayScottSimulation,
  normalizeV,
} from "../src/World/components/gray-scott/GrayScottSimulation.js";

const seed = 0x5eed1234;

assert.equal(PATTERN_NAMES.length, 30, "All C presets are present");
assert.equal(PRESETS.length, 30, "Every preset has Gray-Scott kinetics");
assert.equal(THEMES.length, 10, "All C themes are present");
assert.equal(MAP.width * MAP.height, 11200, "The C grid dimensions are preserved");
assert.equal(normalizeV(-1), 0);
assert.equal(normalizeV(0.4), 1);

const deterministic = new GrayScottSimulation(seed);
const firstSeed = [...deterministic.u.slice(0, 128)];
deterministic.reset(seed);
assert.deepEqual(
  [...deterministic.u.slice(0, 128)],
  firstSeed,
  "A supplied seed reproduces the symmetry-breaking jitter",
);

const calm = new GrayScottSimulation(seed);
calm.u.fill(1);
calm.v.fill(0);
calm.stepReaction();
assert.ok(calm.u.every((value) => value === 1));
assert.ok(calm.v.every((value) => value === 0));

const simulation = new GrayScottSimulation(seed);
const patternStats = [];
const started = performance.now();

for (let pattern = 0; pattern < PATTERN_NAMES.length; pattern += 1) {
  simulation.setPattern(pattern);
  assert.equal(simulation.feed, PRESETS[pattern].feed);
  assert.equal(simulation.kill, PRESETS[pattern].kill);
  assert.equal(simulation.stepCount, 0, "Changing a preset restarts growth");

  for (let tick = 0; tick < 16; tick += 1) simulation.stepFixed();

  let minimumU = Infinity;
  let maximumU = -Infinity;
  let minimumV = Infinity;
  let maximumV = -Infinity;
  let visibleCells = 0;
  for (let index = 0; index < simulation.v.length; index += 1) {
    const u = simulation.u[index];
    const v = simulation.v[index];
    assert.ok(Number.isFinite(u), `${PATTERN_NAMES[pattern]} U is finite`);
    assert.ok(Number.isFinite(v), `${PATTERN_NAMES[pattern]} V is finite`);
    minimumU = Math.min(minimumU, u);
    maximumU = Math.max(maximumU, u);
    minimumV = Math.min(minimumV, v);
    maximumV = Math.max(maximumV, v);
    if (normalizeV(v) > SIM.glowThreshold) visibleCells += 1;
  }
  assert.ok(visibleCells > 0, `${PATTERN_NAMES[pattern]} remains visible`);
  patternStats.push({
    pattern: PATTERN_NAMES[pattern],
    feed: simulation.feed.toFixed(4),
    kill: simulation.kill.toFixed(5),
    uRange: `${minimumU.toFixed(3)}..${maximumU.toFixed(3)}`,
    vRange: `${minimumV.toFixed(3)}..${maximumV.toFixed(3)}`,
    visibleCells,
  });
}

simulation.setSubSteps(SIM.defaultSubSteps);
simulation.adjustSubSteps(1);
assert.equal(simulation.subSteps, 12, "Faster doubles sub-steps");
simulation.adjustSubSteps(-1);
assert.equal(simulation.subSteps, 6, "Slower halves sub-steps");
simulation.setSubSteps(SIM.minSubSteps);
simulation.adjustSubSteps(-1);
assert.equal(simulation.subSteps, SIM.minSubSteps, "Sub-steps have a lower bound");
simulation.setSubSteps(SIM.maxSubSteps);
simulation.adjustSubSteps(1);
assert.equal(simulation.subSteps, SIM.maxSubSteps, "Sub-steps have an upper bound");

simulation.setTickRate(SIM.minTickRate);
simulation.adjustTickRate(-1);
assert.equal(simulation.tickRate, SIM.minTickRate, "Tick rate has a lower bound");
simulation.setTickRate(SIM.maxTickRate);
simulation.adjustTickRate(1);
assert.equal(simulation.tickRate, SIM.maxTickRate, "Tick rate has an upper bound");

simulation.reset(seed);
simulation.setSubSteps(SIM.maxSubSteps);
const beforeStress = simulation.stepCount;
simulation.step(1 / SIM.maxTickRate);
assert.equal(
  simulation.stepCount - beforeStress,
  SIM.maxSubSteps,
  "The maximum-rate path runs one complete tick",
);

const elapsed = performance.now() - started;
console.table(patternStats);
console.log(
  `Validated ${PATTERN_NAMES.length} Gray-Scott presets, ${THEMES.length} themes, ` +
  `sealed boundaries, deterministic seeding, and the maximum-rate path ` +
  `in ${elapsed.toFixed(1)} ms.`,
);
