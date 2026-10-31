import {
  BufferAttribute,
  Float32BufferAttribute,
  Uint8BufferAttribute,
  BufferGeometry,
  Group,
  MathUtils,
  Mesh,
  RawShaderMaterial,
  MeshStandardMaterial,
  MaxEquation,
  DoubleSide,
} from "three";

function createMeshGroup() {
  const mainGroup = new Group();

  const vertexShader = `
  precision mediump float;
  precision mediump int;

  uniform mat4 modelViewMatrix; // optional
  uniform mat4 projectionMatrix; // optional

  attribute vec3 position;
  attribute vec4 color;

  varying vec3 vPosition;
  varying vec4 vColor;

  void main()	{

    vPosition = position;
    vColor = color;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

  }

  `;

  const fragmentShader = `	
  precision mediump float;
  precision mediump int;

  uniform float time;

  varying vec3 vPosition;
  varying vec4 vColor;

  void main()	{

    vec4 color = vec4( vColor );
    color.r += sin( vPosition.x * 10.0 + time ) * 0.5;

    gl_FragColor = color;

  }
  `;

  const geometry = new BufferGeometry();

  const vertexCount = 50 * 3;
  const positions = [];
  const colors = [];
  for (let i = 0; i < vertexCount; i++) {
    // adding x,y,z
    positions.push(Math.random() - 0.5);
    positions.push(Math.random() - 0.5);
    positions.push(Math.random() - 0.5);
    // adding r,g,b,a
    colors.push(Math.random() * 255);
    colors.push(Math.random() * 255);
    colors.push(Math.random() * 255);
    colors.push(Math.random() * 255);
  }

  const positionAttribute = new Float32BufferAttribute(positions, 3);
  const colorAttribute = new Uint8BufferAttribute(colors, 4);
  colorAttribute.normalized = true; // this will map the buffer values to 0.0f - +1.0f in the shader

  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("color", colorAttribute);

  const material = new RawShaderMaterial({
    uniforms: {
      time: { value: 1.0 },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: DoubleSide,
    transparent: true,
  });
  const rawGeom = new Mesh(geometry, material);
  rawGeom.scale.multiplyScalar(0.5);

  //Create Grid of 5x5 rawGeom.

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const rT = rawGeom.clone();
      rT.position.x += i * 0.75;
      rT.position.y += j * 0.75;
      mainGroup.add(rT);
    }
  }
  /*const rawGeom1 = rawGeom.clone();
  rawGeom1.position.x = 1;
  mainGroup.add(rawGeom); */

  mainGroup.tick = (delta) => {
    rawGeom.rotation.y += delta * 0.05;
    rawGeom.material.uniforms.time.value += delta * 10.0;
  };
  //mainGroup.scale.multiplyScalar(2);
  return mainGroup;
}

export { createMeshGroup };
