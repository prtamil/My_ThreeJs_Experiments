import { FlowField } from "./flow-fields/FlowField.js";

function createMeshGroup() {
  const flowField = new FlowField();
  const mainGroup = flowField.group;

  mainGroup.name = "FlowFieldParticles";
  mainGroup.userData.flowField = flowField;
  mainGroup.tick = (delta) => flowField.tick(delta);
  mainGroup.dispose = () => flowField.dispose();

  return mainGroup;
}

export { createMeshGroup };
