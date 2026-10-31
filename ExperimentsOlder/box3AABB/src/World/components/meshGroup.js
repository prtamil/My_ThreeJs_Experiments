import {
  SphereBufferGeometry,
  BoxBufferGeometry,
  TorusKnotBufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MaxEquation,
  Box3,
  BoxHelper,
  Vector3,
} from "three";

const radians30 = MathUtils.degToRad(180);
const radians90 = MathUtils.degToRad(2 * 360);

function createMeshGroup() {
  const mainGroup = new Group();

  const geometry = new SphereBufferGeometry(0.5, 16, 16);
  const material = new MeshStandardMaterial({
    color: "indigo",
    flatShading: true,
  });

  const centerM = new Mesh(geometry, material);
  centerM.geometry.computeBoundingBox();

  console.log(centerM.geometry.boundingBox);
  let vSize = centerM.geometry.boundingBox.getSize(new Vector3());

  const rightM = new Mesh(geometry, material);
  rightM.position.x = vSize.x;

  const topM = new Mesh(geometry, material);
  topM.position.y = vSize.y;

  const bottomM = new Mesh(geometry, material);
  bottomM.position.y = -vSize.y;

  const leftM = new Mesh(geometry, material);
  leftM.position.x = -vSize.x;

  mainGroup.add(centerM, rightM, topM, bottomM, leftM);

  mainGroup.tick = (delta) => {
    leftM.rotation.y += radians30 * delta;
    rightM.rotation.y += radians30 * delta;
    topM.rotation.x -= radians90 * delta;
    bottomM.rotation.x -= radians90 * delta;
    centerM.rotation.z += radians90 * delta;
  };
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
