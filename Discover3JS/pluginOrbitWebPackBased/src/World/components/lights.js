import { DirectionalLight } from "three";

function createLights() {
  const color = "white";
  const intensity = 8;
  const light = new DirectionalLight(color, intensity);

  //bydefault light.position, light.target.position point towards (0,0,0);
  light.position.set(10, 10, 10);
  return light;
}

export { createLights };
