import { GrayScottControls } from "./controls.js";
import { GrayScottSimulation } from "./GrayScottSimulation.js";
import { GrayScottSurface } from "./GrayScottSurface.js";

class GrayScottReactionDiffusion {
  constructor() {
    this.simulation = new GrayScottSimulation();
    this.surface = new GrayScottSurface(this.simulation);
    this.controls = new GrayScottControls(this.simulation);
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

export { GrayScottReactionDiffusion };
