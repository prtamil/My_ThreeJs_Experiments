import {
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Points,
  PointsMaterial,
  Vector2,
} from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";

function createMeshGroup() {
  const mainGroup = new Group();
  const rows = 40;
  const columns = 40;
  const spacing = 0.4;
  const lineLength = spacing * 2.7;
  const animationSpeed = 0.5;
  const spatialScale = 0.25;
  let time = 0;
  const field = [];
  const pointPositions = [];
  const linePositions = [];
  const simplex = new SimplexNoise();

  // Nearby cells get similar angles, and time moves the pattern smoothly.
  function getAngle(x, y) {
    return (
      (Math.sin(x * spatialScale + time) + Math.cos(y * spatialScale + time)) *
      Math.PI
    );
  }
  function getNoiseAngle(x, y) {
    const value = simplex.noise3d(x * spatialScale, y * spatialScale, time);

    // Noise is approximately -1 to 1.
    // Convert it to 0 to 1, then to an angle in radians.
    return ((value + 1) / 2) * Math.PI * 2;
  }

  for (let y = 0; y < rows; y++) {
    field[y] = [];
    for (let x = 0; x < columns; x++) {
      const angle = getAngle(x, y);
      const vector = new Vector2(Math.cos(angle), Math.sin(angle));
      field[y][x] = vector;

      // Center the grid in the XY plane. Points mark each vector's origin.
      const px = (x - (columns - 1) / 2) * spacing;
      const py = (y - (rows - 1) / 2) * spacing;
      pointPositions.push(px, py, 0);

      // Each pair of positions draws one line: start, then end.
      linePositions.push(
        px,
        py,
        0,
        px + vector.x * lineLength,
        py + vector.y * lineLength,
        0,
      );
    }
  }

  const pointGeometry = new BufferGeometry();
  pointGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(pointPositions, 3),
  );
  const pointMaterial = new PointsMaterial({ color: "black", size: 0.06 });

  const lineGeometry = new BufferGeometry();
  lineGeometry.setAttribute(
    "position",
    new Float32BufferAttribute(linePositions, 3),
  );
  const positions = lineGeometry.getAttribute("position");
  positions.setUsage(DynamicDrawUsage);
  const lineMaterial = new LineBasicMaterial({ color: "red" });

  mainGroup.add(
    new Points(pointGeometry, pointMaterial),
    new LineSegments(lineGeometry, lineMaterial),
  );
  mainGroup.userData.field = field;
  mainGroup.tick = (delta) => {
    time += delta * animationSpeed;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const angle = getAngle(x, y);
        const vector = field[y][x];
        vector.set(Math.cos(angle), Math.sin(angle));

        // Each line has two vertices. Keep its start and move only its end.
        const start = (y * columns + x) * 2;
        positions.setXY(
          start + 1,
          positions.getX(start) + vector.x * lineLength,
          positions.getY(start) + vector.y * lineLength,
        );
      }
    }

    // Upload the changed positions to the GPU before the next render.
    positions.needsUpdate = true;
    lineGeometry.computeBoundingSphere();
  };
  mainGroup.dispose = () => {
    pointGeometry.dispose();
    pointMaterial.dispose();
    lineGeometry.dispose();
    lineMaterial.dispose();
  };
  return mainGroup;
}

export { createMeshGroup };
