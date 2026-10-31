import {
  SphereBufferGeometry,
  BoxBufferGeometry,
  TetrahedronBufferGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
} from "three";

function createMeshGroup() {
  const group = new Group();
  const geometry = new SphereBufferGeometry(0.25, 16, 16);
  const material = new MeshStandardMaterial({
    color: "indigo",
  });

  const protoSphere = new Mesh(geometry, material);
  group.add(protoSphere);

  let colorArr = ["red", "cyan", "indigo", "green", "cornflowerblue"];
  let geometries = [
    new BoxBufferGeometry(0.2, 0.2, 0.2),
    new TetrahedronBufferGeometry(0.5, 2),
    new SphereBufferGeometry(0.5, 16, 16),
  ];

  for (let i = 0, clrIdx = 0; i < 1; i += 0.04, clrIdx++) {
    const obj = protoSphere.clone(); //protoSphere.clone();
    //assign new materual //else material and geometr will be shared for akk
    obj.material = new MeshStandardMaterial({
      color: colorArr[clrIdx % colorArr.length],
      flatShading: true,
    });
    obj.geometry = geometries[clrIdx % geometries.length];
    obj.position.x = Math.cos(2 * Math.PI * i);
    obj.position.y = Math.sin(2 * Math.PI * i);
    obj.scale.multiplyScalar(0.2);
    group.add(obj);
  }
  protoSphere.material = new MeshStandardMaterial({ color: "violet" });
  const radiansPerSecond = MathUtils.degToRad(30);
  group.tick = (delta) => {
    group.rotation.z -= delta * radiansPerSecond;
  };
  group.scale.multiplyScalar(2);
  return group;
}

export { createMeshGroup };
