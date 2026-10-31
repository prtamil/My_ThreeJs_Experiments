import { CloudControls } from "./controls.js";
import { CloudSimulation } from "./CloudSimulation.js";
import { CloudSurface } from "./CloudSurface.js";

class SimplexNoiseClouds {
  constructor() {
    this.simulation = new CloudSimulation();
    this.surface = new CloudSurface(this.simulation);
    this.controls = new CloudControls(this.simulation);
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

export { SimplexNoiseClouds };
