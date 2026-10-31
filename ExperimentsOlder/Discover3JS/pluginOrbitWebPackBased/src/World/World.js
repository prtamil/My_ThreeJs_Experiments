import { createCamera } from "./components/camera";
import { createCube } from "./components/cube";
import { createScene } from "./components/scene";
import { createLights } from "./components/lights";

import { createControls } from "./systems/controls";
import { createRenderer } from "./systems/renderer";
import { Resizer } from "./systems/Resizer";
import { Loop } from "./systems/Loop";

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
    const controls = createControls(camera, renderer.domElement);

    container.append(renderer.domElement);

    const cube = createCube();

    const light = createLights();

    controls.target.copy(cube.position);
    controls.enablePan = false;
    controls.enableDamping = true;

    loop.updatables.push(cube);
    loop.updatables.push(controls);
    //loop.updatables.push(camera);

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
