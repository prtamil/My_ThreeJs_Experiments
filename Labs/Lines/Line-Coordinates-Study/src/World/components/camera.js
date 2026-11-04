import { PerspectiveCamera } from "three";

function createCamera() {
  const camera = new PerspectiveCamera(
    35, //fov
    1, // aspect ratio (dummy value) Resizer will update actual value
    0.1, //near
    100 //far
  );

  camera.position.set(0, 0, 15);

  // Placeholder for optional camera animation. Add the camera to the loop's
  // updatables only when this method contains active update logic.
  camera.tick = (delta) => {};

  return camera;
}

export { createCamera };
