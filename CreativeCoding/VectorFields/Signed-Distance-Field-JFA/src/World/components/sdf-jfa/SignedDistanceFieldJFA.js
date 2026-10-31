import { SDFControls } from "./controls.js";
import { SDFSimulation } from "./SDFSimulation.js";
import { SDFSurface } from "./SDFSurface.js";

class SignedDistanceFieldJFA {
  constructor() {
    this.simulation = new SDFSimulation();
    this.surface = new SDFSurface(this.simulation);
    this.controls = new SDFControls(this.simulation);
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

export { SignedDistanceFieldJFA };
