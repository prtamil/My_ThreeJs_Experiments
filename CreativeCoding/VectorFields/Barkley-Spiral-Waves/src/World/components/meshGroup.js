import { BarkleySpiralWaves } from "./barkley-spiral/BarkleySpiralWaves.js";

function createMeshGroup() {
  const barkleySpiral = new BarkleySpiralWaves();
  const mainGroup = barkleySpiral.group;

  mainGroup.name = "BarkleySpiralWaves";
  mainGroup.userData.barkleySpiral = barkleySpiral;
  mainGroup.tick = (delta) => barkleySpiral.tick(delta);
  mainGroup.dispose = () => barkleySpiral.dispose();

  return mainGroup;
}

export { createMeshGroup };
