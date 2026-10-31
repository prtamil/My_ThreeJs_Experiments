import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { SIM, THEMES } from "../components/wave-interference/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.waves = object.userData.waves;
    if (!this.waves) throw new Error("IMGui requires a wave-interference mesh group.");
    this.simulation = this.waves.simulation;
    this.gui = new GUI({ title: "Wave Interference" });
    this.actions = { scatter: () => this.simulation.reset() };

    const field = this.gui.addFolder("Ripple tank");
    field.add(this.simulation, "sourceCount", SIM.minSources, SIM.maxSources, 1)
      .name("Sources").onChange((value) => this.simulation.setSourceCount(value)).listen();
    field.add(this.simulation, "wavelength", SIM.minWavelength, SIM.maxWavelength, SIM.wavelengthStep)
      .name("Wavelength").onChange((value) => this.simulation.setWavelength(value)).listen();
    field.add(this.simulation, "paused").name("Paused").listen();
    field.add(this.actions, "scatter").name("Scatter sources");

    const appearance = this.gui.addFolder("Appearance");
    appearance.add(this.simulation, "theme", indexedOptions(THEMES.map((theme) => theme.name)))
      .name("Theme").onChange((value) => this.simulation.setTheme(value)).listen();
    appearance.add(this.simulation, "showGlyphs").name("ASCII glyphs");

    const view = this.gui.addFolder("View");
    view.add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance").onChange(() => this.controls.update());
    field.open(); appearance.open(); view.close();
  }
  dispose() { this.gui.destroy(); }
}

export { IMGui };
