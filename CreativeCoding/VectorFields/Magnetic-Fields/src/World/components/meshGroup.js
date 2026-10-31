import { MagneticFields } from "./magnetic-fields/MagneticFields.js";

function createMeshGroup() {
  const magneticFields = new MagneticFields();
  const mainGroup = magneticFields.group;

  mainGroup.name = "MagneticFields";
  mainGroup.userData.magneticFields = magneticFields;
  mainGroup.tick = (delta) => magneticFields.tick(delta);
  mainGroup.dispose = () => magneticFields.dispose();

  return mainGroup;
}

export { createMeshGroup };
