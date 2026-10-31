import {
  SphereBufferGeometry,
  BoxBufferGeometry,
  TorusKnotBufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MaxEquation,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const geometry = new SphereBufferGeometry(0.25, 16, 16);
  const material = new MeshStandardMaterial({
    color: "indigo",
    flatShading: true,
  });

  const protoSphere = new Mesh(geometry, material);
  mainGroup.add(protoSphere);
  mainGroup.tick = (delta) => {};
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
