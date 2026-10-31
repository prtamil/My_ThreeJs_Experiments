import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "../components/gray-scott/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.grayScott = object.userData.grayScott;

    if (!this.grayScott) {
      throw new Error("IMGui requires a Gray-Scott mesh group.");
    }

    this.simulation = this.grayScott.simulation;
    this.gui = new GUI({ title: "Gray-Scott Reaction-Diffusion" });
    this.actions = {
      previousPattern: () => this.simulation.cyclePattern(-1),
      nextPattern: () => this.simulation.cyclePattern(1),
      reset: () => this.simulation.reset(),
    };

    const patternFolder = this.gui.addFolder("Pattern");
    patternFolder
      .add(this.simulation, "pattern", indexedOptions(PATTERN_NAMES))
      .name("Preset")
      .onChange((value) => this.simulation.setPattern(value))
      .listen();
    patternFolder.add(this.actions, "previousPattern").name("Previous (P)");
    patternFolder.add(this.actions, "nextPattern").name("Next (N)");

    const simulationFolder = this.gui.addFolder("Simulation");
    simulationFolder
      .add(
        this.simulation,
        "subSteps",
        SIM.minSubSteps,
        SIM.maxSubSteps,
        1,
      )
      .name("Sub-steps")
      .onChange((value) => this.simulation.setSubSteps(value))
      .listen();
    simulationFolder
      .add(
        this.simulation,
        "tickRate",
        SIM.minTickRate,
        SIM.maxTickRate,
        SIM.tickRateStep,
      )
      .name("Tick rate")
      .onChange((value) => this.simulation.setTickRate(value))
      .listen();
    simulationFolder.add(this.simulation, "paused").name("Paused").listen();
    simulationFolder.add(this.actions, "reset").name("Reset / re-seed");

    const appearanceFolder = this.gui.addFolder("Appearance");
    appearanceFolder
      .add(
        this.simulation,
        "theme",
        indexedOptions(THEMES.map((theme) => theme.name)),
      )
      .name("Theme")
      .onChange((value) => this.simulation.setTheme(value))
      .listen();
    appearanceFolder
      .add(this.simulation, "showGlyphs")
      .name("ASCII glyphs");

    const viewFolder = this.gui.addFolder("View");
    viewFolder
      .add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance")
      .onChange(() => this.controls.update());

    patternFolder.open();
    simulationFolder.open();
    appearanceFolder.open();
    viewFolder.close();
  }

  dispose() {
    this.gui.destroy();
  }
}

export { IMGui };
