import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  PATTERNS,
  SIM,
  THEMES,
} from "../components/marching-squares/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.marchingSquares = object.userData.marchingSquares;

    if (!this.marchingSquares) {
      throw new Error("IMGui requires a marching-squares mesh group.");
    }

    this.simulation = this.marchingSquares.simulation;
    this.gui = new GUI({ title: "Marching Squares Controls" });
    this.actions = {
      previousPattern: () => this.simulation.cyclePattern(-1),
      nextPattern: () => this.simulation.cyclePattern(1),
      reset: () => this.simulation.reset(),
    };

    const contourFolder = this.gui.addFolder("Contour showcase");
    contourFolder
      .add(
        this.simulation,
        "pattern",
        indexedOptions(PATTERNS.map((pattern) => pattern.name)),
      )
      .name("Pattern")
      .onChange((value) => this.simulation.setPattern(value))
      .listen();
    contourFolder.add(this.actions, "previousPattern").name("Previous");
    contourFolder.add(this.actions, "nextPattern").name("Next");
    contourFolder
      .add(
        this.simulation,
        "threshold",
        SIM.minThreshold,
        SIM.maxThreshold,
        SIM.thresholdStep,
      )
      .name("Threshold")
      .onChange((value) => this.simulation.setThreshold(value))
      .listen();

    const simulationFolder = this.gui.addFolder("Simulation");
    simulationFolder
      .add(this.simulation, "driftMultiplier", {
        "1x": 1,
        "2x": 2,
        "4x": 4,
        "8x": 8,
        "16x": 16,
      })
      .name("Field drift")
      .onChange((value) => this.simulation.setDriftMultiplier(value))
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
    simulationFolder.add(this.actions, "reset").name("New noise field");

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
    appearanceFolder.add(this.simulation, "showGlyphs").name("ASCII glyphs");

    const viewFolder = this.gui.addFolder("View");
    viewFolder
      .add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance")
      .onChange(() => this.controls.update());

    contourFolder.open();
    simulationFolder.open();
    appearanceFolder.close();
    viewFolder.close();
  }

  dispose() {
    this.gui.destroy();
  }
}

export { IMGui };
