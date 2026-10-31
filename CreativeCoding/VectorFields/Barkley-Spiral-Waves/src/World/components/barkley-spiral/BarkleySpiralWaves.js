import { BarkleyControls } from "./controls.js";
import { BarkleySimulation } from "./BarkleySimulation.js";
import { BarkleySurface } from "./BarkleySurface.js";
import { SIM } from "./config.js";

class BarkleySpiralWaves {
  constructor() {
    this.simulation = new BarkleySimulation();
    this.surface = new BarkleySurface(this.simulation);
    this.controls = new BarkleyControls(this.simulation);
    this.group = this.surface.group;
    this.accumulator = 0;
    this.resize = this.resize.bind(this);

    window.addEventListener("resize", this.resize);
    this.resize();
  }

  tick(delta) {
    const frameDelta = Math.min(
      Math.max(Number(delta) || 0, 0),
      SIM.maxFrameDelta,
    );

    if (this.simulation.paused) {
      this.accumulator = 0;
    } else {
      const fixedFrame = 1 / SIM.targetFps;
      this.accumulator += frameDelta;
      let frames = 0;

      while (
        this.accumulator >= fixedFrame &&
        frames < SIM.maxFramesPerTick
      ) {
        this.simulation.stepFrame();
        this.accumulator -= fixedFrame;
        frames += 1;
      }

      if (frames === SIM.maxFramesPerTick) {
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

export { BarkleySpiralWaves };
