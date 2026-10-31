import { WaveControls } from "./controls.js";
import { WaveSimulation } from "./WaveSimulation.js";
import { WaveSurface } from "./WaveSurface.js";

class WaveInterference {
  constructor() {
    this.simulation = new WaveSimulation();
    this.surface = new WaveSurface(this.simulation);
    this.controls = new WaveControls(this.simulation);
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

export { WaveInterference };
