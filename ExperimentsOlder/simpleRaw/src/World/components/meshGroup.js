import {
  RawShaderMaterial,
  BufferGeometry,
  BufferAttribute,
  Group,
  DoubleSide,
  MathUtils,
  Mesh,
  MaxEquation,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();
  const vertexShader = `#version 300 es
  in vec4 position;
  void main() {
    gl_Position = position;
  }`;
  const fragmentShader = `#version 300 es
  precision highp float;
  out vec4 outColor;
  void main() {
      outColor = vec4(1,0.5,0.5,1);
  }`;
  const material = new RawShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: DoubleSide,
    transparent: true,
  });
  const vertices = [0, 0, 0, 1, 0, 0.5, 0, 1, 0.7, 0, 0, 1];
  const geometry = new BufferGeometry();
  const positionAttribute = new BufferAttribute(new Float32Array(vertices), 4);
  geometry.setAttribute("position", positionAttribute);

  const rawWebGL2Mesh = new Mesh(geometry, material);
  console.log(material.toJSON());
  mainGroup.add(rawWebGL2Mesh);
  mainGroup.tick = (delta) => {};
  mainGroup.scale.multiplyScalar(1);
  return mainGroup;
}

export { createMeshGroup };
