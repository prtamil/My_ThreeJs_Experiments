import {
  SphereGeometry,
  BoxGeometry,
  TorusKnotGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MaxEquation,
  PlaneGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  Line,
  PointsMaterial,
  Points,
  LineSegments,
} from "three";

function buildPlanePoints(width, height, widthSegments, heightSegments) {
  const noOfRows = heightSegments;
  const noOfCols = widthSegments;
  const rowGridSpace = height / noOfRows;
  const colGridSpace = width / noOfCols;
  const rowCenter = height / 2;
  const colCenter = width / 2;
  const vertexPerRow = noOfCols + 1;
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indexes = [];

  for (let row = 0; row <= noOfRows; row++) {
    const yPos = row * rowGridSpace - rowCenter;
    for (let col = 0; col <= noOfCols; col++) {
      const xPos = col * colGridSpace - colCenter;
      const zPos = 0;
      vertices.push(xPos, -yPos, zPos);
      normals.push(0, 0, 1);
      const u = col / noOfCols;
      const v = 1 - row / noOfRows;
      uvs.push(u, v);
    }
  }
  for (let row = 0; row < noOfRows; row++) {
    for (let col = 0; col < noOfCols; col++) {
      const br = row * vertexPerRow + col;
      const bl = row * vertexPerRow + (col + 1);
      const tr = (row + 1) * vertexPerRow + col;
      const tl = (row + 1) * vertexPerRow + (col + 1);
      indexes.push(bl, tl, br);
      indexes.push(tl, tr, br);
    }
  }
  const geo = new BufferGeometry();

  geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  //geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  //geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  //geo.setIndex(indexes);
  const material = new PointsMaterial({
    color: "green",
    size: 0.4,
  });
  return new Points(geo, material);
}
function buildPlaneLines(width, height, widthSegments, heightSegments) {
  const noOfRows = heightSegments;
  const noOfCols = widthSegments;
  const rowGridSpace = height / noOfRows;
  const colGridSpace = width / noOfCols;
  const rowCenter = height / 2;
  const colCenter = width / 2;
  const vertexPerRow = noOfCols + 1;
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indexes = [];

  for (let row = 0; row <= noOfRows; row++) {
    const yPos = row * rowGridSpace - rowCenter;
    for (let col = 0; col <= noOfCols; col++) {
      const xPos = col * colGridSpace - colCenter;
      const zPos = 0;
      vertices.push(xPos, -yPos, zPos);
      normals.push(0, 0, 1);
      const u = col / noOfCols;
      const v = 1 - row / noOfRows;
      uvs.push(u, v);
    }
  }

  // --- build line indices ---
  // We use line segments so that it has 2 pairs it can draw
  // Lines => gl.LINE_STRIP (v0->v1->v2->v3) so zig,zag not avoidable
  //LineSegment => gl.LINES (v0->v1)(v2->v3) it only expect pairs so its easier to draw square grid
  //So we draw horizontal then vertical lines

  // horizontal lines
  for (let row = 0; row <= noOfRows; row++) {
    for (let col = 0; col < noOfCols; col++) {
      const i1 = row * vertexPerRow + col;
      const i2 = row * vertexPerRow + (col + 1);
      indexes.push(i1, i2);
    }
  }

  // vertical lines
  for (let row = 0; row < noOfRows; row++) {
    for (let col = 0; col <= noOfCols; col++) {
      const i1 = row * vertexPerRow + col;
      const i2 = (row + 1) * vertexPerRow + col;
      indexes.push(i1, i2);
    }
  }
  const geo = new BufferGeometry();

  geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geo.setIndex(indexes);
  const material = new LineBasicMaterial({
    color: "red",
    linewidth: 1, // note: ignored on most systems in WebGL
    dashed: false,
  });

  // use LineSegments to draw discrete grid lines
  return new LineSegments(geo, material);
}
function buildPlaneTriangles(width, height, widthSegments, heightSegments) {
  const noOfRows = heightSegments;
  const noOfCols = widthSegments;
  const rowGridSpace = height / noOfRows;
  const colGridSpace = width / noOfCols;
  const rowCenter = height / 2;
  const colCenter = width / 2;
  const vertexPerRow = noOfCols + 1;
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indexes = [];

  for (let row = 0; row <= noOfRows; row++) {
    const yPos = row * rowGridSpace - rowCenter;
    for (let col = 0; col <= noOfCols; col++) {
      const xPos = col * colGridSpace - colCenter;
      const zPos = 0;
      vertices.push(xPos, -yPos, zPos);
      normals.push(0, 0, 1);
      const u = col / noOfCols;
      const v = 1 - row / noOfRows;
      uvs.push(u, v);
    }
  }
  for (let row = 0; row < noOfRows; row++) {
    for (let col = 0; col < noOfCols; col++) {
      const br = row * vertexPerRow + col;
      const bl = row * vertexPerRow + (col + 1);
      const tr = (row + 1) * vertexPerRow + col;
      const tl = (row + 1) * vertexPerRow + (col + 1);
      indexes.push(bl, tl, br);
      indexes.push(tl, tr, br);
    }
  }
  const geo = new BufferGeometry();

  geo.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geo.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geo.setIndex(indexes);
  const material = new MeshStandardMaterial({
    color: "indigo",
    wireframe: true,
  });
  return new Mesh(geo, material);
}
function createMeshGroup() {
  const mainGroup = new Group();

  const obj1 = buildPlaneTriangles(1, 1, 5, 5);
  const obj2 = buildPlaneLines(1, 1, 12, 12);
  const obj3 = buildPlanePoints(1, 1, 5, 6);
  obj1.position.x = -2;
  mainGroup.add(obj1);
  obj2.position.x += 0;
  mainGroup.add(obj2);
  obj3.position.x += 2;
  mainGroup.add(obj3);
  mainGroup.tick = (delta) => {};
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
