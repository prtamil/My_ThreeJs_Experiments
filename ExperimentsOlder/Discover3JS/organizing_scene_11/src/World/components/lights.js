import { DirectionalLight, AmbientLight, HemisphereLight } from "three";

function createLights() {
  const color = "white";
  const intensity = 8;
  const mainLight = new DirectionalLight(color, intensity);
  //const ambientLight = new AmbientLight("white", 2);
  const ambientLight = new HemisphereLight("white", "indigo", 2);
  //bydefault light.position, light.target.position point towards (0,0,0);
  mainLight.position.set(10, 10, 10);
  return { mainLight, ambientLight };
}

export { createLights };
