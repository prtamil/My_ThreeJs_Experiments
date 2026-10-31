import { DirectionalLight, HemisphereLight } from "three";
function createLights() {
  const mainLight = new DirectionalLight("white", 2);
  const ambientLight = new HemisphereLight("white", "#111827", 1);
  mainLight.position.set(10, 10, 10);
  return { mainLight, ambientLight };
}
export { createLights };
