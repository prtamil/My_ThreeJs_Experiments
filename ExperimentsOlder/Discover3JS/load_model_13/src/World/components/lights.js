import { DirectionalLight, AmbientLight, HemisphereLight } from "three";

function createLights() {
  const ambientLight = new HemisphereLight("white", "darkslategrey", 3);
  const mainLight = new DirectionalLight("white", 2);
  mainLight.position.set(10, 10, 10);
  return { mainLight, ambientLight };
}

export { createLights };
