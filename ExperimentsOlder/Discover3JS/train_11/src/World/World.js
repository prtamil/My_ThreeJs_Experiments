import { createCamera } from "./components/camera";
import { createAxesHelper, createGridHelper } from "./components/helpers";
import { createScene } from "./components/scene";
import { createLights } from "./components/lights";
import { Train } from "./components/Train/Train";

import { createControls } from "./systems/controls";
import { createRenderer } from "./systems/renderer";
import { Resizer } from "./systems/Resizer";
import { Loop } from "./systems/Loop";

//Module scoped Variables Design Choice
//We make it not accessible from World Object.
//these are singleton Objects.

let camera;
let renderer;
let scene;
let loop;
class World {
  constructor(container) {
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    loop = new Loop(camera, scene, renderer);
    container.append(renderer.domElement);

    const controls = createControls(camera, renderer.domElement);

    const { mainLight, ambientLight } = createLights();
    const train = new Train();

    loop.updatables.push(train);
    loop.updatables.push(controls);
    //loop.updatables.push(camera);

    scene.add(train, mainLight, ambientLight);

    //Resizer updated camera/renderer
    const resizer = new Resizer(container, camera, renderer);
    scene.add(createAxesHelper(), createGridHelper());
  }
  render() {
    //Use this for app with no animation
    renderer.render(scene, camera);
  }
  start() {
    //Use this for app with application
    loop.start();
  }
  stop() {
    loop.stop();
  }
}

export { World };
