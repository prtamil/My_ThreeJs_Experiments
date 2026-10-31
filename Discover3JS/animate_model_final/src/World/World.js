import { createCamera } from "./components/camera";
import { createAxesHelper, createGridHelper } from "./components/helpers";
import { createScene } from "./components/scene";
import { createLights } from "./components/lights";
import { loadBirds } from "./components/birds/birds";

import { createControls } from "./systems/controls";
import { createRenderer } from "./systems/renderer";
import { Resizer } from "./systems/Resizer";
import { Loop } from "./systems/Loop";
import { createStats } from "./systems/stats";
import { UI } from "./systems/ui";
//Module scoped Variables Design Choice
//We make it not accessible from World Object.
//these are singleton Objects.

let camera;
let renderer;
let scene;
let loop;
let controls;
let stats;
let gui;
class World {
  constructor(container) {
    //load sync items
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    loop = new Loop(camera, scene, renderer);
    stats = createStats();

    container.appendChild(stats.dom);
    container.append(renderer.domElement);

    controls = createControls(camera, renderer.domElement);

    const { mainLight, ambientLight } = createLights();

    loop.updatables.push(controls);
    loop.updatables.push(stats);
    //loop.updatables.push(camera);

    scene.add(mainLight, ambientLight);

    //Resizer updated camera/renderer
    const resizer = new Resizer(container, camera, renderer);
    //scene.add(createAxesHelper(), createGridHelper());
  }

  async init() {
    //To load assets modals
    const { parrot, flamingo, stork } = await loadBirds();
    controls.target.copy(parrot.position);

    loop.updatables.push(parrot, flamingo, stork);
    scene.add(parrot, flamingo, stork);
    let birds = [];
    birds.push(parrot, flamingo, stork);
    //Create GUI after loading Assets
    gui = new UI(camera, controls, birds);
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
