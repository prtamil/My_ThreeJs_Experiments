import {
  SphereGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const geometry = new SphereGeometry(0.25, 16, 16);
  const materials = [
    new MeshStandardMaterial({
      color: "indigo",
      flatShading: true,
    }),
    new MeshStandardMaterial({
      color: "green",
      flatShading: true,
    }),
    new MeshStandardMaterial({
      color: "yellow",
      flatShading: true,
    }),
    new MeshStandardMaterial({
      color: "pink",
      flatShading: true,
    }),
    new MeshStandardMaterial({
      color: "red",
      flatShading: true,
    }),
  ];

  // Grid settings
  const gridSize = 5;
  const spacing = 2;
  const offset = ((gridSize - 1) * spacing) / 2; // To center the grid at origin

  // Create 5x5x5 cubes
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        const sphere = new Mesh(geometry, materials[z]);
        // Position each cube
        sphere.position.set(
          x * spacing - offset,
          y * spacing - offset,
          z * spacing - offset
        );

        mainGroup.add(sphere);
      }
    }
  }
  mainGroup.tick = (delta) => {
    mainGroup.rotation.y += 0.3 * delta;
  };
  //  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
