import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  GLYPH_SETS,
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "../components/midpoint-displacement/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.coastline = object.userData.coastline;
    if (!this.coastline) throw new Error("IMGui requires a coastline mesh group.");

    this.simulation = this.coastline.simulation;
    this.gui = new GUI({ title: "Midpoint Displacement Controls" });
    this.actions = {
      previousPattern: () => this.simulation.cyclePattern(-1),
      nextPattern: () => this.simulation.cyclePattern(1),
      reset: () => this.simulation.reset(),
    };

    const sceneFolder = this.gui.addFolder("Fractal scene");
    sceneFolder
      .add(this.simulation, "pattern", indexedOptions(PATTERN_NAMES))
      .name("Pattern")
      .onChange((value) => this.simulation.setPattern(value))
      .listen();
    sceneFolder.add(this.actions, "previousPattern").name("Previous");
    sceneFolder.add(this.actions, "nextPattern").name("Next");
    sceneFolder.add(this.actions, "reset").name("Regenerate");

    const simulationFolder = this.gui.addFolder("Simulation");
    simulationFolder
      .add(this.simulation, "morphRate", {
        "0.01x": 0.01,
        "0.0125x": 0.0125,
        "0.025x": 0.025,
        "0.05x": 0.05,
        "0.1x": 0.1,
        "0.2x": 0.2,
        "0.4x": 0.4,
        "0.8x": 0.8,
        "1.6x": 1.6,
        "2.0x": 2,
      })
      .name("Morph rate")
      .onChange((value) => this.simulation.setMorphRate(value))
      .listen();
    simulationFolder
      .add(this.simulation, "tickRate", SIM.minTickRate, SIM.maxTickRate, SIM.tickRateStep)
      .name("Tick rate")
      .onChange((value) => this.simulation.setTickRate(value))
      .listen();
    simulationFolder.add(this.simulation, "paused").name("Paused").listen();

    const appearanceFolder = this.gui.addFolder("Appearance");
    appearanceFolder
      .add(this.simulation, "theme", indexedOptions(THEMES.map((theme) => theme.name)))
      .name("Theme")
      .onChange((value) => this.simulation.setTheme(value))
      .listen();
    appearanceFolder
      .add(this.simulation, "glyphSet", indexedOptions(GLYPH_SETS.map((set) => set.name)))
      .name("Glyph set")
      .onChange((value) => this.simulation.setGlyphSet(value))
      .listen();
    appearanceFolder.add(this.simulation, "showGlyphs").name("ASCII glyphs");

    const viewFolder = this.gui.addFolder("View");
    viewFolder
      .add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance")
      .onChange(() => this.controls.update());

    sceneFolder.open();
    simulationFolder.open();
    appearanceFolder.close();
    viewFolder.close();
  }

  dispose() { this.gui.destroy(); }
}

export { IMGui };
