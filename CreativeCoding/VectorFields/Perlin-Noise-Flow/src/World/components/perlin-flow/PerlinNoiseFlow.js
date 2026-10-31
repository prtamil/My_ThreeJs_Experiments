import { PerlinFlowControls } from "./controls.js";
import { PerlinFlowSimulation } from "./PerlinFlowSimulation.js";
import { PerlinFlowSurface } from "./PerlinFlowSurface.js";

class PerlinNoiseFlow {
  constructor() {
    this.simulation = new PerlinFlowSimulation();
    this.surface = new PerlinFlowSurface(this.simulation);
    this.controls = new PerlinFlowControls(this.simulation);
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

export { PerlinNoiseFlow };
