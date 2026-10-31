import { WorleyControls } from "./controls.js";
import { WorleySimulation } from "./WorleySimulation.js";
import { WorleySurface } from "./WorleySurface.js";

class WorleyCellularNoise {
  constructor() {
    this.simulation = new WorleySimulation();
    this.surface = new WorleySurface(this.simulation);
    this.controls = new WorleyControls(this.simulation);
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
  resize() { this.surface.resize(window.innerWidth, window.innerHeight); }
  dispose() {
    window.removeEventListener("resize", this.resize);
    this.controls.dispose();
    this.surface.dispose();
  }
}

export { WorleyCellularNoise };
