import { GrayScottReactionDiffusion } from "./gray-scott/GrayScottReactionDiffusion.js";

function createMeshGroup() {
  const grayScott = new GrayScottReactionDiffusion();
  const mainGroup = grayScott.group;
  mainGroup.name = "GrayScottReactionDiffusion";
  mainGroup.userData.grayScott = grayScott;
  mainGroup.tick = (delta) => grayScott.tick(delta);
  mainGroup.dispose = () => grayScott.dispose();
  return mainGroup;
}

export { createMeshGroup };
