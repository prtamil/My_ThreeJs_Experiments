import {
  BoxBufferGeometry,
  Mesh,
  MeshStandardMaterial,
  MathUtils,
  TextureLoader,
} from "three";
const radiansPerSecond = MathUtils.degToRad(60);

function createMaterial() {
  const textureLoader = new TextureLoader();
  const texture = textureLoader.load("/assets/textures/uv_grid_opengl.jpg");
  //console.log("TEXTURE ", texture);
  const materialSpec = {
    map: texture,
    color: "red",
  };
  const material = new MeshStandardMaterial(materialSpec);
  return material;
}

function createCube() {
  const geometry = new BoxBufferGeometry(2, 2, 2);

  const material = createMaterial();
  const cube = new Mesh(geometry, material);

  cube.rotation.set(-0.5, -0.1, 0.8);

  //Monkey Patching Tick Method to Mesh
  cube.tick = (delta) => {
    //Not depend on delta
    //depends on how fast tick is called
    //varies from system to system
    //Hard to define
    //cube.rotation.z += 0.01
    //Now based on delta, delta is unique across
    //system.even if we skip delta next delta corrects it
    cube.rotation.z += radiansPerSecond * delta;
    cube.rotation.x += radiansPerSecond * delta;
    cube.rotation.y += radiansPerSecond * delta;
  };

  return cube;
}

export { createCube };
