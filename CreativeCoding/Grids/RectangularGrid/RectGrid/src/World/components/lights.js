import { DirectionalLight, HemisphereLight } from "three";

function createLights() {
  const mainLight = new DirectionalLight("pink", 4);
  //const ambientLight = new AmbientLight("white", 2);
  const ambientLight = new HemisphereLight("white", "blueviolet", 2);
  //bydefault light.position, light.target.position point towards (0,0,0);
  mainLight.position.set(10, 10, 10);
  return { mainLight, ambientLight };
}

export { createLights };
