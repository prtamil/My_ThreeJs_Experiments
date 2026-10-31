import { FlowFieldControls } from "./controls.js";
import { FlowFieldSurface } from "./FlowFieldSurface.js";
import { ParticleSystem } from "./ParticleSystem.js";

const MAX_FRAME_DELTA = 0.1;
const MAX_STEPS_PER_FRAME = 32;

class FlowField {
  constructor() {
    this.simulation = new ParticleSystem();
    this.surface = new FlowFieldSurface(this.simulation);
    this.controls = new FlowFieldControls(this.simulation);
    this.group = this.surface.group;
    this.accumulator = 0;
    this.resize = this.resize.bind(this);

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  tick(delta) {
    const frameDelta = Math.min(Math.max(delta, 0), MAX_FRAME_DELTA);

    if (this.simulation.paused) {
      this.accumulator = 0;
    } else {
      this.accumulator += frameDelta;
      const fixedDelta = 1 / this.simulation.simFps;
      let steps = 0;

      while (
        this.accumulator >= fixedDelta &&
        steps < MAX_STEPS_PER_FRAME
      ) {
        this.simulation.step(fixedDelta);
        this.accumulator -= fixedDelta;
        steps += 1;
      }

      if (steps === MAX_STEPS_PER_FRAME) {
        this.accumulator = 0;
      }
    }

    this.surface.update(this.simulation);
    this.controls.update(frameDelta);
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

export { FlowField };
