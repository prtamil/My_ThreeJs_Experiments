import { ElectricPotentialField } from "./electric-potential/ElectricPotentialField.js";

function createMeshGroup() {
  const electricPotential = new ElectricPotentialField();
  const mainGroup = electricPotential.group;

  mainGroup.name = "ElectricPotentialField";
  mainGroup.userData.electricPotential = electricPotential;
  mainGroup.tick = (delta) => electricPotential.tick(delta);
  mainGroup.dispose = () => electricPotential.dispose();

  return mainGroup;
}

export { createMeshGroup };
