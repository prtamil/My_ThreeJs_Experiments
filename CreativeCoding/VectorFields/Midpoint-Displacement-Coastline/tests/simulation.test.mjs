import { strict as assert } from "node:assert";
import { PATTERN_NAMES, SIM } from
  "../src/World/components/midpoint-displacement/config.js";
import {
  generateMidpointLine,
  MidpointSimulation,
} from "../src/World/components/midpoint-displacement/MidpointSimulation.js";

const straight = generateMidpointLine(257, 2, 4, 10, 0.5, () => 0);
assert.equal(straight.length, 257);
assert.equal(straight[0], 2);
assert.equal(straight[128], 3);
assert.equal(straight[256], 4);
assert(straight.every(Number.isFinite));

const expectedLineCounts = [
  1, 1, 1, 1, 1,
  2, 2, 1, 1, 2,
  4, 3, 3, 4, 4,
  6, 7, 5, 5, 5,
  1, 1, 1, 6, 4,
  4, 1, 1, 3, 8,
];

const simulation = new MidpointSimulation(0x1234abcd);
const initialPoint = simulation.keyframeA[0][91];
simulation.reset(0x1234abcd);
assert.equal(simulation.keyframeA[0][91], initialPoint, "seeded repeatability");

for (let pattern = 0; pattern < PATTERN_NAMES.length; pattern += 1) {
  simulation.setPattern(pattern);
  assert.equal(
    simulation.specs.length,
    expectedLineCounts[pattern],
    `${PATTERN_NAMES[pattern]} line count`,
  );
  assert(
    simulation.liveLines.every(
      (line) => line.length === SIM.linePoints && line.every(Number.isFinite),
    ),
    `${PATTERN_NAMES[pattern]} has valid fractal lines`,
  );
  assert(simulation.visible.every((value) => value === 0 || value === 1));
  assert(simulation.bands.every((value) => value >= 0 && value <= 3));
  assert(simulation.densities.every((value) => value >= 0 && value <= 2));
}

simulation.setPattern(0);
const target = Float32Array.from(simulation.keyframeB[0]);
simulation.setMorphRate(2);
simulation.stepFixed(0.5);
assert.deepEqual(simulation.keyframeA[0], target, "completed target becomes next start");
assert.deepEqual(simulation.liveLines[0], target, "morph rotates without a jump");

simulation.setPattern(29);
simulation.setTickRate(240);
for (let frame = 0; frame < 6; frame += 1) simulation.step(1 / 60);
assert(simulation.liveLines.flatMap((line) => [...line]).every(Number.isFinite));

console.log(
  `Validated ${PATTERN_NAMES.length} presets, ${SIM.linePoints}-point ` +
  `midpoint lines, continuous morph rotation, and ${simulation.tickRate} Hz stress.`,
);
