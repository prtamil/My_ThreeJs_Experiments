import {
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
  Group,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const positions = new Float32Array([0, 0, 0, 1, 2, 0, -2, 1, 0, 3, 0, 1]);

  const geometry = new BufferGeometry();

  geometry.setAttribute("position", new BufferAttribute(positions, 3));

  const material = new PointsMaterial({
    size: 0.5,
    color: "red",
  });

  const points = new Points(geometry, material);

  mainGroup.add(points);
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
