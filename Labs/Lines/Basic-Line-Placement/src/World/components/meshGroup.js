import {
  Group,
  Line,
  LineBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";
/* Learned things
1. Line
2. LineSegments
3. Line insted of Mesh 
4. local ccordinates are in setAttribute give line ends.  line.position.set is translation world coordinatees
   both are not same. position.set sets origin setAttribute sets line pointA and B
*/
function getPositionsFromRowColIndex(noOfRows, noOfCols) {
  const centerX = (noOfCols - 1) / 2.0;
  const centerY = (noOfRows - 1) / 2.0;
  const positions = [];
  for (let row = 0; row < noOfRows; row++) {
    for (let column = 0; column < noOfCols; column++) {
      // One line center per grid cell, in mainGroup coordinates.
      positions.push({
        x: column - centerX,
        y: row - centerY,
        z: 0,
      });
    }
  }
  return positions;
}
function createMeshGroup() {
  const mainGroup = new Group();
  const lineLength = 0.5;
  const gridPositions = getPositionsFromRowColIndex(10, 10);
  const lineGeo = new BufferGeometry();
  const lineMat = new LineBasicMaterial({ color: "red" });
  const halfLength = lineLength / 2.0;
  // Local endpoints: the line's center is (0, 0, 0).
  const localEndpoints = [
    -halfLength,
    -halfLength,
    0,
    halfLength,
    halfLength,
    0,
  ]; //This is local coordinate system it gives 2 points for line in local coordinates
  lineGeo.setAttribute(
    "position",
    new Float32BufferAttribute(localEndpoints, 3),
  );

  const lines = [];

  for (const gridPosition of gridPositions) {
    const line = new Line(lineGeo, lineMat);
    // Translate the whole line to its grid center.
    // this is global coordinates we set global pos here where it applied with local coord and transfer to both points of a line
    // Before rotation: endpoint in mainGroup = local endpoint + gridPosition.
    line.position.set(gridPosition.x, gridPosition.y, gridPosition.z);
    lines.push(line);
    mainGroup.add(line);
  }
  mainGroup.tick = (delta) => {
    // mainGroup.rotation.x += 0.15 * delta;
    //  mainGroup.rotation.y += 0.3 * delta;
    for (const line of lines) {
      let rand = Math.random() * Math.PI * 2;
      line.rotation.z += (rand * delta) / Math.random();
    }
  };
  mainGroup.dispose = () => {
    lineGeo.dispose();
    lineMat.dispose();
  };
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
