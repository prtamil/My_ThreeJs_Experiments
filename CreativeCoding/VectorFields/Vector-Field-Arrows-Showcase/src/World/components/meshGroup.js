import { VectorFieldArrowsShowcase } from "./vector-arrows/VectorFieldArrowsShowcase.js";

function createMeshGroup() {
  const vectorField = new VectorFieldArrowsShowcase();
  const mainGroup = vectorField.group;
  mainGroup.name = "VectorFieldArrowsShowcase";
  mainGroup.userData.vectorField = vectorField;
  mainGroup.tick = (delta) => vectorField.tick(delta);
  mainGroup.dispose = () => vectorField.dispose();
  return mainGroup;
}

export { createMeshGroup };
