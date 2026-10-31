import { ChargeField } from "./ChargeField.js";
import { ElectricPotentialControls } from "./controls.js";
import { ElectricPotentialSurface } from "./ElectricPotentialSurface.js";

class ElectricPotentialField {
  constructor() {
    this.simulation = new ChargeField();
    this.surface = new ElectricPotentialSurface(this.simulation);
    this.controls = new ElectricPotentialControls(this.simulation);
    this.group = this.surface.group;
    this.resize = this.resize.bind(this);

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  tick(delta) {
    this.simulation.step(delta);
    this.surface.update(this.simulation);
    this.controls.update(delta);
  }

  resize() {
    this.surface.resize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    window.removeEventListener("resize", this.resize);
    this.controls.dispose();
    this.surface.dispose();
  }
}

export { ElectricPotentialField };
