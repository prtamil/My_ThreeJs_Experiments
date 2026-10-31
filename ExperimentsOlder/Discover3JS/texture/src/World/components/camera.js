import {
  MathUtils,
  PerspectiveCamera,
} from "../../vendor/three/build/three.module.js";

function createCamera() {
  const camera = new PerspectiveCamera(
    35, //fov
    1, // aspect ratio (dummy value) Resizer will update actual value
    0.1, //near
    100 //far
  );

  camera.position.set(0, 0, 20);
  camera.tick = (delta) => {
    //% operator for reset
    // camera.position.z =   (camera.position.z + 40*delta) % 90;
    camera.updateProjectionMatrix();
  };

  return camera;
}

export { createCamera };
