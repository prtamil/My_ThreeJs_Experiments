import { PerlinNoiseFlow } from "./perlin-flow/PerlinNoiseFlow.js";

function createMeshGroup() {
  const perlinFlow = new PerlinNoiseFlow();
  const mainGroup = perlinFlow.group;
  mainGroup.name = "PerlinNoiseFlow";
  mainGroup.userData.perlinFlow = perlinFlow;
  mainGroup.tick = (delta) => perlinFlow.tick(delta);
  mainGroup.dispose = () => perlinFlow.dispose();
  return mainGroup;
}

export { createMeshGroup };
