import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "../components/perlin-flow/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.perlinFlow = object.userData.perlinFlow;

    if (!this.perlinFlow) {
      throw new Error("IMGui requires a Perlin-noise-flow mesh group.");
    }

    this.simulation = this.perlinFlow.simulation;
    this.gui = new GUI({ title: "Perlin Noise Flow" });
    this.actions = {
      previousPattern: () => this.simulation.cyclePattern(-1),
      nextPattern: () => this.simulation.cyclePattern(1),
      newNoise: () => this.simulation.reset(),
    };

    const patternFolder = this.gui.addFolder("Pattern");
    patternFolder
      .add(this.simulation, "pattern", indexedOptions(PATTERN_NAMES))
      .name("Pattern")
      .onChange((value) => this.simulation.setPattern(value))
      .listen();
    patternFolder.add(this.actions, "previousPattern").name("Previous (P)");
    patternFolder.add(this.actions, "nextPattern").name("Next (N)");

    const simulationFolder = this.gui.addFolder("Simulation");
    simulationFolder
      .add(this.simulation, "speed", [1, 2, 4, 8, 16, 32, 64])
      .name("Speed")
      .onChange((value) => this.simulation.setSpeed(value))
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
    simulationFolder.add(this.actions, "newNoise").name("Reset / new noise");

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
