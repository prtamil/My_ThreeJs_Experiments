import { MidpointControls } from "./controls.js";
import { MidpointSimulation } from "./MidpointSimulation.js";
import { MidpointSurface } from "./MidpointSurface.js";

class MidpointDisplacementCoastline {
  constructor() {
    this.simulation = new MidpointSimulation();
    this.surface = new MidpointSurface(this.simulation);
    this.controls = new MidpointControls(this.simulation);
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

export { MidpointDisplacementCoastline };
