import { BufferAttribute } from "three";
import { Points } from "three";
import { ZeroSlopeEnding } from "three";
import { Line } from "three";
import { PointsMaterial } from "three";
import { LineBasicMaterial } from "three";
import { BufferGeometry } from "three";
import {
  SphereBufferGeometry,
  BoxBufferGeometry,
  TorusKnotBufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MaxEquation,
} from "three";
//Create PointCloud
const MAX_POINTS = 140;
const TAU = 6.283185307179586;
const rad30 = MathUtils.degToRad(30);
function createMeshGroup() {
  const mainGroup = new Group();

  let geometry = new BufferGeometry();
  let positions = new Float32Array(MAX_POINTS * 3);
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  const material = new PointsMaterial({ color: "blue", size: 0.25 });

  let pointCloud = new Points(geometry, material);
  mainGroup.add(pointCloud);

  let sphere = new Mesh(
    new SphereBufferGeometry(0.5, 10, 10),
    new MeshStandardMaterial({ color: "blue", flatShading: true })
  );
  sphere.position.x = 0;
  mainGroup.add(sphere);
  let ang = 0.0;
  mainGroup.tick = (delta) => {
    let positions = pointCloud.geometry.attributes.position.array;
    let idx = 0;
    for (let i = 0; i < MAX_POINTS; i++) {
      //let x = (Math.random() - 0.5) * 2.0;
      //let y = (Math.random() - 0.5) * 2.0;
      //let z = (Math.random() - 0.5) * 2.0;
      let angle = (TAU / (Math.random() - 0.5)) % TAU;
      let x = Math.sin(angle) * 1.0;
      let y = Math.cos(angle) * 1;
      let z = Math.tanh(angle) * 1.0;

      positions[idx++] = x;
      positions[idx++] = y;
      positions[idx++] = z;
      pointCloud.geometry.computeBoundingSphere();
      pointCloud.geometry.computeBoundingBox();
    }
    pointCloud.geometry.attributes.position.needsUpdate = true;
    ang = (ang + 0.2) % TAU;

    sphere.position.x += (Math.sin(ang) * delta * 6) % 14.2;
    sphere.position.y += (Math.cos(ang) * delta * 6) % 14.2;
  };

  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
