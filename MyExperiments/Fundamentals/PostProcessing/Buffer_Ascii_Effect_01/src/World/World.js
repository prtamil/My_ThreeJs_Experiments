import { createCamera } from "./components/camera";
import { createMeshGroup } from "./components/meshGroup";
import { createScene } from "./components/scene";
import { createLights } from "./components/lights";

import { createControls } from "./systems/controls";
import { createRenderer } from "./systems/renderer";
import { Resizer } from "./systems/Resizer";
import { Loop } from "./systems/Loop";
import { IMGui } from "./systems/imgui";
import { createStats } from "./systems/stats";
import { createEffect } from "./systems/effects";
//Module scoped Variables Design Choice
//We make it not accessible from World Object.
//these are singleton Objects.

let camera;
let renderer;
let scene;
let loop;
let stats;
let gui;
let effect;
class World {
  constructor(container) {
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    effect = createEffect(renderer, container);

    loop = new Loop(camera, scene, renderer, effect);
    stats = createStats();
    const controls = createControls(camera, effect.domElement);

    container.appendChild(stats.dom);
    container.append(effect.domElement);
    //container.append(renderer.domElement);

    const { mainLight, ambientLight } = createLights();
    const meshGroup = createMeshGroup();

    controls.target.copy(meshGroup.position);
    controls.enablePan = false;
    controls.enableDamping = true;

    scene.add(meshGroup, mainLight, ambientLight);

    loop.updatables.push(meshGroup);
    loop.updatables.push(controls);
    loop.updatables.push(stats);
    //loop.updatables.push(camera);
    gui = new IMGui(camera, controls, meshGroup);
    //Resizer updated camera/renderer
    const resizer = new Resizer(container, camera, renderer, effect);
    //Remove Resize So that GameLoop takes care
    scene.updateMatrix();
    //console.log(scene.toJSON());
    console.log(scene);
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
