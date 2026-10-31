import { ValueNoiseShowcase } from "./value-noise/ValueNoiseShowcase.js";

function createMeshGroup() {
  const valueNoise = new ValueNoiseShowcase();
  const mainGroup = valueNoise.group;
  mainGroup.name = "ValueNoiseShowcase";
  mainGroup.userData.valueNoise = valueNoise;
  mainGroup.tick = (delta) => valueNoise.tick(delta);
  mainGroup.dispose = () => valueNoise.dispose();
  return mainGroup;
}

export { createMeshGroup };
