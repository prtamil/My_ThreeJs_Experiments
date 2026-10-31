import { MidpointDisplacementCoastline } from
  "./midpoint-displacement/MidpointDisplacementCoastline.js";

function createMeshGroup() {
  const coastline = new MidpointDisplacementCoastline();
  const mainGroup = coastline.group;
  mainGroup.name = "MidpointDisplacementCoastline";
  mainGroup.userData.coastline = coastline;
  mainGroup.tick = (delta) => coastline.tick(delta);
  mainGroup.dispose = () => coastline.dispose();
  return mainGroup;
}

export { createMeshGroup };
