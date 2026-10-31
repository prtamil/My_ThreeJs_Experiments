import { SimplexNoiseClouds } from "./simplex-clouds/SimplexNoiseClouds.js";

function createMeshGroup() {
  const simplexClouds = new SimplexNoiseClouds();
  const mainGroup = simplexClouds.group;
  mainGroup.name = "SimplexNoiseClouds";
  mainGroup.userData.simplexClouds = simplexClouds;
  mainGroup.tick = (delta) => simplexClouds.tick(delta);
  mainGroup.dispose = () => simplexClouds.dispose();
  return mainGroup;
}

export { createMeshGroup };
