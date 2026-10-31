import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  MODEL,
  SIM,
  THEMES,
} from "../components/barkley-spiral/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.barkleySpiral = object.userData.barkleySpiral;

    if (!this.barkleySpiral) {
      throw new Error("IMGui requires a Barkley spiral mesh group.");
    }

    this.simulation = this.barkleySpiral.simulation;
    this.gui = new GUI({ title: "Barkley Spiral Controls" });
    this.actions = {
      reseed: () => this.simulation.reset(),
      restoreModel: () => {
        this.simulation.a = MODEL.a;
        this.simulation.b = MODEL.b;
        this.simulation.epsilon = MODEL.epsilon;
        this.simulation.diffusion = MODEL.diffusion;
        this.simulation.reset();
      },
    };

    const simulationFolder = this.gui.addFolder("Simulation");
    simulationFolder
      .add(
        this.simulation,
        "substeps",
        SIM.minSubsteps,
        SIM.maxSubsteps,
        1,
      )
      .name("Speed")
      .onChange((value) => this.simulation.setSubsteps(value))
      .listen();
    simulationFolder
      .add(
        this.simulation,
        "theme",
        indexedOptions(THEMES.map((theme) => theme.name)),
      )
      .name("Theme")
      .onChange((value) => this.simulation.setTheme(value))
      .listen();
    simulationFolder.add(this.simulation, "paused").name("Paused").listen();
    simulationFolder.add(this.simulation, "showGlyphs").name("ASCII glyphs");
    simulationFolder.add(this.actions, "reseed").name("Reseed spiral");

    const modelFolder = this.gui.addFolder("Barkley model");
    modelFolder.add(this.simulation, "a", 0.4, 1.2, 0.01).name("Excitation a");
    modelFolder.add(this.simulation, "b", 0, 0.15, 0.001).name("Threshold b");
    modelFolder
      .add(this.simulation, "epsilon", 0.005, 0.08, 0.001)
      .name("Timescale epsilon");
    modelFolder
      .add(this.simulation, "diffusion", 0.2, 3, 0.05)
      .name("Diffusion");
    modelFolder.add(this.actions, "restoreModel").name("Restore defaults");

    const viewFolder = this.gui.addFolder("View");
    viewFolder
      .add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance")
      .onChange(() => this.controls.update());

    simulationFolder.open();
    modelFolder.close();
    viewFolder.close();
  }

  dispose() {
    this.gui.destroy();
  }
}

export { IMGui };
