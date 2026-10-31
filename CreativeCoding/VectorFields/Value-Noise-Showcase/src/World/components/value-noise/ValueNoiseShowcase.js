import { ValueNoiseControls } from "./controls.js";
import { ValueNoiseSimulation } from "./ValueNoiseSimulation.js";
import { ValueNoiseSurface } from "./ValueNoiseSurface.js";

class ValueNoiseShowcase {
  constructor() {
    this.simulation = new ValueNoiseSimulation();
    this.surface = new ValueNoiseSurface(this.simulation);
    this.controls = new ValueNoiseControls(this.simulation);
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

export { ValueNoiseShowcase };
