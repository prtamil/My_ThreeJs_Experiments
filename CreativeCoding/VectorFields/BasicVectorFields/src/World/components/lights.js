import { DirectionalLight, HemisphereLight } from "three";

function createLights() {
  const mainLight = new DirectionalLight("white", 3);
  const ambientLight = new HemisphereLight("white", "#1e1b4b", 1.5);
  mainLight.position.set(10, 10, 10);
  return { mainLight, ambientLight };
}

export { createLights };
