import { DomainWarpedNoise } from "./domain-warp/DomainWarpedNoise.js";

function createMeshGroup(renderer) {
  const domainWarp = new DomainWarpedNoise(renderer);
  const mainGroup = domainWarp.group;

  mainGroup.name = "DomainWarpedNoise";
  mainGroup.userData.domainWarp = domainWarp;
  mainGroup.tick = (delta) => domainWarp.tick(delta);
  mainGroup.dispose = () => domainWarp.dispose();
  return mainGroup;
}

export { createMeshGroup };
