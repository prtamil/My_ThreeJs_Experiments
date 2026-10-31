import { MarchingSquaresIsocontours } from
  "./marching-squares/MarchingSquaresIsocontours.js";

function createMeshGroup() {
  const marchingSquares = new MarchingSquaresIsocontours();
  const mainGroup = marchingSquares.group;

  mainGroup.name = "MarchingSquaresIsocontours";
  mainGroup.userData.marchingSquares = marchingSquares;
  mainGroup.tick = (delta) => marchingSquares.tick(delta);
  mainGroup.dispose = () => marchingSquares.dispose();

  return mainGroup;
}

export { createMeshGroup };
