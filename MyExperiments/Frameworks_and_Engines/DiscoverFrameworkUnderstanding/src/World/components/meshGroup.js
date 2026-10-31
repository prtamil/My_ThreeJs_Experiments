import {
  SphereGeometry,
  BoxGeometry,
  TorusKnotGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MaxEquation,
  Vector2,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();
  let hdir = 1;
  let vdir = 1;
  const geometry = new SphereGeometry(0.25, 16, 16);
  const material = new MeshStandardMaterial({
    color: "indigo",
    flatShading: true,
  });

  const sphere = new Mesh(geometry, material);
  const vsphere = new Mesh(geometry, material);
  mainGroup.add(vsphere);
  mainGroup.add(sphere);
  mainGroup.tick = (delta) => {
    if (sphere.position.x > 2.0 || sphere.position.x < -2.0) {
      hdir *= -1;
    }
    if (vsphere.position.y > 2.0 || vsphere.position.y < -2.0) {
      vdir *= -1;
    }
    sphere.position.x += 0.05 * hdir;
    vsphere.position.y += 0.08 * vdir;
  };
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
