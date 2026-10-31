import { MarchingSquaresControls } from "./controls.js";
import { MarchingSquaresSimulation } from "./MarchingSquaresSimulation.js";
import { MarchingSquaresSurface } from "./MarchingSquaresSurface.js";

class MarchingSquaresIsocontours {
  constructor() {
    this.simulation = new MarchingSquaresSimulation();
    this.surface = new MarchingSquaresSurface(this.simulation);
    this.controls = new MarchingSquaresControls(this.simulation);
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

export { MarchingSquaresIsocontours };
