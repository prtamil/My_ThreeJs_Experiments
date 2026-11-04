import {
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from "three";

// Turn a grid column and row into coordinates, with the grid centered at (0, 0).
function getCoordinatesFromColumnRowIndex({
  columnIndex,
  rowIndex,
  columnCount,
  rowCount,
  distanceBetweenPoints,
}) {
  const centerColumn = (columnCount - 1) / 2;
  const centerRow = (rowCount - 1) / 2;

  // Subtract the center to count gaps from the middle of the grid.
  const columnsFromCenter = columnIndex - centerColumn;
  const rowsFromCenter = rowIndex - centerRow;

  // Multiply by the gap length to get coordinates in world units.
  const x = columnsFromCenter * distanceBetweenPoints;
  const y = rowsFromCenter * distanceBetweenPoints;

  return { x, y };
}

// Return plain numbers: [x, y, z, x, y, z, ...].
function createGridPoints({ columnCount, rowCount, distanceBetweenPoints }) {
  const points = [];

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const { x, y } = getCoordinatesFromColumnRowIndex({
        columnIndex,
        rowIndex,
        columnCount,
        rowCount,
        distanceBetweenPoints,
      });

      points.push(x, y, 0);
    }
  }

  return points;
}

function createMeshGroup() {
  const mainGroup = new Group();
  const positions = createGridPoints({
    columnCount: 10,
    rowCount: 10,
    distanceBetweenPoints: 0.5,
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const pointObj = new Points(
    geometry,
    new PointsMaterial({ color: "red", size: 0.5 }),
  );
  mainGroup.add(pointObj);
  mainGroup.tick = (delta) => {
    //mainGroup.rotation.x += 0.15 * delta;
    //mainGroup.rotation.y += 0.3 * delta;
  };
  mainGroup.dispose = () => {
    geometry.dispose();
    pointObj.material.dispose();
  };
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
