import {
  BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  BufferAttribute,
  DoubleSide,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const geometry = new BufferGeometry();

  const vertices = new Float32Array([
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0,

    1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0,
  ]);

  geometry.setAttribute("position", new BufferAttribute(vertices, 3));

  const material = new MeshBasicMaterial({
    color: "indigo",
    side: DoubleSide,
    wireframe: false,
  });

  const protoBuffer = new Mesh(geometry, material);
  mainGroup.add(protoBuffer);
  mainGroup.tick = (delta) => {};
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
