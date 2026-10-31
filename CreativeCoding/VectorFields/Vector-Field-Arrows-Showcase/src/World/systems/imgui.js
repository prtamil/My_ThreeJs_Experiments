import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { PATTERN_NAMES, PATTERN_TIERS, SIM, THEMES } from "../components/vector-arrows/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.vectorField = object.userData.vectorField;
    if (!this.vectorField) throw new Error("IMGui requires a vector-field mesh group.");
    this.simulation = this.vectorField.simulation;
    this.gui = new GUI({ title: "Vector Field Arrows" });
    this.actions = {
      previousPattern: () => this.simulation.cyclePattern(-1),
      nextPattern: () => this.simulation.cyclePattern(1),
      reset: () => this.simulation.reset(),
    };
    const options = PATTERN_NAMES.map((name, index) => `${PATTERN_TIERS[index]} / ${name}`);
    const pattern = this.gui.addFolder("Vector field");
    pattern.add(this.simulation, "pattern", indexedOptions(options))
      .name("Pattern").onChange((value) => this.simulation.setPattern(value)).listen();
    pattern.add(this.actions, "previousPattern").name("Previous (P)");
    pattern.add(this.actions, "nextPattern").name("Next (N)");

    const simulation = this.gui.addFolder("Simulation");
    simulation.add(this.simulation, "motion").name("Roaming motion (M)")
      .onChange(() => this.simulation.evaluateField()).listen();
    simulation.add(this.simulation, "drift", [1, 2, 4, 8, 16])
      .name("Drift speed").onChange((value) => this.simulation.setDrift(value)).listen();
    simulation.add(this.simulation, "tickRate", SIM.minTickRate, SIM.maxTickRate, SIM.tickRateStep)
      .name("Tick rate").onChange((value) => this.simulation.setTickRate(value)).listen();
    simulation.add(this.simulation, "paused").name("Paused").listen();
    simulation.add(this.actions, "reset").name("Reset / new field");

    const appearance = this.gui.addFolder("Appearance");
    appearance.add(this.simulation, "theme", indexedOptions(THEMES.map((theme) => theme.name)))
      .name("Theme").onChange((value) => this.simulation.setTheme(value)).listen();
    appearance.add(this.simulation, "showGlyphs").name("Arrow glyphs");

    const view = this.gui.addFolder("View");
    view.add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance").onChange(() => this.controls.update());
    pattern.open(); simulation.open(); appearance.open(); view.close();
  }
  dispose() { this.gui.destroy(); }
}

export { IMGui };
