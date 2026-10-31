import {
  BufferAttribute,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Group,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const geometry = new BufferGeometry();
  const positions = new Float32Array([0, 0, 0, 3, 2, 0]);

  geometry.setAttribute("position", new BufferAttribute(positions, 3));

  const material = new LineBasicMaterial({
    color: "red",
  });
  const lines = new Line(geometry, material);

  mainGroup.add(lines);
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
