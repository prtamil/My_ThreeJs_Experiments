import { SignedDistanceFieldJFA } from "./sdf-jfa/SignedDistanceFieldJFA.js";

function createMeshGroup() {
  const sdfJfa = new SignedDistanceFieldJFA();
  const mainGroup = sdfJfa.group;
  mainGroup.name = "SignedDistanceFieldJFA";
  mainGroup.userData.sdfJfa = sdfJfa;
  mainGroup.tick = (delta) => sdfJfa.tick(delta);
  mainGroup.dispose = () => sdfJfa.dispose();
  return mainGroup;
}

export { createMeshGroup };
