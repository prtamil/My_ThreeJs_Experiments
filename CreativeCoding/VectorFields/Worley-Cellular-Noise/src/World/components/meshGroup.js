import { WorleyCellularNoise } from "./worley/WorleyCellularNoise.js";

function createMeshGroup() {
  const worley = new WorleyCellularNoise();
  const mainGroup = worley.group;
  mainGroup.name = "WorleyCellularNoise";
  mainGroup.userData.worley = worley;
  mainGroup.tick = (delta) => worley.tick(delta);
  mainGroup.dispose = () => worley.dispose();
  return mainGroup;
}

export { createMeshGroup };
