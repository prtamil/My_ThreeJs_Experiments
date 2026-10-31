import {
  SphereGeometry,
  BoxGeometry,
  TorusKnotGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  MaxEquation,
  Float32BufferAttribute,
  MeshNormalMaterial,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const material = new MeshNormalMaterial({
    //wireframe: true,
  });
  let time = 0;
  const size = 2;
  const detail = 5;
  const cubeGeometry = new BoxGeometry(
    size,
    size,
    size,
    detail,
    detail,
    detail
  );

  const cubepos = cubeGeometry.attributes.position;
  const spherePos = new Float32Array(cubepos.array.length);
  const radius = 1.5;

  for (let i = 0; i < cubepos.count; i++) {
    const x = cubepos.getX(i);
    const y = cubepos.getY(i);
    const z = cubepos.getZ(i);
    const len = Math.hypot(x, y, z) || 1.0;

    // Normalize (project to sphere surface)
    spherePos[3 * i + 0] = (x / len) * radius;
    spherePos[3 * i + 1] = (y / len) * radius;
    spherePos[3 * i + 2] = (z / len) * radius;
  }

  cubeGeometry.morphAttributes.position = [
    new Float32BufferAttribute(spherePos, 3),
  ];
  console.log("Details", {
    cubeposL: cubepos.count,
  });
  //Need tp set mprphAttributes so that morphTargetInfluces get created
  //This has to be done before mesh creation. else morphTargetInfluces get undefined

  const protoCube = new Mesh(cubeGeometry, material);

  mainGroup.add(protoCube);
  mainGroup.tick = (delta) => {
    time += 0.02;
    //morphTargetInflucences is like decimal value in lerp which gives variation of lerp
    protoCube.morphTargetInfluences[0] = (Math.cos(time) + 1) / 2;
  };

  return mainGroup;
}

export { createMeshGroup };
