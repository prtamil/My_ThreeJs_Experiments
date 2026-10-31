import { WaveInterference } from "./wave-interference/WaveInterference.js";

function createMeshGroup() {
  const waves = new WaveInterference();
  const mainGroup = waves.group;
  mainGroup.name = "WaveInterference";
  mainGroup.userData.waves = waves;
  mainGroup.tick = (delta) => waves.tick(delta);
  mainGroup.dispose = () => waves.dispose();
  return mainGroup;
}

export { createMeshGroup };
