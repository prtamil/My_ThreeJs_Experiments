import {
  SphereGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const geometry = new SphereGeometry(0.25, 16, 16);
  const material = new MeshStandardMaterial({
    color: "indigo",
    flatShading: true,
  });

  const protoSphere = new Mesh(geometry, material);
  mainGroup.add(protoSphere);
  mainGroup.tick = (delta) => {
    mainGroup.rotation.x += 0.15 * delta;
    mainGroup.rotation.y += 0.3 * delta;
  };
  mainGroup.dispose = () => {
    geometry.dispose();
    material.dispose();
  };
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
