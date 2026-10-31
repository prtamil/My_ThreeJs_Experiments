import { DomainWarpControls } from "./controls.js";
import { DomainWarpSimulation } from "./DomainWarpSimulation.js";
import { DomainWarpSurface } from "./DomainWarpSurface.js";
import { SIM } from "./config.js";

class DomainWarpedNoise {
  constructor(renderer) {
    this.simulation = new DomainWarpSimulation();
    this.surface = new DomainWarpSurface(renderer, this.simulation);
    this.controls = new DomainWarpControls(this.simulation);
    this.group = this.surface.group;
    this.accumulator = 0;
    this.resize = this.resize.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
  }

  tick(delta) {
    const frameDelta = Math.min(Math.max(Number(delta) || 0, 0), SIM.maxFrameDelta);
    if (this.simulation.paused) {
      this.accumulator = 0;
    } else {
      this.accumulator += frameDelta;
      const fixedDelta = 1 / this.simulation.simFps;
      let steps = 0;
      while (this.accumulator >= fixedDelta && steps < SIM.maxStepsPerFrame) {
        this.simulation.step(fixedDelta);
        this.accumulator -= fixedDelta;
        steps += 1;
      }
      if (steps === SIM.maxStepsPerFrame) this.accumulator = 0;
    }
    this.surface.update(this.simulation);
    this.controls.update(frameDelta);
  }

  resize() { this.surface.resize(window.innerWidth, window.innerHeight); }

  dispose() {
    window.removeEventListener("resize", this.resize);
    this.controls.dispose();
    this.surface.dispose();
  }
}

export { DomainWarpedNoise };
