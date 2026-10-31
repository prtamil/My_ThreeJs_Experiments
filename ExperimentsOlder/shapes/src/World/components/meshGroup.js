import { Color, DynamicDrawUsage, RGBA_ASTC_12x10_Format } from "three";
import { Points } from "three";
import { Float32BufferAttribute } from "three";
import {
  SphereBufferGeometry,
  BoxBufferGeometry,
  TorusKnotBufferGeometry,
  BufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MaxEquation,
  Box3,
  BoxHelper,
  Vector3,
  Path,
  Shape,
  Line,
  PointsMaterial,
  LineBasicMaterial,
  LineSegments,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const material = new LineBasicMaterial({
    color: 0x0000ff,
  });

  const LineCnt = 300;
  const points = [];
  for (let i = 0; i < LineCnt; i++) {
    points.push(
      new Vector3(Math.random() * 2, Math.random() * 3, Math.random() * 4)
    );
  }

  const geometry = new BufferGeometry().setFromPoints(points);
  const obj = new Line(geometry, material);
  mainGroup.add(obj);

  mainGroup.tick = (delta) => {};
  mainGroup.position.x = 0.5;
  return mainGroup;
}

export { createMeshGroup };
