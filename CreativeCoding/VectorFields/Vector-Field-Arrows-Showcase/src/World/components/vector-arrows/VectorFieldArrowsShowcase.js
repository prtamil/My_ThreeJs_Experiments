import { VectorFieldControls } from "./controls.js";
import { VectorFieldSimulation } from "./VectorFieldSimulation.js";
import { VectorFieldSurface } from "./VectorFieldSurface.js";

class VectorFieldArrowsShowcase {
  constructor() {
    this.simulation = new VectorFieldSimulation();
    this.surface = new VectorFieldSurface(this.simulation);
    this.controls = new VectorFieldControls(this.simulation);
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
    this.controls.dispose(); this.surface.dispose();
  }
}

export { VectorFieldArrowsShowcase };
