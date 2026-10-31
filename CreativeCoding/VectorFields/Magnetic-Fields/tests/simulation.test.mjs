import { strict as assert } from "node:assert";
import { MagneticFieldSimulation } from
  "../src/World/components/magnetic-fields/MagneticFieldSimulation.js";
import { PATTERN_NAMES } from
  "../src/World/components/magnetic-fields/config.js";

const expectedPoleCounts = [
  1, 2, 2, 2, 2, 3, 3, 2, 4, 4,
  8, 6, 6, 6, 4, 5, 8, 2, 8, 12,
  9, 8, 14, 12, 12, 16, 14, 16, 18, 24,
];

const simulation = new MagneticFieldSimulation();

for (let pattern = 0; pattern < PATTERN_NAMES.length; pattern += 1) {
  simulation.setPattern(pattern);
  assert.equal(
    simulation.activePoles.length,
    expectedPoleCounts[pattern],
    `${PATTERN_NAMES[pattern]} pole count`,
  );

  for (let frame = 0; frame < 120; frame += 1) {
    simulation.step(1 / 60);
  }

  assert(
    simulation.activePoles.every(
      (pole) => Number.isFinite(pole.x) && Number.isFinite(pole.y),
    ),
    `${PATTERN_NAMES[pattern]} has finite poles`,
  );
  assert(
    simulation.particles.every(
      (particle) =>
        Number.isFinite(particle.x) && Number.isFinite(particle.y),
    ),
    `${PATTERN_NAMES[pattern]} has finite particles`,
  );
  assert(
    simulation.glow.every(
      (value) => Number.isFinite(value) && value >= 0 && value <= 1,
    ),
    `${PATTERN_NAMES[pattern]} has a valid trail buffer`,
  );
}

simulation.setTickRate(240);
simulation.setParticleCount(1024);
for (let frame = 0; frame < 60; frame += 1) {
  simulation.step(1 / 60);
}

assert.equal(simulation.tickRate, 240);
assert.equal(simulation.particles.length, 1024);
console.log(
  `Validated ${PATTERN_NAMES.length} patterns and ` +
  `${simulation.particles.length} particles at ${simulation.tickRate} Hz.`,
);
