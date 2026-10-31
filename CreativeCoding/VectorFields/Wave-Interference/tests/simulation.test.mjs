import assert from "node:assert/strict";
import { MAP, SIM, THEMES } from "../src/World/components/wave-interference/config.js";
import { WaveSimulation } from "../src/World/components/wave-interference/WaveSimulation.js";

const seed = 0x5eed1234;
const simulation = new WaveSimulation(seed);
assert.equal(simulation.sources.length, 6);
assert.equal(simulation.sourceCount, 2);
assert.equal(THEMES.length, 5);
assert.equal(simulation.glow.length, MAP.width * MAP.height);
for (let index = 0; index < simulation.glow.length; index += 1) {
  assert.ok(Number.isFinite(simulation.glow[index]));
  assert.ok(simulation.glow[index] >= 0 && simulation.glow[index] <= 1);
  assert.ok(simulation.bands[index] >= 0 && simulation.bands[index] < 8);
}
const firstSources = simulation.sources.map((source) => ({ ...source }));
simulation.reset(seed);
assert.deepEqual(simulation.sources, firstSources, "Seeded source scattering is repeatable");
simulation.setSourceCount(99);
assert.equal(simulation.sourceCount, SIM.maxSources);
simulation.setSourceCount(-99);
assert.equal(simulation.sourceCount, SIM.minSources);
simulation.setWavelength(99);
assert.equal(simulation.wavelength, SIM.maxWavelength);
simulation.setWavelength(-99);
assert.equal(simulation.wavelength, SIM.minWavelength);
const before = simulation.time;
simulation.step(1);
assert.equal(simulation.time, before + SIM.maxFrameDelta);
simulation.togglePaused();
simulation.step(1 / 60);
assert.equal(simulation.time, before + SIM.maxFrameDelta);
console.log("Validated six-source wave superposition, eight shade bands, controls, and deterministic scattering.");
