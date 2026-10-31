import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import {
  SIM,
  THEMES,
} from "../components/electric-potential/config.js";

function indexedOptions(names) {
  return Object.fromEntries(names.map((name, index) => [name, index]));
}

class IMGui {
  constructor(camera, controls, object) {
    this.camera = camera;
    this.controls = controls;
    this.object = object;
    this.electricPotential = object.userData.electricPotential;

    if (!this.electricPotential) {
      throw new Error("IMGui requires an electric-potential mesh group.");
    }

    this.simulation = this.electricPotential.simulation;
    this.gui = new GUI({ title: "Electric Potential Controls" });
    this.actions = {
      reset: () => this.simulation.reset(),
    };

    const fieldFolder = this.gui.addFolder("Charge field");
    fieldFolder
      .add(
        this.simulation,
        "chargeCount",
        SIM.minCharges,
        SIM.maxCharges,
        1,
      )
      .name("Charges")
      .onChange((value) => this.simulation.setChargeCount(value))
      .listen();
    fieldFolder
      .add(
        this.simulation,
        "theme",
        indexedOptions(THEMES.map((theme) => theme.name)),
      )
      .name("Theme")
      .onChange((value) => this.simulation.setTheme(value))
      .listen();
    fieldFolder
      .add(this.simulation, "driftScale", 0, 3, 0.1)
      .name("Drift speed");
    fieldFolder.add(this.simulation, "paused").name("Paused").listen();
    fieldFolder.add(this.simulation, "showGlyphs").name("ASCII glyphs");
    fieldFolder.add(this.simulation, "showContours").name("Contour lines");
    fieldFolder.add(this.actions, "reset").name("Scatter charges");

    const viewFolder = this.gui.addFolder("View");
    viewFolder
      .add(this.camera.position, "z", 8, 30, 0.2)
      .name("Camera distance")
      .onChange(() => this.controls.update());

    fieldFolder.open();
    viewFolder.close();
  }

  dispose() {
    this.gui.destroy();
  }
}

export { IMGui };
