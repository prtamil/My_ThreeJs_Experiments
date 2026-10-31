import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function createControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);

  controls.tick = (delta) => controls.update(delta);
  return controls;
}

export { createControls };
