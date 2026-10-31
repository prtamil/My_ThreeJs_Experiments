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

function createMeshGroup() {
  const mainGroup = new Group();
  const sgroup = new Group();
  const cgroup = new Group();

  const cCoreGroup = new Group();
  const cOuterRingGroup = new Group();
  const cOuter2RingGroup = new Group();

  const sCoreGroup = new Group();
  const sOuterRingGroup = new Group();
  const sOuter2RingGroup = new Group();

  const geometry = new SphereBufferGeometry(0.25, 16, 16);
  const material = new MeshStandardMaterial({
    color: "indigo",
    flatShading: true,
  });

  const protoSphere = new Mesh(geometry, material);
  sCoreGroup.add(protoSphere);

  for (let i = 0; i < 1; i += 0.05) {
    const obj = protoSphere.clone();
    obj.position.x = Math.sin(2 * Math.PI * i);
    obj.position.y = Math.cos(2 * Math.PI * i);
    obj.scale.multiplyScalar(0.2);
    sOuterRingGroup.add(obj);
  }
  const outer2gMaterial = new MeshStandardMaterial({
    color: "dodgerblue",
    flatShading: true,
  });
  for (let i = 0; i < 1; i += 0.05) {
    const obj = protoSphere.clone();
    obj.material = outer2gMaterial;
    obj.position.x = Math.sin(2 * Math.PI * i);
    obj.position.y = Math.cos(2 * Math.PI * i);
    obj.scale.multiplyScalar(0.2);
    sOuter2RingGroup.add(obj);
  }

  protoSphere.material = new MeshStandardMaterial({
    color: "violet",
    flatShading: true,
  });

  const torousGeo = new TorusKnotBufferGeometry(0.5, 0.1, 64, 8);
  const torous = new Mesh(torousGeo, material);
  torous.scale.multiplyScalar(0.3);
  cCoreGroup.add(torous);

  const box = new Mesh(new BoxBufferGeometry(2, 2, 2), material);
  box.scale.multiplyScalar(0.4);

  for (let i = 0; i < 1; i += 0.05) {
    const obj = box.clone();
    obj.material = outer2gMaterial.clone();
    obj.position.x = Math.sin(2 * Math.PI * i);
    obj.position.y = Math.cos(2 * Math.PI * i);
    obj.scale.multiplyScalar(0.1);
    cOuterRingGroup.add(obj);
  }

  for (let i = 0; i < 1; i += 0.05) {
    const obj = box.clone();
    obj.position.x = Math.sin(2 * Math.PI * i);
    obj.position.y = Math.cos(2 * Math.PI * i);
    obj.scale.multiplyScalar(0.1);
    cOuter2RingGroup.add(obj);
  }
  const radiansPerSecond = MathUtils.degToRad(60);

  sgroup.add(sCoreGroup);
  sgroup.add(sOuterRingGroup);
  sgroup.add(sOuter2RingGroup);

  cgroup.add(cCoreGroup);
  cgroup.add(cOuter2RingGroup);
  cgroup.add(cOuterRingGroup);

  mainGroup.add(sgroup);
  mainGroup.add(cgroup);

  sgroup.position.set(-1, 0, 0);
  cgroup.position.set(1, 0, 0);
  mainGroup.tick = (delta) => {
    sCoreGroup.rotation.z += delta * radiansPerSecond;
    sOuterRingGroup.rotation.z -= delta * radiansPerSecond;
    sOuter2RingGroup.rotation.z += delta * radiansPerSecond;

    cCoreGroup.rotation.z -= delta * radiansPerSecond;
    cOuter2RingGroup.rotation.z += delta * radiansPerSecond;
    cOuterRingGroup.rotation.z -= delta * radiansPerSecond;
  };
  mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
