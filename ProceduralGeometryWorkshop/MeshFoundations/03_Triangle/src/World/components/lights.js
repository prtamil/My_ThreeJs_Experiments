import { DirectionalLight, HemisphereLight } from "three";

function createLights() {
  const mainLight = new DirectionalLight("pink", 4);
  const ambientLight = new HemisphereLight("white", "blueviolet", 2);
  mainLight.position.set(10, 10, 10);
  return { mainLight, ambientLight };
}

export { createLights };
