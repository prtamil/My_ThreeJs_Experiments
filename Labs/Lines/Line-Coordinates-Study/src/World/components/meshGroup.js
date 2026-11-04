import {
  SphereGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Float32BufferAttribute,
  BufferGeometry,
  LineBasicMaterial,
  Line,
} from "three";
import { SimplexNoise } from "three/examples/jsm/Addons.js";

function getWorldPosFromIndex(noOfCols, noOfRows, lineLength) {
  const worldPositions = [];
  let CenterX = (noOfCols - 1) / 2.0;
  let CenterY = (noOfRows - 1) / 2.0;
  for (let i = 0; i < noOfCols; i++) {
    for (let j = 0; j < noOfRows; j++) {
      let x = i - CenterX;
      let y = j - CenterY;
      worldPositions.push({ x, y, z: 0 });
    }
  }
  return worldPositions;
}

function createMeshGroup() {
  const mainGroup = new Group();
  const simplex = new SimplexNoise();
  const lineLength = 0.5;
  const halfLineLength = lineLength / 2.0;
  const noOfCols = 10;
  const noOfRows = 10;
  let worldPositions = [];
  const lineAttribute = new Float32BufferAttribute(
    [-halfLineLength, -halfLineLength, 0, halfLineLength, halfLineLength, 0],
    3,
  );
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute("position", lineAttribute);
  const lineMat = new LineBasicMaterial({ color: "red" });
  const lines = [];
  const angles = [];
  const timeFactor = [];
  let CenterX = (noOfCols - 1) / 2.0;
  let CenterY = (noOfRows - 1) / 2.0;
  worldPositions = getWorldPosFromIndex(noOfCols, noOfCols, lineLength);

  for (let pos of worldPositions) {
    let noise = simplex.noise(pos.x, pos.y);
    angles.push(Math.PI * noise);
    timeFactor.push(noise * 10.0);

    const line = new Line(lineGeo, lineMat);
    line.position.set(pos.x, pos.y, pos.z);
    lines.push(line);

    mainGroup.add(line);
  }

  mainGroup.tick = (delta) => {
    //
    for (let i = 0; i < lines.length; i++) {
      lines[i].rotation.z += angles[i] * timeFactor[i] * delta;
    }
  };
  mainGroup.dispose = () => {
    lineMat.dispose();
    lineGeo.dispose();
  };
  // mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
