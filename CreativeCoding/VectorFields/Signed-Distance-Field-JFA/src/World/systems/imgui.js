import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  PATTERN_NAMES,
  PATTERN_TIERS,
  SIM,
  THEMES,
} from "../components/sdf-jfa/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.sdfJfa = object.userData.sdfJfa;

    if (!this.sdfJfa) {
      throw new Error("IMGui requires an SDF/JFA mesh group.");
    }

    this.simulation = this.sdfJfa.simulation;
    this.gui = new GUI({ title: "SDF / Jump Flood" });
    this.actions = {
      previousPattern: () => this.simulation.cyclePattern(-1),
      nextPattern: () => this.simulation.cyclePattern(1),
      scatterSeeds: () => this.simulation.reset(),
    };

    const patternOptions = PATTERN_NAMES.map(
      (name, index) => `${PATTERN_TIERS[index]} / ${name}`,
    );
    const patternFolder = this.gui.addFolder("Pattern");
    patternFolder
      .add(this.simulation, "pattern", indexedOptions(patternOptions))
      .name("Pattern")
      .onChange((value) => this.simulation.setPattern(value))
      .listen();
    patternFolder.add(this.actions, "previousPattern").name("Previous (P)");
    patternFolder.add(this.actions, "nextPattern").name("Next (N)");

    const simulationFolder = this.gui.addFolder("Simulation");
    simulationFolder
      .add(this.simulation, "drift", [1, 2, 4, 8, 16])
      .name("Drift speed")
      .onChange((value) => this.simulation.setDrift(value))
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
    simulationFolder.add(this.actions, "scatterSeeds").name("Scatter seeds");

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
