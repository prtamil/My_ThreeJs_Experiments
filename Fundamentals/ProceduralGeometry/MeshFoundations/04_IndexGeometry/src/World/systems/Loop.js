import { Timer } from "three";

// Prevent a long frame (for example, after pausing in DevTools) from making
// animated objects jump a large distance in a single update.
const MAX_DELTA = 0.1;

class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.updatables = [];
    this.timer = new Timer();
    this.isRunning = false;

    if (typeof document !== "undefined") {
      this.timer.connect(document);
    }
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.timer.reset();

    this.renderer.setAnimationLoop((timestamp) => {
      this.tick(timestamp);
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop() {
    if (!this.isRunning) return;

    this.renderer.setAnimationLoop(null);
    this.isRunning = false;
  }

  tick(timestamp) {
    this.timer.update(timestamp);
    const delta = Math.min(Math.max(this.timer.getDelta(), 0), MAX_DELTA);

    for (const updatable of this.updatables) {
      updatable.tick(delta);
    }
  }

  dispose() {
    this.stop();
    this.timer.dispose();
    this.updatables.length = 0;
  }
}

export { Loop };
