import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Group,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const v0 = [-1, 1, 0];
  const v1 = [1, 1, 0];
  const v2 = [-1, -1, 0];
  const v3 = [1, -1, 0];

  const vertices = new Float32Array([...v0, ...v1, ...v2, ...v3]);

  const geometry = new BufferGeometry();

  geometry.setAttribute("position", new BufferAttribute(vertices, 3));
  geometry.setIndex([0, 2, 1, 1, 2, 3]);

  const material = new MeshBasicMaterial({
    color: "red",
    wireframe: true,
  });

  const tri = new Mesh(geometry, material);

  mainGroup.add(tri);
  mainGroup.tick = (delta) => {
    mainGroup.rotation.z += 0.15 * delta;
  };
  mainGroup.dispose = () => {
    geometry.dispose();
    material.dispose();
  };
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
