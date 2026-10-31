import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Group,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 0, 1, 0]);

  const geometry = new BufferGeometry();

  geometry.setAttribute("position", new BufferAttribute(positions, 3));

  const material = new MeshBasicMaterial({
    color: "red",
  });

  const tri = new Mesh(geometry, material);

  mainGroup.add(tri);
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
