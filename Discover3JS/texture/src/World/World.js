import { createCamera } from "./components/camera.js";
import { createCube } from "./components/cube.js";
import { createScene } from "./components/scene.js";
import { createLights } from "./components/lights.js";

import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";
import { Loop } from "./systems/Loop.js";

//Module scoped Variables
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

    const cube = createCube();

    const light = createLights();

    loop.updatables.push(cube);
    loop.updatables.push(camera);

    scene.add(cube, light);

    //Resizer updated camera/renderer
    const resizer = new Resizer(container, camera, renderer);
    //Remove Resize So that GameLoop takes care
    scene.updateMatrix();
    //console.log(scene.toJSON());
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
