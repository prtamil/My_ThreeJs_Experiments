import {
  Group,
  Mesh,
  MeshStandardMaterial,
  BufferGeometry,
  BufferAttribute,
  DynamicReadUsage,
  DynamicDrawUsage,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const geometry = new BufferGeometry();
  const vertices = new Float32Array([
    -1.0,
    -1.0,
    1.0, // v0
    1.0,
    -1.0,
    1.0, // v1
    1.0,
    1.0,
    1.0, // v2
    -1.0,
    1.0,
    1.0, // v3
  ]);

  const indices = [0, 1, 2, 2, 3, 0];
  geometry.setIndex(indices);
  geometry.setAttribute(
    "position",
    new BufferAttribute(vertices, 3).setUsage(DynamicDrawUsage)
  );
  const material = new MeshStandardMaterial({
    color: "indigo",
    flatShading: true,
  });

  const mygeo = new Mesh(geometry, material);
  const geoarr = geometry.attributes.position.array;
  const vertexCnt = geoarr.length / 3;

  mainGroup.add(mygeo);
  let t = 0;
  mainGroup.tick = (delta) => {
    t += 0.02;
    for (let i = 0; i < vertexCnt; i++) {
      const ix = i * 3;
      const x = geoarr[ix + 0];
      const y = geoarr[ix + 1];
      const z = geoarr[ix + 2];
      const wave = Math.sin(t + x * 2 + y * 2) * 0.2;
      geoarr[ix + 2] = 1.0 + wave;
    }
    geometry.attributes.position.needsUpdate = true;
  };
  return mainGroup;
}

export { createMeshGroup };
