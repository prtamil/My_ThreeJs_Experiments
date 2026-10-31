import { MagneticFieldControls } from "./controls.js";
import { MagneticFieldSimulation } from "./MagneticFieldSimulation.js";
import { MagneticFieldSurface } from "./MagneticFieldSurface.js";

class MagneticFields {
  constructor() {
    this.simulation = new MagneticFieldSimulation();
    this.surface = new MagneticFieldSurface(this.simulation);
    this.controls = new MagneticFieldControls(this.simulation);
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

export { MagneticFields };
