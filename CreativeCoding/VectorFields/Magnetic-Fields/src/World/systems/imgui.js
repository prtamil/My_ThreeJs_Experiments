import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  GLYPH_SETS,
  PATTERN_NAMES,
  SIM,
  THEMES,
} from "../components/magnetic-fields/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.magneticFields = object.userData.magneticFields;

    if (!this.magneticFields) {
      throw new Error("IMGui requires a magnetic-fields mesh group.");
    }

    this.simulation = this.magneticFields.simulation;
    this.gui = new GUI({ title: "Magnetic Field Controls" });
    this.actions = {
      previousPattern: () => this.simulation.cyclePattern(-1),
      nextPattern: () => this.simulation.cyclePattern(1),
      reset: () => this.simulation.reset(),
    };

    const patternFolder = this.gui.addFolder("Pole arrangement");
    patternFolder
      .add(
        this.simulation,
        "pattern",
        indexedOptions(PATTERN_NAMES),
      )
      .name("Pattern")
      .onChange((value) => this.simulation.setPattern(value))
      .listen();
    patternFolder.add(this.actions, "previousPattern").name("Previous");
    patternFolder.add(this.actions, "nextPattern").name("Next");
    patternFolder.add(this.actions, "reset").name("Reset particles");

    const simulationFolder = this.gui.addFolder("Simulation");
    simulationFolder
      .add(this.simulation, "speed", {
        "1x": 1,
        "2x": 2,
        "4x": 4,
        "8x": 8,
        "16x": 16,
        "32x": 32,
        "64x": 64,
      })
      .name("Particle speed")
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
    simulationFolder
      .add(
        this.simulation,
        "particleCount",
        SIM.minParticles,
        SIM.maxParticles,
        1,
      )
      .name("Particles")
      .onChange((value) => this.simulation.setParticleCount(value))
      .listen();
    simulationFolder
      .add(this.simulation, "driftRate", 0, 1, 0.01)
      .name("Pole drift");
    simulationFolder.add(this.simulation, "paused").name("Paused").listen();

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
      .add(
        this.simulation,
        "glyphSet",
        indexedOptions(GLYPH_SETS.map((glyphSet) => glyphSet.name)),
      )
      .name("Glyph set")
      .onChange((value) => this.simulation.setGlyphSet(value))
      .listen();
    appearanceFolder.add(this.simulation, "showGlyphs").name("ASCII glyphs");
    appearanceFolder.add(this.simulation, "showPoles").name("N/S markers");

    const viewFolder = this.gui.addFolder("View");
    viewFolder
      .add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance")
      .onChange(() => this.controls.update());

    patternFolder.open();
    simulationFolder.open();
    appearanceFolder.close();
    viewFolder.close();
  }

  dispose() {
    this.gui.destroy();
  }
}

export { IMGui };
