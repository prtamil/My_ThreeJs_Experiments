import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  GLYPH_STYLES,
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "../components/flow-fields/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.flowField = object.userData.flowField;

    if (!this.flowField) {
      throw new Error("IMGui requires a flow-field enabled mesh group.");
    }

    this.simulation = this.flowField.simulation;
    this.gui = new GUI({ title: "Flow Field Controls" });
    this.actions = {
      reset: () => this.simulation.reset(),
    };

    const flowFolder = this.gui.addFolder("Simulation");
    flowFolder
      .add(this.simulation, "pattern", indexedOptions(PATTERN_NAMES))
      .name("Pattern")
      .onChange((value) => this.simulation.setPattern(value))
      .listen();
    flowFolder
      .add(
        this.simulation,
        "theme",
        indexedOptions(THEMES.map((theme) => theme.name)),
      )
      .name("Theme")
      .listen();
    flowFolder
      .add(
        this.simulation,
        "glyphStyle",
        indexedOptions(GLYPH_STYLES),
      )
      .name("Particle style")
      .listen();
    flowFolder
      .add(this.simulation, "speed", {
        "1 cell/s": 1,
        "2 cells/s": 2,
        "4 cells/s": 4,
        "8 cells/s": 8,
        "16 cells/s": 16,
        "32 cells/s": 32,
        "64 cells/s": 64,
      })
      .name("Speed")
      .listen();
    flowFolder
      .add(this.simulation, "simFps", SIM.fpsMin, SIM.fpsMax, SIM.fpsStep)
      .name("Simulation Hz")
      .listen();
    flowFolder.add(this.simulation, "paused").name("Paused").listen();
    flowFolder.add(this.actions, "reset").name("Reset particles");

    const viewFolder = this.gui.addFolder("View");
    viewFolder
      .add(this.camera.position, "z", 1, 30, 0.2)
      .name("Camera distance")
      .onChange((value) => {
        this.camera.position.z = value;
        this.controls.update();
      });

    flowFolder.open();
    viewFolder.close();
  }

  dispose() {
    this.gui.destroy();
  }
}

export { IMGui };
