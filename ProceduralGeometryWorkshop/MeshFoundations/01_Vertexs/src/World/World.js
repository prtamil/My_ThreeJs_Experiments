import { createCamera } from "./components/camera.js";
import { createLights } from "./components/lights.js";
import { createMeshGroup } from "./components/meshGroup.js";
import { createScene } from "./components/scene.js";
import { createControls } from "./systems/controls.js";
import { IMGui } from "./systems/imgui.js";
import { Loop } from "./systems/Loop.js";
import { createRenderer } from "./systems/renderer.js";
import { Resizer } from "./systems/Resizer.js";
import { createStats } from "./systems/stats.js";

class World {
  constructor(container) {
    if (!container) {
      throw new Error("World requires a valid container element.");
    }

    this.container = container;
    this.camera = createCamera();
    this.scene = createScene();
    this.renderer = createRenderer();
    this.loop = new Loop(this.camera, this.scene, this.renderer);
    this.stats = createStats();
    this.controls = createControls(this.camera, this.renderer.domElement);
    this.disposed = false;

    container.append(this.stats.dom, this.renderer.domElement);

    const { mainLight, ambientLight } = createLights();
    this.meshGroup = createMeshGroup();

    this.controls.target.copy(this.meshGroup.position);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.update();

    this.scene.add(this.meshGroup, mainLight, ambientLight);

    this.loop.updatables.push(this.meshGroup, this.controls, this.stats);

    this.gui = new IMGui(this.camera, this.controls, this.meshGroup);
    this.resizer = new Resizer(container, this.camera, this.renderer);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  start() {
    if (this.disposed) {
      throw new Error("Cannot start a disposed World.");
    }

    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }

  dispose() {
    if (this.disposed) return;

    this.loop.dispose();
    this.resizer.dispose();
    this.controls.dispose();
    this.gui.dispose();
    this.meshGroup.dispose();
    this.renderer.dispose();

    this.scene.clear();
    this.stats.dom.remove();
    this.renderer.domElement.remove();
    this.disposed = true;
  }
}

export { World };
