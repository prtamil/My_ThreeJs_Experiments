import { BasicVectorField } from "./basic-vector-fields/BasicVectorField.js";
import { createKeyboardControls } from "./basic-vector-fields/controls.js";

function createMeshGroup() {
  const vectorField = new BasicVectorField();
  const mainGroup = vectorField.group;
  const keyboardControls = createKeyboardControls(vectorField);

  mainGroup.name = "BasicVectorField";
  mainGroup.scale.setScalar(0.72);
  mainGroup.userData.vectorField = vectorField;
  mainGroup.tick = (delta) => vectorField.tick(delta);
  mainGroup.dispose = () => {
    keyboardControls.dispose();
    vectorField.dispose();
  };

  return mainGroup;
}

export { createMeshGroup };
