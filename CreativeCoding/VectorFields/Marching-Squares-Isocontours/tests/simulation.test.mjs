import { strict as assert } from "node:assert";
import { GLYPH, PATTERNS } from
  "../src/World/components/marching-squares/config.js";
import { MarchingSquaresSimulation } from
  "../src/World/components/marching-squares/MarchingSquaresSimulation.js";
import { ScalarField } from
  "../src/World/components/marching-squares/ScalarField.js";

const classifierField = new ScalarField(2, 2);
for (let marchingCase = 0; marchingCase < 16; marchingCase += 1) {
  classifierField.samples.fill(0);
  classifierField.samples[2] = marchingCase & 1 ? 1 : 0;
  classifierField.samples[3] = marchingCase & 2 ? 1 : 0;
  classifierField.samples[1] = marchingCase & 4 ? 1 : 0;
  classifierField.samples[0] = marchingCase & 8 ? 1 : 0;
  assert.equal(
    classifierField.classify(0, 0, 0.5),
    marchingCase,
    `marching-squares case ${marchingCase}`,
  );
}

const simulation = new MarchingSquaresSimulation();
simulation.reset(0x1234abcd);
const firstSample = simulation.field.samples[137];
simulation.reset(0x1234abcd);
assert.equal(simulation.field.samples[137], firstSample, "seeded field repeatability");

for (let pattern = 0; pattern < PATTERNS.length; pattern += 1) {
  simulation.setPattern(pattern);
  assert(
    simulation.field.samples.every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 1,
    ),
    `${PATTERNS[pattern].name} has a valid scalar field`,
  );
  assert(
    simulation.glow.every((value) => value === 0 || value === 1),
    `${PATTERNS[pattern].name} has valid visibility values`,
  );
  assert(
    simulation.bands.every((value) => value >= 0 && value <= 3),
    `${PATTERNS[pattern].name} has valid palette bands`,
  );
  assert(
    simulation.glyphs.every(
      (value) => value >= GLYPH.blank && value < GLYPH.count,
    ),
    `${PATTERNS[pattern].name} has valid glyph IDs`,
  );
}

simulation.setTickRate(240);
simulation.setDriftMultiplier(16);
for (let frame = 0; frame < 6; frame += 1) simulation.step(1 / 60);
assert(Number.isFinite(simulation.fieldTime));
assert(simulation.sweepPhase >= 0 && simulation.sweepPhase < 1);

console.log(
  `Validated all 16 marching cases, ${PATTERNS.length} patterns, and ` +
  `${simulation.tickRate} Hz / ${simulation.driftMultiplier}x stress settings.`,
);
